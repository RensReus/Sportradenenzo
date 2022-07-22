import React, { Component } from "react";
class stateSwitchButton extends Component {
    render() {
        return (
          <div className="pl-2 w-32">
            <label className="switch">
              <div class="flex cursor-pointer gap-x-2">
                <span>{this.props.stateStrings[0]}</span>
                <div class="min-w-full h-4">
                  <input type="checkbox" onClick={this.props.stateVarSwitch}></input>
                  <div className="slider round"></div>
                </div>
                <div className='bold -mt-1'>{this.props.stateStrings[1]}</div>
              </div>
            </label>
          </div>
        )
    }
}

export default stateSwitchButton;