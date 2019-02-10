import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './index.css';

class Navbar extends Component {
    render() {
        let buttonLog;
        let buttonSignProfile;
        if (this.props.isLoggedIn) {
            buttonSignProfile = <li><Link to="/profile">Profile</Link></li>;
            buttonLog = <li><Link to="/logout">Logout</Link></li>;
        } else {
            buttonSignProfile = <li><Link to="/signup">Signup</Link></li>;
            buttonLog = <li><Link to="/login">Login</Link></li>;
        }
        return (
            <div className="navbar">
                <ul>
                    {buttonSignProfile}
                </ul>
            </div>
        )
    }
}

export default Navbar