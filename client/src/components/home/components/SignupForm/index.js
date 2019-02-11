import React, { Component } from 'react';

class SignupForm extends Component {
    render() {
        return (
            <form action="" onSubmit={this.props.signupSubmit}>
                <div className="inputContainer">
                    <input className="form-control" name="email" ref="email" type="email" placeholder="Email Address"/>
                </div>
                <div className="inputContainer">
                    <input className="form-control" name="username" ref="username" type="username" placeholder="Username"/>
                </div>
                <div className="inputContainer">
                    <input className="form-control" name="password" ref="password" type="password" placeholder="Password"/>
                </div>
                <div className="formButtonContainer">
                    <button className="loginButton">Sign up</button>
                </div>
            </form>
        );
    }
}

export default SignupForm;