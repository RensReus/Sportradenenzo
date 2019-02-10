import React, { Component } from 'react';

class SignupForm extends Component {
    render() {
        return (
            <form action="" onSubmit={this.props.signupSubmit}>
                <div>
                    <label>Username:</label>
                    <input type="text" name="email" id="email" />
                </div>
                <div>
                    <label>Email:</label>
                    <input type="text" name="email" id="email" />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" name="password" id="password" />
                </div>
                <button>Submit</button>
            </form>
        );
    }
}

export default SignupForm;