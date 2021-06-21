import { Component } from 'react';
import axios from 'axios';

class LoginForm extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      success: false,
    })
    this.submit = this.submit.bind(this);
  }

  submit = async (e) => {
    e.preventDefault();
    const password = e.target.password.value;    
    const password2 = e.target.repeat_password.value;
    if(password !== password2){
      this.setState({error: 'Passwords do not match'})
      return;
    }
    const res = await axios.patch('/api/password', { token: this.props.token, password: password })
    this.setState({success: res.data})
  }

  render() {
    return (
    <div className="flex flex-col max-w-full m-auto md:mr-12 md:ml-4 mt-12 bg-white p-5 shadow-2xl rounded-md">
      {this.state.success?
      <div>Password has been reset, you can now log in.</div>
      :
      <>
      <div className="mt-1 mb-6 font-bold text-gray-600 text-center">
        Set a new password
      </div>
      <form action="" onSubmit={this.submit}>
        <div className="ml-1 mb-1 text-sm text-gray-600">Password</div>
          <div className="mb-4">
            <input className="form-control" name="password" ref="password" type="password"/>
          </div>
        <div className="ml-1 mb-1 text-sm text-gray-600">Repeat Password</div>
        <div className="mb-4">
          <input className="form-control" name="repeat_password" ref="repeat_password" type="password"/>
        </div>
        {this.state.error ? <div className="errordiv">{this.state.error}</div> : <></> }
        <button className="landing_button mt-4 float-right rounded-md shadow-md">
          Renew
        </button>
      </form>
      </>
      }
    </div>
    )
  }
}

export default LoginForm