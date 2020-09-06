import React, { Component } from 'react';
import StateSwitchButton from '../shared/stateSwitchButton';



class Home extends Component {
  constructor(props) {
    super(props);
    let autoRedirectOnHomepage = localStorage.getItem('autoRedirectOnHomepage') === 'true';
    this.state = ({
      autoRedirectOnHomepage
    });
    document.title = "Settings";
    this.autoRedirectOnHomepageSwitch = this.autoRedirectOnHomepageSwitch.bind(this)
  }

  autoRedirectOnHomepageSwitch() {
    this.setState({
      autoRedirectOnHomepage: !this.state.autoRedirectOnHomepage
    }, () => {
      localStorage.setItem('autoRedirectOnHomepage', this.state.autoRedirectOnHomepage ? 'true' : 'false')
    })
  }


  render() {
    return (
      <div className="standardContainer">
        <div className="settingsGroupDiv">
          <div className='h4'>Lokale Settings</div>
        <div className="settingDiv">
            <div className="h7">Redirect automatisch op Homepage als er maar 1 lopende race is</div>
            <StateSwitchButton stateStrings={['Off', 'On']} stateVar={this.state.autoRedirectOnHomepage} stateVarSwitch={this.autoRedirectOnHomepageSwitch} />
          </div>
        </div>
      </div>
    )
  }
}

export default Home