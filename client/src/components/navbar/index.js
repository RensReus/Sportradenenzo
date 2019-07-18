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
            buttonSignProfile = <button className='item' onClick={() => this.redirect('/profile')}><span className="h3 bold"><FontAwesomeIcon icon={faUser}/> Profile</span></button>;
            buttonLog = <button className='item' onClick={() => this.logout()}>Logout</button>;
            currStage = <button className='item' onClick={() => this.redirect('/')}><span>Current stage</span></button>;
            raceOverview = <button className='item' ><span>Race overview</span></button>;
            charts = <div className="dropdown">
                <button className="item dropbtn"><span className="h3 bold">Charts <FontAwesomeIcon icon={faAngleDown}/></span></button>
                <div className="dropdown-content">
                    <a className='item' onClick={() => this.redirect('/charts/userscores')}>Relatief Scoreverloop</a>
                    <a className='item' onClick={() => this.redirect('/charts/userrank')}>Ranking</a>
                    <a className='item' onClick={() => this.redirect('/charts/riderpercentage')}>Puntenaandeel Renner per Etappe</a>
                    <a className='item' onClick={() => this.redirect('/charts/riderpercentagetotal')}>Puntenaandeel Renner totaal</a>
                </div>
            </div>;
            stats = <div className="dropdown">
                <button className="item dropbtn"><span className="h3 bold">Statistieken <FontAwesomeIcon icon={faAngleDown}/></span></button>
                <div className="dropdown-content">
                    <a className='item' onClick={() => this.redirect('/etappewinsten')}>Uitslagen per etappe</a>
                    <a className='item' onClick={() => this.redirect('/overzicht/missedpointsall')}>Gemiste punten iedereen</a>
                    <a className='item' onClick={() => this.redirect('/overzicht/team')}>Team overzicht</a>
                    <a className='item' onClick={() => this.redirect('/overzicht/teamall')}>Team overzicht iedereen</a>
                    <a className='item' onClick={() => this.redirect('/overzicht/all')}>Alle renners</a>
                    <a className='item' onClick={() => this.redirect('/overzicht/selected')}>Geselecteerde renners</a>
                    <a className='item' onClick={() => this.redirect('/rulesandpoints')}>Regels en Punten uitleg</a>
                    <a className='item' onClick={() => this.redirect('/overzicht/missedpoints')}>Gemiste punten</a>
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
                    <button className='item' onClick={() => this.redirect('/admin')}><span className="h3 bold"><FontAwesomeIcon icon={faUserShield}/> Admin</span></button>
                }
                {this.props.isAdmin &&
                    <button className='item' onClick={() => this.redirect('/manualupdate')}>Manual Update</button>
                }
                {buttonLog}
            </div>
        )
    }
}

export default Navbar