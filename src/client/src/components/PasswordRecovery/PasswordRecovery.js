import { Component } from 'react';
import './index.css';
import PasswordForm from './PasswordForm';

class PasswordRecovery extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      token: '',
    });
  };

  componentDidMount(){
    this.setState({
      token: this.props.match.params.token
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
            <div className='block min-w-min'>
              <PasswordForm history={this.props.history} token={this.state.token}/>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default PasswordRecovery;