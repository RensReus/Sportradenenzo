import React, { Component } from 'react';

class RiderForm extends Component {
    render() {
        return (
            <form action="" onSubmit={this.props.fetchRider}>
                <div className="classicsSelectionFormContainer">
                    <input className="form-control" name="pcsid" ref="pcsid" placeholder="Submit the PCS ID of the rider you want to select" />
                </div>
                <div className="formButtonContainer">
                    <button className="riderSubmitButton">Submit</button>
                </div>
            </form>
        )
    }
}

export default RiderForm