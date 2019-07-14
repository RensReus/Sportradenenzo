import React, { Component } from 'react';
import './index.css';

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
        let charts;
        let stats;
        if (this.props.isLoggedIn) {
            buttonSignProfile = <a className='item' href="/profile">Profile</a>;
            buttonLog = <button className='item' onClick={() => this.logout()}>Logout</button>;
            currStage = <a className='item' href="/">Current stage</a>;
            charts = <div className="dropdown">
                <a className="item dropbtn">Charts</a>
                <div className="dropdown-content">
                    <a className='item' href="/charts/userscores">Relatief Scoreverloop</a>
                    <a className='item' href="/charts/userrank">Ranking</a>
                    <a className='item' href="/charts/riderpercentage">Puntenaandeel Renner per Etappe</a>
                    <a className='item' href="/charts/riderpercentagetotal">Puntenaandeel Renner totaal</a>
                </div>
            </div>;
            stats = <div className="dropdown">
                <a className="item dropbtn">Statistieken</a>
                <div className="dropdown-content">
                    <a className='item' href="/etappewinsten">Uitslagen per etappe</a>
                    <a className='item' href="/overzicht/missedpoints">Gemiste punten</a>
                    <a className='item' href="/overzicht/missedpointsall">Gemiste punten iedereen</a>
                    <a className='item' href="/overzicht/team">Team overzicht</a>
                    <a className='item' href="/overzicht/teamall">Team overzicht iedereen</a>
                    <a className='item' href="/overzicht/all">Alle renners</a>
                    <a className='item' href="/overzicht/selected">Geselecteerde renners</a>
                    <a className='item' href="/rulesandpoints">Regels en Punten uitleg</a>
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
                {buttonSignProfile}
                {currStage}

                {charts}
                {stats}

                {this.props.isAdmin &&
                    <a className='item' href="/admin" onClick={() => this.redirect('/admin')}>Admin</a>
                }
                {this.props.isAdmin &&
                    <a className='item' href="/manualupdate" onClick={() => this.redirect('/manualupdate')}>Manual Update</a>
                }
                {buttonLog}
            </div>
        )
    }
}

export default Navbar