import { Component } from 'react';
import axios from 'axios';

class PasswordRecoveryForm extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      emailCorrect: true,
      emailSent: false,
    });
    this.submitRecovery = this.submitRecovery.bind(this);
  }

  submitRecovery = async (e) => {
    e.preventDefault();
    const email = e.target.recovery_email.value;
    if(!this.preSubmitEmailCheck(email)){
      return;
    }
    const res = await axios.post('api/recoverytoken', { email: email })
    if(res){
      this.setState({
        emailSent: true,
      });
    }
  }

  emailCheck = (e) => {
    if(!this.state.emailCorrect || e.type === 'blur'){
      const email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      this.setState({emailCorrect: email.test(e.target.value)})
    }
  }

  preSubmitEmailCheck = (submitEmail) => {
    const email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    this.setState({emailCorrect: email.test(submitEmail)})
    return this.state.emailCorrect
  }

  render() {
    let emailInputClass;
    this.state.emailCorrect? emailInputClass = "form-control" : emailInputClass = "form-control error";

    return (
    <div className="relative h-56 w-full m-auto md:w-1/6 md:min-w-min mt-12 bg-white p-5 shadow-2xl rounded-md">
      <div className="absolute top-0 right-0">
        <button className='button_standard text' onClick={(e) => this.props.hideModal(e)}>
          <span className='text-gray-600 text-xl'>X</span>
        </button>
      </div>
      <div className="mt-1 mb-6 font-bold text-gray-600 text-center">
        Enter Your Email
      </div>
      <form action="" onSubmit={this.submitRecovery}>
        <div className="ml-1 mb-1 text-sm text-gray-600">E-mail address</div>
        <div className="mb-4">
          <input 
            className= {emailInputClass}
            name="recovery_email" 
            type="email" 
            placeholder="Email Address" 
            ref={(input) => { this.input = input; }}
            onChange = {this.emailCheck}
            onBlur = {this.emailCheck}
          />
        </div>
        <div className="min-h-min">
        {this.state.emailSent?
          <button className="button_standard green disabled mt-4 float-right rounded-md shadow-md">
            Mail Sent
          </button>
        :
          <button className="landing_button mt-4 float-right rounded-md shadow-md">
            Send Mail
          </button>
        }
        </div>
      </form>
    </div>
    )
  }
}

export default PasswordRecoveryForm