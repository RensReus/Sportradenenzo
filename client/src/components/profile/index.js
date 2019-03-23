import React, { Component } from 'react';
import axios from 'axios';
//import './index.css';

class ActiveRacesTable extends Component{
    render(){
        return(
            <div>LOL</div>
        )
    }
}

class Profile extends Component{
    componentDidMount() {
        window.alert('Mounted')
        axios.post('/api/getracepartcipation') //to: userparticipation.js
        .then((res)=>{
            console.log(res)
        })
    }
    
    render(){
        return(
            <div className="standardContainer">
                <div className="activeRaces">
                    <ActiveRacesTable/>
                </div>
            </div>
        )
    }
}

export default Profile