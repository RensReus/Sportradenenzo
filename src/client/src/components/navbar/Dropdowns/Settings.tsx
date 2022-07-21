import { Component, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog } from "@fortawesome/free-solid-svg-icons";

interface SettingsDropdownProps {
  history: any,
}

interface SettingsDropdownState {
  showMenu: boolean,
}

class SettingsDropdown extends Component<SettingsDropdownProps, SettingsDropdownState> {
    constructor(props: SettingsDropdownProps) {
      super(props);
      
    this.state = {
        showMenu: false,
      }
  
      this.showMenu = this.showMenu.bind(this);
      this.closeMenu = this.closeMenu.bind(this);
    }
    
  showMenu(event: MouseEvent) {
    event.preventDefault();

    this.setState({ showMenu: true }, () => {
      document.addEventListener('click', this.closeMenu);
      document.addEventListener('keydown', this.closeMenu);
    });
  }

  closeMenu() {
    this.setState({ showMenu: false }, () => {
      document.removeEventListener('click', this.closeMenu);
      document.removeEventListener('keydown', this.closeMenu);
    });
  }

  logout() {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    this.props.history.push('/')
  }

  render() {
    return (
    <div className="hidden md:flex group h-full w-10 items-center"
      onPointerEnter={this.showMenu} 
      onPointerLeave={this.closeMenu}
      onClick={this.showMenu}>
        <FontAwesomeIcon className="m-auto duration-500 transform group-hover:text-white group-hover:rotate-45" icon={faCog}/>
        {this.state.showMenu? (
          <div className="navbar_dropdown-content right-2">
            <Link className='navbar_settings_dropdown_item' to="/settings"><span>Settings</span></Link>
            <button className='navbar_settings_dropdown_item' onClick={() => this.logout()}>Logout</button>
          </div>
          ) : (
            null
          )
        }
    </div>
    )
  }
}

export default SettingsDropdown