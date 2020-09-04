import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import StatsDropdown from './Dropdowns/Statistieken'
import ChartsDropdown from './Dropdowns/Charts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserShield } from "@fortawesome/free-solid-svg-icons"; //User icon voor profielpagina //Admin icon
import { SRELogo } from '../shared/svg/all-icons.js'

class Navbar extends Component {
  redirect = (url) => {
    this.props.history.push(url);
  }
  logout() {
    localStorage.removeItem('authToken');
    this.props.history.push('/')
  }
  render() {
    let buttonLog;
    let buttonSignUp;
    let currStage;
    let raceOverview;
    if (this.props.isLoading) {
      //Do nothing yet
    } else if (this.props.isLoggedIn) {
      buttonLog = <button className='navbar_item h8' onClick={() => this.logout()}>Logout</button>;
      currStage = <Link className='navbar_item' to='/'><span className="h8">Current stage</span></Link>;
      raceOverview = <button className='navbar_item' ><span className="h8">Race overview</span></button>;
    } else {
      buttonSignUp = <Link className='navbar_item h8' to="/signup">Sign up</Link>;
      buttonLog = <Link className='navbar_item h8' to="/">Log in</Link>;
      currStage = '';
    }
    return (
      <div className={"navbar " + this.props.racename}>
        <Link className='navbar_itemhome' to='/'>
          <SRELogo className={'navbar_homelogo ' + this.props.racename} />
        </Link>
        <div className='navbar_itemcontainer'>
          {buttonSignUp}
          {currStage}
          {raceOverview}
          {!this.props.isLoading &&
          <ChartsDropdown className="navbar_dropdown" />
          }
          {!this.props.isLoading &&
          <StatsDropdown className="navbar_dropdown" />
          }
          {this.props.isAdmin &&
            <Link className='navbar_item' to='/admin-sqlinterface'><span className="h8 bold"><FontAwesomeIcon icon={faUserShield} /> Admin</span></Link>
          }
          {buttonLog}
        </div>
        <img className="navbar_racelogo" src="/images/vueltalogo_small.png" alt="vueltalogo_small"></img>
        {/* TODO Arjen change based on race*/}
      </div>
    )
  }
}

export default Navbar