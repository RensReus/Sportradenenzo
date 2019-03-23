import React, { Component } from 'react';
import './index.css';

class Navbar extends Component {
    render() {
        let buttonLog;
        let buttonSignProfile;
        let currStage;
        if (this.props.isLoggedIn) {
            buttonSignProfile = <div><a  className='nolink' href="/profile">Profile</a></div>;
            buttonLog = <div><a  className='nolink' href="/logout">Logout</a></div>;
            currStage = <div><a  className='nolink' href="/">Current Stage</a></div>;

        } else {
            buttonSignProfile = <div><a  className='nolink' href="/signup">Signup</a></div>;
            buttonLog = <div><a  className='nolink' href="/login">Login</a></div>;
        }
        return (
            <div className="navbar">
                <div className="item">
                    {buttonSignProfile}
                </div>
                <div className="item">
                    {currStage}
                </div>
                <div className="dropdown">
                    <button className="item dropbtn">Charts</button>
                    <div className="dropdown-content">
                        <a href="/charts/userscores">Relatief Scoreverloop</a>
                        <a href="/charts/riderpercentage">Puntenaandeel Renner per Etappe</a>
                        <a href="/charts/riderpercentagetotal">Puntenaandeel Renner totaal</a>
                    </div>
                </div> 
                <div className="dropdown" onClick={() => { this.showDropdown() }}>
                    <button className="item dropbtn">Statistieken</button>
                    <div className="dropdown-content">
                        <a href="/overzicht">Overzicht renners</a>
                        <a href="/etappewinsten">Uitslagen per etappe</a>
                    </div>
                </div> 
                {this.props.isAdmin &&
                <div className="item"><div><a  className='nolink' href="/admin">Admin</a></div></div>
                }
                <div className="item">
                    {buttonLog}
                </div>
            </div>
        )
    }
}

export default Navbar