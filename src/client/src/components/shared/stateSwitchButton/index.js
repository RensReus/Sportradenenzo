import React, { Component } from "react";
class stateSwitchButton extends Component {
    render() {
        return (
          <div className="pointer" onClick={this.props.stateVarSwitch} >
            <label className="switch">
              <span className={this.props.stateVar ? 'bold grayedOut' : 'bold'}>{this.props.stateStrings[0]} </span>
              <input type="checkbox" defaultChecked={this.props.stateVar}></input>
              <span className="slider round"></span>
              <span className={this.props.stateVar ? 'bold' : 'bold grayedOut'}> {this.props.stateStrings[1]}</span>
            </label>
          </div>
        )
    }
}

export default stateSwitchButton;