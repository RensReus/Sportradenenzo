import { Component } from 'react';
import axios from 'axios';

interface EmailVerficationProps {
  match: {
    params: {
      token: string
    }
  }
}

interface EmailVerficationState {
  tried: boolean,
  success: boolean,
}

class EmailVerfication extends Component<EmailVerficationProps, EmailVerficationState> {
  constructor(props: EmailVerficationProps) {
    super(props);
    this.state = ({
      tried: false,
      success: false,
    })
  };

  async componentDidMount(){
    const res = await axios.patch('/api/emailVerfication', { token: this.props.match.params.token })
    this.setState({tried: true, success: res.data})
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
              <div className="flex flex-col max-w-full m-auto md:mr-12 md:ml-4 mt-12 bg-white p-5 shadow-2xl rounded-md">
                {this.state.tried?
                  this.state.success? 
                  <div>Success! Your email has been verified.</div>
                  :
                  <div>Oops! Something went wrong, please try again later.</div>
                :
                <div>Verifying, please wait a moment</div>  
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default EmailVerfication;