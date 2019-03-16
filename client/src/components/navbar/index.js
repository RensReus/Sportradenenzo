import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './index.css';

class Navbar extends Component {
    render() {
        let buttonLog;
        let buttonSignProfile;
        if (this.props.isLoggedIn) {
            buttonSignProfile = <div><Link to="/profile">Profile</Link></div>;
            buttonLog = <div><Link to="/logout">Logout</Link></div>;
        } else {
            buttonSignProfile = <div><Link to="/signup">Signup</Link></div>;
            buttonLog = <div><Link to="/login">Login</Link></div>;
        }
        return (
            <div className="navbar">
                <div className="item">
                    {buttonSignProfile}
                </div>
                <div className="dropdown item">
                    <button className="item">Charts</button>
                    <div className="dropdown-content">
                        <a href="/charts/userscores">Relatief Scoreverloop</a>
                        <a href="/charts/riderpercentage">Puntenaandeel Renner per Etappe</a>
                        <a href="/charts/riderpercentagetotal">Puntenaandeel Renner totaal</a>
                    </div>
                </div> 
                <div className="dropdown item">
                    <button className="item">Statistieken</button>
                    <div className="dropdown-content">
                        <a href="/overzicht">Overzicht renners</a>
                        <a href="/etappewinsten">Uitslagen per etappe</a>
                    </div>
                </div> 
                <div className="item">
                    {buttonLog}
                </div>
            </div>
        )
    }
}

export default Navbar