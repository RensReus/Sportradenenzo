import React, { Component } from 'react';
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
            buttonSignProfile = <a className='item' href='/profile'><span className="h3 bold"><FontAwesomeIcon icon={faUser}/> Profile</span></a>;
            buttonLog = <a className='item' href='/logout'>Logout</a>;
            currStage = <a className='item' href='/'><span>Current stage</span></a>;
            raceOverview = <button className='item' ><span>Race overview</span></button>;
            charts = <div className="dropdown">
                <button className="item dropbtn"><span className="h3 bold">Charts <FontAwesomeIcon icon={faAngleDown}/></span></button>
                <div className="dropdown-content">
                    <a className='item' href='/charts/userscores'>Relatief Scoreverloop</a>
                    <a className='item' href='/charts/userrank'>Ranking</a>
                    <a className='item' href='/charts/riderpercentage'>Puntenaandeel Renner per Etappe</a>
                    <a className='item' href='/charts/riderpercentagetotal'>Puntenaandeel Renner totaal</a>
                </div>
            </div>;
            stats = <div className="dropdown">
                <button className="item dropbtn"><span className="h3 bold">Statistieken <FontAwesomeIcon icon={faAngleDown}/></span></button>
                <div className="dropdown-content">
                    <a className='item' href='/etappewinsten'>Uitslagen per etappe</a>
                    <a className='item' href='/overzicht/missedpointsall'>Gemiste punten iedereen</a>
                    <a className='item' href='/overzicht/team'>Team overzicht</a>
                    <a className='item' href='/overzicht/teamall'>Team overzicht iedereen</a>
                    <a className='item' href='/overzicht/all'>Alle renners</a>
                    <a className='item' href='/overzicht/selected'>Geselecteerde renners</a>
                    <a className='item' href='/rulesandpoints'>Regels en Punten uitleg</a>
                    <a className='item' href='/overzicht/missedpoints'>Gemiste punten</a>
                </div>
            </div>;
        } else {
            buttonSignProfile = <a className='item' href="/signup">Sign up</a>;
            buttonLog = <a className='item' href="/login">Sign in</a>;
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
                    <a className='item' href='/admin'><span className="h3 bold"><FontAwesomeIcon icon={faUserShield}/> Admin</span></a>
                }
                {this.props.isAdmin &&
                    <bautton className='item' href='/manualupdate'>Manual Update</bautton>
                }
                {buttonLog}
            </div>
        )
    }
}

export default Navbar