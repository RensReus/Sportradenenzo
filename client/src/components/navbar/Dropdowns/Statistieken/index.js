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
        <div className="dropdown">
          <a className="item"  onClick={this.showMenu}><span className="h3">Statistieken <FontAwesomeIcon icon={this.state.showMenu ? (faAngleUp):(faAngleDown)}/></span></a>
          {
            this.state.showMenu
              ? (
                <div className="dropdown-content">
                    <Link className='item' to='/etappewinsten'>Uitslagen per etappe</Link>
                    <Link className='item' to='/overzicht/missedpointsall'>Gemiste punten iedereen</Link>
                    <Link className='item' to='/overzicht/team'>Team overzicht</Link>
                    <Link className='item' to='/overzicht/teamall'>Team overzicht iedereen</Link>
                    <Link className='item' to='/overzicht/teamallsimple'>Team overzicht iedereen Simpel</Link>
                    <Link className='item' to='/overzicht/all'>Alle renners</Link>
                    <Link className='item' to='/overzicht/selected'>Geselecteerde renners</Link>
                    <Link className='item' to='/rulesandpoints'>Regels en Punten uitleg</Link>
                    <Link className='item' to='/overzicht/missedpoints'>Gemiste punten</Link>
                    <Link className='item' to='/overzicht/overigestats'>Overige Statistieken</Link>
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
