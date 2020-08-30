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
          <a className="navbar_item" href="/charts/overview" onClick={this.showMenu}><span className="h8">Charts <FontAwesomeIcon icon={this.state.showMenu ? (faAngleUp):(faAngleDown)}/></span></a>
          {
            this.state.showMenu
              ? (
                <div className="navbar_dropdown-content">
                    <Link className='navbar_dropdown_item h9' to='/charts/userscores'>Relatief Scoreverloop</Link>
                    <Link className='navbar_dropdown_item h9' to='/charts/userrank'>Ranking</Link>
                    <Link className='navbar_dropdown_item h9' to='/charts/riderpercentage'>Puntenaandeel Renner per Etappe</Link>
                    {/* <Link className='navbar_dropdown_item h9' to='/charts/riderpercentagetotal'>Puntenaandeel Renner totaal</Link> */}
                    <Link className='navbar_dropdown_item h9' to='/charts/scorespread'>Score verdeling</Link>
                    <Link className='navbar_dropdown_item h9' to='/charts/totalscorespread'>Score verdeling Totaal</Link>
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
