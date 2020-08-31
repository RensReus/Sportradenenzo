import React, { Component } from "react";
class stateSwitchButton extends Component {
    render() {
        return (
            <div className='budgettext h7'>
            <span className={this.props.stateVar ? 'bold grayedOut' : 'bold'}>{this.props.stateStrings[0]} </span>
            <label className="switch">
                <input type="checkbox" onClick={this.props.stateVarSwitch}></input>
                <span className="slider round"></span>
            </label>
            <span className={this.props.stateVar ? 'bold' : 'bold grayedOut'}> {this.props.stateStrings[1]}</span>
          </div>
        )
    }
}

export default stateSwitchButton;