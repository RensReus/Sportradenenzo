import React, { Component } from 'react';
import './index.css';
import axios from 'axios';

class Usernamefield extends Component{
    render(){
        return(
            <div className="inputContainer">
                <input className="form-control" name="username" ref="username" type="username" placeholder="Username"/>
            </div>
        )
    }
}

class Home extends Component{
    constructor(props){
      super(props);
      this.state = ({Signup: false, error: ''});
      this.loginSubmit = this.loginSubmit.bind(this);
      this.signupSubmit = this.signupSubmit.bind(this);
      this.formButton = this.formButton.bind(this);
    }
    loginSubmit = (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        axios.post('api/login',{email: email,password: password}) //Stuur de form naar de server
        .then((res) => {
            if(res.data===true){
                console.log('TRUE')
                this.props.history.push('/');
            }else{
                this.setState({error: 'Login failed: incorrect email/password combination'})
            }
        })
        .catch(function (error) {
            throw error
        });
    }
    signupSubmit = (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const username = e.target.username.value;
        const password = e.target.password.value;
        axios.post('api/signup',{email: email, username: username, password: password})
        .then((res) => {
            if(res.data.succes){
                this.props.history.push('/')
            }else{
                this.setState({error: res.data.error})
            }
        })
    }
    formButton = () => {
        if(this.state.Signup){
            this.setState({Signup: false, error: ''});
        }else{
            this.setState({Signup: true, error: ''});
        }
    }
    render() {
        var classNameSignup = "formTab"
        var classNameLogin = "formTab active"
        let submit;
        let usernamefield;
        let buttontext;
        if (this.state.Signup) {
            submit = this.signupSubmit
            classNameSignup = "formTab active"
            classNameLogin = "formTab"
            usernamefield = <Usernamefield/>
            buttontext = "Sign up"
        }else{
            submit = this.loginSubmit
            classNameSignup = "formTab"
            classNameLogin = "formTab active"
            usernamefield = ''
            buttontext = "Sign in"
            
        }
        return(
            <div className="homepageContainer">
                <button id="logintabButton" className={classNameLogin} onClick={this.formButton}>Sign in</button>
                <button id="signuptabButton" className={classNameSignup} onClick={this.formButton}>Sign up</button>
                <div className="formsAndMore">
                    <form action="" onSubmit={submit}>
                        <div className="inputContainer">
                            <input className="form-control" name="email" ref="email" type="email" placeholder="Email Address" ref={(input) => { this.input = input; }}/>
                        </div>
                        {usernamefield}
                        <div className="inputContainer">
                            <input className="form-control" name="password" ref="password" type="password" placeholder="Password"/>
                        </div>
                        <div className="formButtonContainer">
                            <button className="loginButton">{buttontext}</button>
                        </div>
                    </form>
                    <div className="errordiv">{this.state.error}</div>
                </div>
                <div>
                    
                </div>
            </div>
        )
    }
}

export default Home;