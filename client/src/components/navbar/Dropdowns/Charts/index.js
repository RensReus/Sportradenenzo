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
          <a className="item" href="/charts/overview" onClick={this.showMenu}><span className="h3">Charts <FontAwesomeIcon icon={this.state.showMenu ? (faAngleUp):(faAngleDown)}/></span></a>
          {
            this.state.showMenu
              ? (
                <div className="dropdown-content">
                    <Link className='item' to='/charts/userscores'>Relatief Scoreverloop</Link>
                    <Link className='item' to='/charts/userrank'>Ranking</Link>
                    <Link className='item' to='/charts/riderpercentage'>Puntenaandeel Renner per Etappe</Link>
                    <Link className='item' to='/charts/riderpercentagetotal'>Puntenaandeel Renner totaal</Link>
                    <Link className='item' to='/charts/scorespread'>Score verdeling</Link>
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
