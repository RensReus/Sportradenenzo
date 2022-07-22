import { Component } from 'react';
import SwitchButton from '../ui/SwitchButton';
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
    val === ""? localStorage.removeItem('darkMode') : localStorage.setItem('darkMode', val);
  }


  render() {
    return (
      <div className="w-full md:w-1/2 m-auto p-4 bg-white shadow-lg">
        <div className="text-2xl mb-2">Lokale Settings</div>
        <div className="text-base mt-3">Redirect automatisch naar race op Homepage
          <SwitchButton labelLeft='Off' labelRight='On' value={this.state.autoRedirectOnHomepage} action={this.autoRedirectOnHomepageSwitch}/>
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