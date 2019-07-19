import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from "@fortawesome/free-solid-svg-icons"; //User icon voor profielpagina
import { faUserShield } from "@fortawesome/free-solid-svg-icons"; //Admin icon
import { faAngleDown } from "@fortawesome/free-solid-svg-icons"; //Pijltje voor de dropdown
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons"; //Logout icon

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
        let charts;
        let stats;
        if (this.props.isLoggedIn) {
            buttonSignProfile = <Link className='item' to='/profile'><span className="h3 bold"><FontAwesomeIcon icon={faUser}/> Profile</span></Link>;
            buttonLog = <Link className='item' to='/logout'>Logout</Link>;
            currStage = <Link className='item' to='/'><span>Current stage</span></Link>;
            raceOverview = <button className='item' ><span>Race overview</span></button>;
            charts = <div className="dropdown">
                <a className="item dropbtn"><span className="h3 bold">Charts <FontAwesomeIcon icon={faAngleDown}/></span></a>
                <div className="dropdown-content">
                    <Link className='item' to='/charts/userscores'>Relatief Scoreverloop</Link>
                    <Link className='item' to='/charts/userrank'>Ranking</Link>
                    <Link className='item' to='/charts/riderpercentage'>Puntenaandeel Renner per Etappe</Link>
                    <Link className='item' to='/charts/riderpercentagetotal'>Puntenaandeel Renner totaal</Link>
                </div>
            </div>;
            stats = <div className="dropdown">
                <a className="item dropbtn"><span className="h3 bold">Statistieken <FontAwesomeIcon icon={faAngleDown}/></span></a>
                <div className="dropdown-content">
                    <Link className='item' to='/etappewinsten'>Uitslagen per etappe</Link>
                    <Link className='item' to='/overzicht/missedpointsall'>Gemiste punten iedereen</Link>
                    <Link className='item' to='/overzicht/team'>Team overzicht</Link>
                    <Link className='item' to='/overzicht/teamall'>Team overzicht iedereen</Link>
                    <Link className='item' to='/overzicht/all'>Alle renners</Link>
                    <Link className='item' to='/overzicht/selected'>Geselecteerde renners</Link>
                    <Link className='item' to='/rulesandpoints'>Regels en Punten uitleg</Link>
                    <Link className='item' to='/overzicht/missedpoints'>Gemiste punten</Link>
                </div>
            </div>;
        } else {
            buttonSignProfile = <Link className='item' to="/signup">Sign up</Link>;
            buttonLog = <Link className='item' to="/login">Sign in</Link>;
            currStage = '';
            charts = '';
            stats = '';
        }
        return (
            <div className="navbar">
                <span className="logo h1">Sport raden enzo</span>
                {buttonSignProfile}
                {currStage}
                {raceOverview}
                {charts}
                {stats}

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