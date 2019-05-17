import React, { Component } from 'react';
import axios from 'axios';
//import './index.css';
import underConstruction from '../../under_construction.gif'

class ActiveRacesTable extends Component{
    render(){
        return(
            <div>LOL</div>
        )
    }
}

class Profile extends Component{
    constructor(props) {
        super(props);
        this.state = ({
            upcomingRace_id: 5,
            upcomingParticipation: false          
        });
      }

    componentWillMount(){
        document.title = "Profiel";
        axios.post('/api/getracepartcipation',{race_id : this.state.upcomingRace_id})
        .then((res)=>{
            this.setState({upcomingParticipation: res.data.rowCount>0})
        })
    }

    addParticipation(race_id){
        axios.post('/api/addparticipation',{race_id : race_id})
        .then((res)=>{
            console.log(res);
        })
    }
    
    render(){
        return(
            <div className="standardContainer">
                <div className="activeRaces">
                    <ActiveRacesTable/>
                </div>
                <img src={underConstruction}  alt="still building" />
                <div style={{display: this.state.upcomingParticipation ? 'none' : 'block'}}>
                    Mee doen aan Giro.
                    Budget en gewoon in 1 account;
                    <button onClick={() => {this.addParticipation(5)}} >Click me {";)"}</button>
                </div>
            </div>
        )
    }
}

export default Profile