import React, { Component } from 'react';
import './index.css';
import axios from 'axios';

class Navbar extends Component {
    redirect = (url) => {
        this.props.history.push(url);
    }
    logout(){
        axios.post('/api/logout')
        .then((res) => {
            if(res.data){
                this.props.history.push('/')
            }else{

            }
        })   
    }
    render() {
        let buttonLog;
        let buttonSignProfile;
        let currStage;
        if (this.props.isLoggedIn) {
            buttonSignProfile = <button className='item' onClick={() => this.redirect('/profile')}>Profile</button>;
            buttonLog = <button className='item' onClick={() => this.logout()}>Logout</button>;
            currStage = <button className='item' onClick={() => this.redirect('/')}>Current stage</button>;
        } else {
            buttonSignProfile = <button className='item' onClick={() => this.redirect('/signup')}>Sign up</button>;
            buttonLog = <button className='item' onClick={() => this.redirect('/login')}>Sign in</button>;
            currStage = '';
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
                <button className='item' onClick={() => this.redirect('/admin')}>Admin</button>
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