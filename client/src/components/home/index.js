import React, { Component } from 'react';
//import './index.css';
import axios from 'axios';

import LoginForm from './components/LoginForm/'
import SignupForm from './components/SignupForm/'

class Home extends Component{
    constructor(props){
      super(props);
      this.state = ({Signup: false});
      this.loginSubmit = this.loginSubmit.bind(this);
      this.signupSubmit = this.signupSubmit.bind(this);
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
        let form;
        if (this.state.Signup) {
            form = <SignupForm signupSubmit={this.signupSubmit} />
        }else{
            form = <LoginForm loginSubmit={this.loginSubmit} />
        }
        return(
            <div id="homepage">
                {form}
            </div>
        )
    }
}

export default Home;