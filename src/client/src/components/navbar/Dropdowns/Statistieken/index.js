import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons"; //Pijltjes voor de dropdown



class StatistiekenDropdown extends Component {
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
      <div className="navbar_dropdown">
        <a className="navbar_item" href="/statistieken/overview" onClick={this.showMenu}><span className="h8">Statistieken <FontAwesomeIcon icon={this.state.showMenu ? (faAngleUp) : (faAngleDown)} /></span></a>
        {
          this.state.showMenu
            ? (
              <div className="navbar_dropdown-content">
                <Link className='navbar_dropdown_item h9' to='/overzicht/etappewinsten'>Uitslagen per etappe</Link>
                <Link className='navbar_dropdown_item h9' to='/overzicht/rondewinsten'>Uitslagen per ronde</Link>
                <Link className='navbar_dropdown_item h9' to='/overzicht/all'>Alle renners</Link>
                <Link className='navbar_dropdown_item h9' to='/overzicht/selected'>Geselecteerde renners</Link>
                <Link className='navbar_dropdown_item h9' to='/overzicht/missedpointsall'>Gemiste punten iedereen</Link>
                <Link className='navbar_dropdown_item h9' to='/overzicht/team'>Team overzicht</Link>
                <Link className='navbar_dropdown_item h9' to='/overzicht/teamall'>Team overzicht iedereen</Link>
                <Link className='navbar_dropdown_item h9' to='/overzicht/teamallsimple'>Team overzicht iedereen Simpel</Link>
                <Link className='navbar_dropdown_item h9' to='/rulesandpoints'>Regels en Punten uitleg</Link>
                <Link className='navbar_dropdown_item h9' to='/overzicht/teamcomparisons'>Selectie vergelijking</Link>
                <Link className='navbar_dropdown_item h9' to='/overzicht/overigestats'>Overige Statistieken</Link>
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

export default StatistiekenDropdown
