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
    this.darkModeSwitch = this.darkModeSwitch.bind(this);
  }

  autoRedirectOnHomepageSwitch() {
    this.setState({
      autoRedirectOnHomepage: !this.state.autoRedirectOnHomepage
    }, () => {
      localStorage.setItem('autoRedirectOnHomepage', this.state.autoRedirectOnHomepage ? 'true' : 'false')
    })
  }

  darkModeSwitch= (e) => {
    const val = e.target.selectedOptions[0].value
    console.log(val)
    val === ""? localStorage.removeItem('darkMode') : localStorage.setItem('darkMode', val);
    console.log(localStorage.getItem('darkMode'))
  }


  render() {
    return (
      <div className="w-full md:w-1/2 m-auto p-4 bg-white shadow-lg">
        <div className="text-2xl mb-2">Lokale Settings</div>
        <div className="text-base mt-3">Redirect automatisch naar race op Homepage
          <StateSwitchButton stateStrings={['Off', 'On']} stateVar={this.state.autoRedirectOnHomepage} stateVarSwitch={this.autoRedirectOnHomepageSwitch} />
        </div>
        <div className='text-base mt-3'>Darkmode</div>
        <select id="selectBox" onChange={this.darkModeSwitch}>
        <option value="">System Default</option>
        <option value="dark">Dark</option>
        <option value="light">light</option>
        </select>
        <br/>Current: {localStorage.getItem('darkMode')}
      </div>
    )
  }
}

export default Home