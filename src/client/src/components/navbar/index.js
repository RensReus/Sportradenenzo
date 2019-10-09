import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import StatsDropdown from './Dropdowns/Statistieken'
import ChartsDropdown from './Dropdowns/Charts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserShield } from "@fortawesome/free-solid-svg-icons"; //User icon voor profielpagina //Admin icon

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
        if (this.props.isLoggedIn) {
            buttonLog = <button className='item h8' onClick={() => this.logout()}>Logout</button>;
            currStage = <Link className='item' to='/'><span className="h8">Current stage</span></Link>;
            raceOverview = <button className='item' ><span className="h8">Race overview</span></button>;
        } else {
            buttonSignUp = <Link className='item h8' to="/signup">Sign up</Link>;
            buttonLog = <Link className='item h8' to="/">Log in</Link>;
            currStage = '';
        }
        return (
            <div className={"navbar " + this.props.racename}>
                <Link className='item' to='/home'>
                    <img className="logo" src="/images/logo.png" alt="logo_small"></img>
                </Link>
                {buttonSignUp}
                {currStage}
                {raceOverview}
                <ChartsDropdown className="dropdown"/>
                <StatsDropdown className="dropdown"/>
                {this.props.isAdmin &&
                    <Link className='item' to='/admin-sqlinterface'><span className="h8 bold"><FontAwesomeIcon icon={faUserShield}/> Admin</span></Link>
                }
                {buttonLog}
                <img className="racelogo" src="/images/vueltalogo_small.png" alt="vueltalogo_small"></img>
            </div>
        )
    }
}

export default Navbar