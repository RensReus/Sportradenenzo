import React, { Component } from 'react';
import './index.css';
import axios from 'axios';
import FlagIcon from '../shared/flagIcon'
import { ReactComponent as HillImage } from '../shared/svg/Hills.svg'

class Usernamefield extends Component{
    render(){
        return(
            <div className="inputContainer">
                <input className="form-control" name="username" ref="username" type="username" placeholder="Username"/>
            </div>
        )
    }
}

class LogInSignUp extends Component{
    constructor(props){
      super(props);
      this.state = ({
          Signup: this.props.Signup, 
          error: ''});
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
            if(res.data.succes){ 
                localStorage.setItem('authToken', res.data.token);
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
                localStorage.setItem('authToken', res.data.token);
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
        let submit;
        let usernamefield;
        let buttontext;
        if (this.state.Signup) {
            submit = this.signupSubmit
            usernamefield = <Usernamefield/>
            buttontext = "Sign up"
        }else{
            submit = this.loginSubmit
            usernamefield = ''
            buttontext = "Sign in"
            
        }
        return(
            <div className="homepageContainer">
                <div className='home_headers_container'>
                    <span className='home_header_text h6'>Create your own fantasy cycling team</span>
                    <span className='home_header_text h6'>Upcoming races</span>
                </div>
                <div className="formContainer">
                    <form action="" onSubmit={submit}>
                        <div className="inputContainer">
                            <input className="form-control" name="username" ref="username" type="username" placeholder="Username"/>
                        </div>
                        <div className="inputContainer">
                            <input className="form-control" name="email" type="email" placeholder="Email Address" ref={(input) => { this.input = input; }}/>
                        </div>
                        {usernamefield}
                        <div className="inputContainer">
                            <input className="form-control" name="password" ref="password" type="password" placeholder="Password"/>
                        </div>
                        <div className="formButtonContainer">
                            <button className="plain blue">{buttontext}</button>
                        </div>
                    </form>
                    <div className="errordiv">{this.state.error}</div>
                <button className='plain blue'>Sign up</button>
                </div>
                <div className='home_news_container'>
                    <div className='home_news_headerrow'>
                        <span className='home_news_header h7 bold'>Spring classics 2020</span>
                        <span className='home_news_header_date h7'>Deadline: 29-2</span>
                        <div className='home_news_image_container'>
                            <div className='home_news_image_shadow'></div>
                            <HillImage/>
                        </div>
                    </div>
                    <div className='home_news_tablerows'>
                        <span className='home_news_row h8'><FlagIcon code='be'/> Omloop het Nieuwsblad</span>
                        <span className='home_news_row_date h9'>29-02</span>
                        <span className='home_news_row h8'><FlagIcon code='it'/> Strade Bianche</span>
                        <span className='home_news_row_date h9'>07-03</span>
                        <span className='home_news_row h8'><FlagIcon code='it'/> Milano-Sanremo</span>
                        <span className='home_news_row_date h9'>21-03</span>
                        <span className='home_news_row h8'><FlagIcon code='be'/> E3 BinckBank Classic</span>
                        <span className='home_news_row_date h9'>27-03</span>
                        <span className='home_news_row h8'><FlagIcon code='be'/> Gent-Wevelgem</span>
                        <span className='home_news_row_date h9'>29-03</span>
                        <span className='home_news_row h8'><FlagIcon code='be'/> Dwars door Vlaanderen</span>
                        <span className='home_news_row_date h9'>01-04</span>
                        <span className='home_news_row h8'><FlagIcon code='be'/> Ronde van Vlaanderen</span>
                        <span className='home_news_row_date h9'>05-04</span>
                        <span className='home_news_row h8'><FlagIcon code='fr'/> Parijs-Roubaix</span>
                        <span className='home_news_row_date h9'>12-04</span>
                        <span className='home_news_row h8'><FlagIcon code='nl'/> Amstel Gold Race</span>
                        <span className='home_news_row_date h9'>19-04</span>
                        <span className='home_news_row h8'><FlagIcon code='be'/> La Flèche Wallonne</span>
                        <span className='home_news_row_date h9'>22-04</span>
                        <span className='home_news_row h8'><FlagIcon code='be'/> Liège-Bastogne-Liège</span>
                        <span className='home_news_row_date h9'>26-04</span>
                    </div>
                </div>
            </div>
        )
    }
}

export default LogInSignUp;