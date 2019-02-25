import React, { Component } from 'react';
import axios from 'axios';
//import './index.css';

class Profile extends Component{
    constructor(props){
        super(props);
    }
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
                PROFIELPAGINA WIP
            </div>
        )
    }
}

export default Profile