import { Component } from 'react';
import './index.css';
import LoginForm from './LoginForm';
import LoginFormModal from './LoginFormModal';
import { ReactComponent as LogoGiro } from '../shared/svg/LogoGiro2021.svg';
class LogInSignUp extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      signup: false,
    });
    this.signupSwitch = this.signupSwitch.bind(this);
  };

  signupSwitch(){
    this.setState({
      signup: !this.state.signup
    });
  };
  
  render() {
    return (
      <div className="flex flex-col lg:flex-row absolute top-0 left-0 min-h-full w-screen bg-gradient-to-tl from-blue-700 to-blue-500 select-none">
        <div className="fakeStageProfile hidden sm:block"></div>
        <div className="flex flex-col lg:flex-grow">
          <div className="text-center min-w-full ml-0 md:min-w-0 sm:text-left sm:ml-6 my-4 text-white font-sans font-bold">
            <div className="text-4xl md:text-6xl">Sport Raden Enzo</div>
            <div className="text-lg mt-3 md:text-xl">Create your own fantasy cycling team</div>
          </div>
          <div className="flex items-start justify-center flex-row-reverse w-full xl:w-3/4">
            <div className="hidden self-center md:block">
              <div className="mt-10 mb-4 text-center text-white">
                {this.state.signup?
                  <>
                  <div className="text-2xl font-bold">Already have an account?</div>
                  <button className="landing_button my-4 shadow-md" onClick={this.signupSwitch}>Log in</button>
                  </>
                  :
                  <>
                  <div className="text-2xl font-bold">Don't have an account yet?</div>
                  <button className="landing_button my-4 shadow-md" onClick={this.signupSwitch}>Make one</button>
                  </>
                }
              </div>
            </div>
            <div className={this.state.signup? 'hidden' : 'hidden md:block min-w-min'}>
              <LoginForm history={this.props.history} signup={false}/>
            </div>
            <div className={this.state.signup? 'hidden md:block min-w-min' : 'hidden'}>
              <LoginForm history={this.props.history} signup={true}/>
            </div>
            <div className="flex flex-col m-auto mt-16 mb-16 text-lg md:hidden">
              <div className="mb-2 font-bold text-white text-center">Log in to manage your team</div>
              <LoginFormModal signup={false} buttonText='Log in'/>
              <div className="mt-8 mb-2 font-bold text-white text-center">Don't have an account yet?</div>
              <LoginFormModal signup={true} buttonText='Make one'/>
            </div>
          </div>
        </div>
        <div className="self-start z-10 text-xl font-bold mt-10 m-auto md:mx-8">
          <div className="float-right">
            <div className="text-white text-center md:text-left lg:text-center mr-4 mb-4">Upcoming events</div>
            <div className="flex flex-col md:flex-row lg:flex-col">
              <div className="landing_upcoming_event_card shadow-lg">
                <LogoGiro/>
                <div className="mt-4 text-base text-gray-800">Giro d'Italia</div>
              </div>
              <div className="landing_upcoming_event_card shadow-lg">
                <div className="w-24 flex items-center">
                  <img className="h-full" src="images/logo-tour.png"></img>
                  </div>
                <div className="mt-4 text-base text-gray-800">Tour de France</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default LogInSignUp;