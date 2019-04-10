import React, { Component } from 'react';
import './index.css';

class Navbar extends Component {
    render() {
        let buttonLog;
        let buttonSignProfile;
        let currStage;
        if (this.props.isLoggedIn) {
            buttonSignProfile = <a className='item' href="/profile">Profile</a>;
            buttonLog = <a className='item' href="/logout">Logout</a>;
            currStage = <a className='item' href="/">Current Stage</a>;

        } else {
            buttonSignProfile = <a className='item' href="/signup">Signup</a>;
            buttonLog = <a className='item' href="/login">Login</a>;
        }
        return (
            <div className="navbar">
                {buttonSignProfile}
                {currStage}
                <div className="dropdown">
                    <button className="item dropbtn">Charts</button>
                    <div className="dropdown-content">
                        <a className='item'href="/charts/userscores">Relatief Scoreverloop</a>
                        <a className='item'href="/charts/userrank">Ranking</a>
                        <a className='item'href="/charts/riderpercentage">Puntenaandeel Renner per Etappe</a>
                        <a className='item'href="/charts/riderpercentagetotal">Puntenaandeel Renner totaal</a>
                    </div>
                </div> 
                <div className="dropdown">
                    <button className="item dropbtn">Statistieken</button>
                    <div className="dropdown-content">
                        <a className='item'href="/overzicht/all">Overzicht alle renners</a>
                        <a className='item'href="/overzicht/selected">Overzicht geselecteerde renners</a>
                        <a className='item'href="/etappewinsten">Uitslagen per etappe</a>
                    </div>
                </div> 
                
                {this.props.isAdmin &&
                <a  className='item' href="/admin">Admin</a>
                }
                {this.props.isAdmin &&
                <a  className='item' href="/manualupdate">Manual Update</a>
                }
                {buttonLog}
            </div>
        )
    }
}

export default Navbar