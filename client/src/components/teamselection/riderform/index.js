import React, { Component } from 'react';

class RiderForm extends Component {
    render() {
        return (
            <div className="classicsSelectionFormContainer">
                <form action="" onSubmit={this.props.fetchRider}>
                    <div className="pcsForm">
                        <input className="riderFormTextbox" name="pcsid" ref="pcsid" placeholder="Enter PCS ID" />
                        <button className="riderSubmitButton">Find ▶</button>
                    </div>
                </form>
                <div className={this.props.errorClass}>{this.props.errorText}</div>
            </div>
        )
    }
}

export default RiderForm