import React, { Component } from "react";
class BudgetSwitchButton extends Component {
    render() {
        return (
            <div className='budgettext h7'>
            <span className={this.props.budget ? 'bold gray' : 'bold black'}>Gewoon </span>
            <label className="switch">
                <input type="checkbox" onClick={this.props.budgetSwitch}></input>
                <span className="slider round"></span>
            </label>
            <span className={this.props.budget ? 'bold black' : 'bold gray'}> Budget</span>
          </div>
        )
    }
}

export default BudgetSwitchButton;