import { Component, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from "@fortawesome/free-solid-svg-icons";
import ChartsDropdown from './ChartsDropdown';
import StatistiekenDropdown from './StatistiekenDropdown';

interface MobileDropdownProps {
  raceName: string,
  currentStageLink: string, 
  history: any,
  isAdmin: boolean,
  isLoggedIn: boolean,
}

interface MobileDropdownState {
  showMenu: boolean,
}

class MobileDropdown extends Component<MobileDropdownProps, MobileDropdownState> {
    constructor(props: MobileDropdownProps) {
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
    <div className="flex md:hidden h-full w-10 items-center" onClick={this.showMenu}>
      <FontAwesomeIcon className="m-auto duration-500 active:text-white transform text-" icon={faBars}/>
      {this.state.showMenu? (
        <div className="navbar_dropdown-content right-2">
          {this.props.isLoggedIn? (
            <>
            <Link className='navbar_settings_dropdown_item' to={this.props.currentStageLink}><span>Current stage</span></Link>
            {this.props.isAdmin &&
            <Link className='navbar_settings_dropdown_item' to='/admin-sqlinterface'>
              <span>Admin</span>
            </Link>
            }
            <Link className='navbar_settings_dropdown_item' to="/settings"><span>Settings</span></Link>
            <button className='navbar_settings_dropdown_item' onClick={() => this.logout()}>Logout</button>
            </>
          ) : (
            <>
            <Link className='navbar_link' to="/signup">Sign up</Link>
            <Link className='navbar_link' to="/">Log in</Link>
            </>
          )}
        </div>
      ) : (
        null
      )
      }
    </div>
    )
  }
}

export default MobileDropdown