import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import StatsDropdown from './Dropdowns/Statistieken'
import ChartsDropdown from './Dropdowns/Charts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUserShield } from "@fortawesome/free-solid-svg-icons"; //User icon voor profielpagina //Admin icon

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
        let buttonSignProfile;
        let currStage;
        let raceOverview;
        if (this.props.isLoggedIn) {
            buttonSignProfile = <Link className='item' to='/profile'><span className="h3 bold"><FontAwesomeIcon icon={faUser}/> Profile</span></Link>;
            buttonLog = <button className='item' onClick={() => this.logout()}>Logout</button>;
            currStage = <Link className='item' to='/'><span>Current stage</span></Link>;
            raceOverview = <button className='item' ><span>Race overview</span></button>;
        } else {
            buttonSignProfile = <Link className='item' to="/signup">Sign up</Link>;
            buttonLog = <Link className='item' to="/login">Sign in</Link>;
            currStage = '';
        }
        return (
            <div className="navbar">
                <span className="logo h1">Sport raden enzo</span>
                {buttonSignProfile}
                {currStage}
                {raceOverview}
                <ChartsDropdown className="dropdown"/>
                <StatsDropdown className="dropdown"/>
                {this.props.isAdmin &&
                    <Link className='item' to='/admin'><span className="h3 bold"><FontAwesomeIcon icon={faUserShield}/> Admin</span></Link>
                }
                {this.props.isAdmin &&
                    <Link className='item' to='/manualupdate'>Manual Update</Link>
                }
                {buttonLog}
            </div>
        )
    }
}

export default Navbar