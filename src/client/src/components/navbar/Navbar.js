import { Component } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import StatsDropdown from './Dropdowns/Statistieken'
import ChartsDropdown from './Dropdowns/Charts'
import SettingsDropdown from './Dropdowns/Settings'
import MobileDropdown from './Dropdowns/Mobile'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldAlt } from "@fortawesome/free-solid-svg-icons";
import { SRELogo } from '../shared/svg/all-icons.js'
import BudgetSwitchButton from './budgetSwitchButton';
import jwt_decode from "jwt-decode";

class Navbar extends Component {
  redirect = (url) => {
    this.props.history.push(url);
  }

  render() {
    let hide_if_not_logged_in = "";
    if (!this.props.isLoggedIn) {
      hide_if_not_logged_in = "hidden";
    }
    const race = this.props.racename;
    const raceColorBase = race === "giro" ? "pink" : race === "tour" ? "yellow" : race === "vuelta" ? "red" : "blue";
    const raceColor = raceColorBase + "-300";
    const raceColorLight = raceColorBase + "-200";

    return (
      <div className={
        "flex fixed justify-left items-center select-none shadow-lg z-50 " +
        "bg-gray-800 text-gray-400 h-12 w-full border-t-2 border-solid gap-x-4 " +
        "border-" + raceColor + " " + hide_if_not_logged_in
      }>
        <Link className='h-full pt-2 pb-2 px-2 ' to='/'>
          <SRELogo className={'h-full fill-current text-' + raceColor + " duration-300 hover:text-" + raceColorLight} />
        </Link>
        <div className='flex items-center gap-x-5 h-full text-lg '>
          {race !== null && <Link className='navbar_link' to={this.props.currentStageLink}><span>Current stage</span></Link>}
          {!this.props.isLoading && <ChartsDropdown showRaceSpecificData={race !== null} />}
          {!this.props.isLoading && <StatsDropdown showRaceSpecificData={race !== null} />}
          {this.props.isAdmin &&
            <Link className='navbar_link' to='/admin-sqlinterface'>
              <span><FontAwesomeIcon icon={faShieldAlt} /> Admin</span>
            </Link>
          }
          {localStorage.getItem('authToken')? (
            jwt_decode(localStorage.getItem('authToken')).account_id <= 5 &&
            <BudgetSwitchButton />) : <></>
          }
        </div>
        <div className="flex flex-row-reverse flex-grow items-center h-full">
          <SettingsDropdown history={this.props.history} />
          <MobileDropdown
            history={this.props.history}
            isLoggedIn={this.props.isLoggedIn}
            isAdmin={this.props.isAdmin}
            currentStageLink={this.props.currentStageLink}
          />
          <img
            className="hidden md:block p-1 h-full object-contain"
            src={`/images/${this.props.racename}.png`}
            alt="logo_small">
          </img>
        </div>
      </div>
    )
  }
}

export default Navbar