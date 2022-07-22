import { Link } from 'react-router-dom';
import './index.css';
import StatsDropdown from './Dropdowns/StatistiekenDropdown'
import ChartsDropdown from './Dropdowns/ChartsDropdown';
import SettingsDropdown from './Dropdowns/Settings'
import MobileDropdown from './Dropdowns/Mobile'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldAlt } from "@fortawesome/free-solid-svg-icons";
import { SRELogo } from '../shared/svg/all-icons.js'
import BudgetSwitchButton from './budgetSwitchButton';
import FabFourSwitchButton from './fabFourSwitchButton';
import jwt_decode from "jwt-decode";
import { AuthToken } from '../../models/AuthToken';

interface NavbarProps {
  currentStageLink: string,
  history: any,
  isAdmin: boolean,
  isLoading: boolean,
  isLoggedIn: boolean,
  racename: string,
}

const Navbar = (props: NavbarProps) => {
  const race = props.racename;
  const raceColorBase = race === "giro" ? "pink" : race === "tour" ? "yellow" : race === "vuelta" ? "red" : "blue";
  const raceColor = raceColorBase + "-300";
  const raceColorLight = raceColorBase + "-200";

  return (
    <div className={
      "flex fixed justify-left items-center select-none shadow-lg z-50 overflow-auto " +
      "bg-gray-800 text-gray-400 h-12 w-full border-t-2 border-solid gap-x-4 " +
      "border-" + raceColor + " " + (props.isLoggedIn? "" : "hidden")
    }>
      <Link className='flex flex-grow md:flex-grow-0 h-full pt-2 pb-2 px-2 overflow-hidden' to='/'>
        <SRELogo className={'h-full fill-current text-' + raceColor + " duration-300 hover:text-" + raceColorLight} />
      </Link>
      <div className='text-lg '>
        <div className='hidden md:flex h-full items-center gap-x-5'>
          {race !== null && <Link className='navbar_link' to={props.currentStageLink}><span>Current stage</span></Link>}
          {!props.isLoading && <ChartsDropdown showRaceSpecificData={race !== null} />}
          {!props.isLoading && <StatsDropdown showRaceSpecificData={race !== null} />}
          {props.isAdmin &&
            <Link className='navbar_link' to='/admin-sqlinterface'>
              <span><FontAwesomeIcon icon={faShieldAlt} /> Admin</span>
            </Link>
          }
          {localStorage.getItem('authToken') ? (
            jwt_decode<AuthToken>(localStorage.getItem('authToken')?? "").account_id <= 5 &&
            <div className="flex pt-2"><BudgetSwitchButton /><FabFourSwitchButton /></div>) : <></>
          }
        </div>
        <div className='flex md:hidden gap-x-4'>
          {!props.isLoading && <ChartsDropdown showRaceSpecificData={race !== null} />}
          {!props.isLoading && <StatsDropdown showRaceSpecificData={race !== null} />}
          {localStorage.getItem('authToken') ? (
            jwt_decode<AuthToken>(localStorage.getItem('authToken')?? "").account_id <= 5 &&
            <div className="flex text-md pt-1"><BudgetSwitchButton /><FabFourSwitchButton /></div>) : <></>
          }
        </div>
      </div>
      <div className="flex flex-row-reverse flex-grow items-center h-full">
        <SettingsDropdown history={props.history} />
        <MobileDropdown
          raceName={race}
          history={props.history}
          isLoggedIn={props.isLoggedIn}
          isAdmin={props.isAdmin}
          currentStageLink={props.currentStageLink}
        />
        <img
          className="hidden md:block p-1 h-full object-contain"
          src={`/images/${props.racename}.png`}
          alt="logo_small">
        </img>
      </div>
    </div>
  )
}

export default Navbar
