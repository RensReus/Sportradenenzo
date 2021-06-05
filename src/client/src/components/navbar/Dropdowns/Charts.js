import { Component } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons"; //Pijltjes voor de dropdown
class ChartsDropdown extends Component {
  constructor() {
    super();

    this.state = {
      showMenu: false,
    }

    this.showMenu = this.showMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
  }

  showMenu(event) {
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

  render() {
    return (
      <div className="navbar_link">
        <a href="/charts/overview" onClick={this.showMenu}>
          <span>Charts <FontAwesomeIcon icon={this.state.showMenu ? (faAngleUp) : (faAngleDown)} /></span>
        </a>
        {
          this.state.showMenu
            ? (
              <div className="navbar_dropdown-content">
                { this.props.showRaceSpecificData && [<Link className='navbar_dropdown_item' to='/charts/userscores'>Relatief Scoreverloop</Link>,
                <Link className='navbar_dropdown_item' to='/charts/userrank'>Ranking</Link>,
                <Link className='navbar_dropdown_item' to='/charts/riderpercentage'>Puntenaandeel Renner per Etappe</Link>,
                <Link className='navbar_dropdown_item' to='/charts/scorespread'>Score verdeling</Link>]}
                <Link className='navbar_dropdown_item' to='/charts/totalscorespread'>Score verdeling Totaal</Link>
              </div>
            )
            : (
              null
            )
        }
      </div>
    );
  }
}

export default ChartsDropdown
