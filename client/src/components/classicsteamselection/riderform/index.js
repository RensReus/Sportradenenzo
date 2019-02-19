import React, { Component } from 'react';
import './index.css';

class RiderForm extends Component {
    render() {
        return (
            <form action="" onSubmit={this.props.selectRider}>
                <div className="classicsSelectionFormContainer">
                    <input className="form-control" name="riderSelect" ref="riderSelect" placeholder="Submit the PCS ID of the rider you want to select" />
                </div>
                <div className="formButtonContainer">
                    <button className="riderSubmitButton">Submit</button>
                </div>
            </form>
        )
    }
}

export default RiderForm