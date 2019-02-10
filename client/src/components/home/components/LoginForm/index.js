import React, { Component } from 'react';

class LoginForm extends Component {
    render(){
        return (
            <form action="" onSubmit={this.props.loginSubmit}>
                    <div>
                    <label>Email:</label>
                    <input className="form-control" name="email" ref="email" required type="email" />
                </div>
                <div>
                    <label>Password:</label>
                    <input className="form-control" name="password" ref="password" type="password" />
                </div>
                <button>Submit</button>
            </form>
        );
    };
}

export default LoginForm