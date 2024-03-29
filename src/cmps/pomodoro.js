import React from 'react';
import { Provider, connect } from 'react-redux'
import { createStore } from 'redux'
import SettingChanger from './setting-changer';

const SESSION = "SESSION";
const BREAK = "BREAK";
const INITIAL_STATE = {status: "",time_type: SESSION, time_left: 25 * 60, break_length: 5, session_length: 25};
const BEEP = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/3/success.mp3";

const RESET = "RESET";
const BREAK_CHANGE = "BREAK_CHANGE";
const SESS_CHANGE = "SESS_CHANGE";
const TICK = "TICK";
const SWITCH = "SWITCH";

function breakChangeActioner(change_value){
  return {type: BREAK_CHANGE, change: change_value}
}

function sessChangeActioner(change_value){
  return {type: SESS_CHANGE, change: change_value}
}

function switchStatusActioner(){
  return {type: SWITCH};  
}

function tickActioner(){
  return {type: TICK};
}

function resetActioner(){
  return {type: RESET};  
}

const clockReducer = (state = INITIAL_STATE, action) => {
  switch(action.type){
    case BREAK_CHANGE:
      let new_break = state.break_length + action.change;
      if(new_break > 0 && new_break <= 60){
        return {status: state.status, time_type : state.time_type, time_left : state.time_left, break_length : new_break, session_length: state.session_length};
      }
      return state;
    case SESS_CHANGE:
      let new_session = state.session_length + action.change;
      if(new_session > 0 && new_session <= 60){
        return {status: state.status, time_type : state.time_type, time_left : new_session * 60, break_length : state.break_length, session_length: new_session};
      }
      return state;
    case SWITCH:
      if(state.status == "" || state.status == "paused"){
        return {status: "playing", time_type : state.time_type, time_left : state.time_left, break_length : state.break_length, session_length: state.session_length};
      }
      else{
        return {status: "paused", time_type : state.time_type, time_left : state.time_left, break_length : state.break_length, session_length: state.session_length};
      }
    case TICK:
      if(state.time_left == 0){
        if(state.time_type == SESSION){
          return{status: state.status, time_type: BREAK, time_left: state.break_length * 60, break_length: state.break_length, session_length: state.session_length};
        }
        else{
          return {status: state.status, time_type: SESSION, time_left: state.session_length * 60, break_length: state.break_length, session_length: state.session_length};
        }
      }
      else{
        return {status: state.status, time_type: state.time_type, time_left: state.time_left - 1, break_length: state.break_length, session_length: state.session_length};
      }
    case RESET:
      return INITIAL_STATE;
    default: 
      return state;
  }
}

function mapStateToProps(state){
  return {status: state.status, time_type: state.time_type, time_left: state.time_left, break_length: state.break_length, session_length: state.session_length};
}

function mapDispatchToProps(dispatch){
  return{
    changeBreakLength: function(change){
      dispatch(breakChangeActioner(change));
    },
    changeSessionLength: function(change){
      dispatch(sessChangeActioner(change));
    },
    switch: function(){
      dispatch(switchStatusActioner());
    },
    clockTick: function(){
      dispatch(tickActioner());
    },
    reset: function(){
      dispatch(resetActioner());
    }
  };
}

const store = createStore(clockReducer);

class Pomodoro extends React.Component{
 constructor(props){
   super(props);
   this.timer = "";
   this.getClockTime = this.getClockTime.bind(this);
   this.changeBreak = this.changeBreak.bind(this);
   this.changeSession = this.changeSession.bind(this);
   this.startStop= this.startStop.bind(this);
   this.reset = this.reset.bind(this);
   this.audio = React.createRef();
 } 
  
  //Convert an amount of seconds into the minutes/seconds format to display on a clock
  getClockTime(seconds){
    let min = (Math.floor(seconds/60)).toString().padStart(2,"0");
    let sec = (seconds%60).toString().padStart(2,"0");
    return min + ":" + sec; 
  }
  
  //Change the value of the break length by the value provided
  changeBreak(value){
     this.props.changeBreakLength(value);
  }
  
  //Change the value of the session length by the value provided
  changeSession(value){
   this.props.changeSessionLength(value);
  }
    
  //Start the timer if it ic currently stopped or stop it of it is currently ticking
  startStop(){
    //Code between comments is for ensuring asynchronous tests pass
    this.audio.current.load();
  // this.audio.current.volume = 0.00; 
     let promise = this.audio.current.play();
    if (promise !== undefined) {
      promise.then(_ => {
      }).catch(error => {
      })
    }
    //this.audio.current.volume = 1.0;
    //
    if(this.timer == ""){
      this.props.switch();
      this.timer = setInterval(this.props.clockTick,1000);
    }
    else{
      this.props.switch();
      clearInterval(this.timer);
      this.timer = "";
    }
  }
  
  //Reset the time left, break length and session length parameters to their initial states
  reset(){
    this.audio.current.pause();
    this.audio.current.currentTime = 0;
    if(this.timer != ""){
      clearInterval(this.timer); 
      this.timer = "";
    }
    this.props.reset();
  }
  
  render(){
    let symbol = "fas fa-play"; //If the play or stop icon is to be displayed
    let symbColor = {color: "#66ff66"};
    let canChange = {visibility: "visible"}; // If the plus/minus icons for the break/session length are visible
    let statusColor = "white";
    if(this.props.status != ""){
      canChange.visibility = "hidden";
    }
    if(this.props.status == "playing"){
      symbol = "fas fa-pause";
      statusColor = "#66ff66";
      symbColor.color = "red";
    }
    if (this.props.status == "paused"){
      statusColor = "red";
    }
    let clockRimStyle = {borderColor: statusColor};
    let headColor = {color: statusColor};
    
    let breakLabelColor = {color: "white"};
    let sessLabelColor = {color: "white"};
    if(this.props.status != "" && this.props.time_type == SESSION){
      sessLabelColor.color = statusColor;
    }
    else if (this.props.status != "" && this.props.time_type == BREAK){
      breakLabelColor.color = statusColor;
    }
 return(
 <div id="clock-outer">
   <h1>Pomodoro Clock</h1>
   <audio ref={this.audio} id="beep" src={BEEP}/>
   <div id="center">
     <SettingChanger sname="break" setting={this.props.break_length} changer={this.changeBreak} visible={canChange} labelColor={breakLabelColor}/>
     <div id="timer-cont">
       <div id="time-center" style={clockRimStyle}><h2 id="timer-label" style={headColor}>{this.props.time_type}</h2><span id="time-left">{this.getClockTime(this.props.time_left)}</span></div>
     </div>
     <SettingChanger sname="session" setting={this.props.session_length} changer={this.changeSession} visible={canChange} labelColor={sessLabelColor}/>
   </div>
   <div id="clock-functions-cont">
     <button id="start_stop"  type="button" onClick={this.startStop}><i className={symbol}></i></button>
     <button id="reset" type="button" onClick={this.reset}><i className="fas fa-redo"></i></button>
   </div>
</div>);
  }
}

const PomodoroContainer = connect(mapStateToProps, mapDispatchToProps)(Pomodoro);

class ClockWrapper extends React.Component{
  render(){
    return(
      <Provider store={store}>
        <PomodoroContainer/>
      </Provider>
    );
  }
}

export default ClockWrapper;