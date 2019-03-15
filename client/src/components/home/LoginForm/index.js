import React, { Component } from 'react';

class LoginForm extends Component {
    componentDidMount() {
        this.input.focus();
    }
    render(){
        return (
            <form action="" onSubmit={this.props.loginSubmit}>
                <div className="inputContainer">
                    <input className="form-control" name="email" ref="email" type="email" placeholder="Email Address" ref={(input) => { this.input = input; }}/>
                </div>
                <div className="inputContainer">
                    <input className="form-control" name="password" ref="password" type="password" placeholder="Password"/>
                </div>
                <div className="formButtonContainer">
                    <button className="loginButton">Sign in</button>
                </div>
            </form>
        );
    };
}

export default LoginForm