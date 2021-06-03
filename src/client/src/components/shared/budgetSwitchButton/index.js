import { Component } from "react";
import './index.css'
class BudgetSwitchButton extends Component {
    render() {
        return (
            <div className='budgettext h7'>
            <span className={this.props.budget ? 'bold grayedOut' : 'bold'}></span>
            <label className="switch">
                <input type="checkbox" onClick={this.props.budgetSwitch}></input>
                <span className="slider round"></span>
            </label>
            <span className={this.props.budget ? 'bold' : 'bold grayedOut'}> Budget</span>
          </div>
        )
    }
}

export default BudgetSwitchButton;