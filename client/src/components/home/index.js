import React, { Component } from 'react';
import './index.css';
import axios from 'axios';

import LoginForm from './components/LoginForm/'
import SignupForm from './components/SignupForm/'

class Home extends Component{
    constructor(props){
      super(props);
      this.state = ({Signup: false});
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
            if(res.data){
                this.props.history.push('/teamselection');
            }else{

            }
        })
        .catch(function (error) {
            throw error
        });
    }
    signupSubmit = (e) => {
        e.prevenDefault();
        axios.post('api/signup')
        .then((res) => {
            if(res.data){
                this.props.history.push('/teamselection')
            }else{

            }
        })
    }
    formButton = () => {
        if(this.state.Signup){
            this.setState({Signup: false});
        }else{
            this.setState({Signup: true});
        }
    }
    render() {
        var classNameSignup = "formTab"
        var classNameLogin = "formTab active"
        let form;
        if (this.state.Signup) {
            form = <SignupForm signupSubmit={this.signupSubmit} />
            classNameSignup = "formTab active"
            classNameLogin = "formTab"
        }else{
            form = <LoginForm loginSubmit={this.loginSubmit} />
            classNameSignup = "formTab"
            classNameLogin = "formTab active"
        }
        return(
            <div className="homepageContainer">
                <button id="logintabButton" className={classNameLogin} onClick={this.formButton}>Sign in</button>
                <button id="signuptabButton" className={classNameSignup} onClick={this.formButton}>Sign up</button>
                <div className="formsAndMore">
                    {form}
                </div>
                <div>
                    
                </div>
            </div>
        )
    }
}

export default Home;