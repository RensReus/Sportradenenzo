import React, { Component } from 'react';

class RiderForm extends Component {
    render() {
        return (
            <div className="classicsSelectionFormContainer">
                <form action="" onSubmit={this.props.fetchRider}>
                    <div className="pcsForm">
                        <input className="riderFormTextbox" name="pcsid" ref="pcsid" placeholder="Enter PCS ID" />
                        <button className="riderSubmitButton">Find ></button>
                    </div>
                </form>
                <span className="budget">Budget: {this.props.budget}</span>
                <span className="teamsize">Riders: {this.props.teamsize}/20</span>
            </div>
        )
    }
}

export default RiderForm