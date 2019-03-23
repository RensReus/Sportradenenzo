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
        // window.alert('Mounted')
        var query = `select * from results_points
        inner join rider_participation using (rider_participation_id)
        inner join rider using(rider_id)`;
        axios.post('/api/testasync', { async: false, count: 100, query: query }) //to: userparticipation.js
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