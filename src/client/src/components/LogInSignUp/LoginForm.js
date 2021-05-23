import { Component } from 'react';
import axios from 'axios';

class LoginForm extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      signup: this.props.signup,
      error: ''
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

  signupSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const username = e.target.username.value;
    const password = e.target.password.value;
    axios.post('api/signup', { email: email, username: username, password: password })
      .then((res) => {
        if (res.data.succes) {
          localStorage.setItem('authToken', res.data.token);
          this.props.history.push('/')
        } else {
          this.setState({ error: res.data.error })
        }
      })
  }

  render() {
    let submit;
    this.state.signup? submit = this.signupSubmit : submit = this.loginSubmit

    return (
    <div className="flex flex-col w-96 max-w-full m-auto md:mr-12 md:ml-4 mt-12 bg-white p-5 shadow-2xl rounded-md">
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
          <input className="form-control" name="email" type="email" placeholder="Email Address" ref={(input) => { this.input = input; }} />
        </div>
        <div className="ml-1 mb-1 text-sm text-gray-600">Password</div>
        <div className="mb-4">
          <input className="form-control" name="password" ref="password" type="password" placeholder="Password" />
        </div>
        <button className="landing_button mt-4 float-right rounded-md shadow-md">
          {this.state.signup? 'Sign up' : 'Log in'}
        </button>
      </form>
      <div className="errordiv">{this.state.error}</div>
    </div>
    )
  }
}

export default LoginForm