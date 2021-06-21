import { Component } from 'react';
import axios from 'axios';
import PasswordRecoveryModal from './PasswordRecoveryModal';

class LoginForm extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      signup: this.props.signup,
      error: '',
      emailCorrect: true,
    });
    this.loginSubmit = this.loginSubmit.bind(this);
    this.signupSubmit = this.signupSubmit.bind(this);
  }

  loginSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    axios.post('api/login', { email: email, password: password }) //Stuur de form naar de server
      .then((res) => {
        if (res.data.succes) {
          localStorage.setItem('authToken', res.data.token);
          this.props.history.push('/');
        } else {
          this.setState({ error: 'Login failed: incorrect email/password combination' })
        }
      })
      .catch(function (error) {
        throw error
      });
  }

  emailCheck = (e) => {
    if(!this.state.emailCorrect || e.type === 'blur'){
      const email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      this.setState({emailCorrect: email.test(e.target.value)})
      return this.state.emailCorrect
    }
  }

  preSubmitEmailCheck = (submitEmail) => {
    const email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    this.setState({emailCorrect: email.test(submitEmail)})
    return this.state.emailCorrect
  }

  signupSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const username = e.target.username.value;
    const password = e.target.password.value;
    const password2 = e.target.password2.value;
    if(password !== password2){
      this.setState({error: 'Passwords do not match'})
      return;
    }
    if(!this.preSubmitEmailCheck(email)){
      this.setState({error: 'Email is not a correct address'})
      return;
    }
    axios.post('api/signup', { email: email, username: username, password: password })
      .then((res) => {
        console.log(res)
        if (res.data.succes) {
          axios.post('api/login', { email: email, password: password }) //Stuur de form naar de server
          .then((res) => {
            if (res.data.succes) {
              localStorage.setItem('authToken', res.data.token);
              this.props.history.push('/');
            } else {
              this.setState({ error: 'Login failed: incorrect email/password combination' })
            }
          })
          .catch(function (error) {
            throw error
          });
        } else {
          this.setState({ error: res.data.error })
        }
      })
  }

  render() {
    let submit;
    this.state.signup? submit = this.signupSubmit : submit = this.loginSubmit;
    let emailInputClass;
    this.state.emailCorrect? emailInputClass = "form-control" : emailInputClass = "form-control error";
    
    return (
    <div className="flex flex-col max-w-full m-auto md:mr-12 md:ml-4 mt-12 bg-white p-5 shadow-2xl rounded-md">
      <div className="mt-1 mb-6 font-bold text-gray-600 text-center">
        {this.state.signup? 'Create an account' : 'Log in to manage your team'}
      </div>
      <form action="" onSubmit={submit}>
        {this.state.signup?
          <>
          <div className="ml-1 mb-1 text-sm text-gray-600">Username</div>
          <div className="mb-4">
            <input className="form-control" name="username" ref="username" type="username" placeholder="Username" />
          </div>
          </>
          : null}
        <div className="ml-1 mb-1 text-sm text-gray-600">E-mail address</div>
        <div className="mb-4">
          <input 
            className= {emailInputClass}
            name="email" 
            type="email" 
            placeholder="Email Address" 
            ref={(input) => { this.input = input; }}
            onChange = {this.emailCheck}
            onBlur = {this.emailCheck}
          />
        </div>
        <div className="ml-1 mb-1 text-sm text-gray-600">Password</div>
        <div className="mb-4">
          <input className="form-control" name="password" ref="password" type="password" placeholder="Password" />
        </div>
        {this.state.signup?
          <>
          <div className="ml-1 mb-1 text-sm text-gray-600">Repeat Password</div>
          <div className="mb-4">
            <input className="form-control" name="password2" ref="password2" type="password" placeholder="Password" />
          </div>
          </>
        :
          <></>
        }
        {this.state.error ? <div className="errordiv">{this.state.error}</div> : <></> }
        <button className="landing_button mt-4 float-right rounded-md shadow-md">
          {this.state.signup? 'Sign up' : 'Log in'}
        </button>
      </form>
      {this.state.signup? <></> :
        <div className="float-left">
          <PasswordRecoveryModal/>
        </div>
      }
    </div>
    )
  }
}

export default LoginForm