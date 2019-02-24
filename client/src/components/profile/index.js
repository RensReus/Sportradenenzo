import React, { Component } from 'react';
import axios from 'axios';
//import './index.css';

class Profile extends Component{
    constructor(props){
        super(props);
    }
    componentDidMount() {
        axios.post('/api/getparticipationstatus') //to: teamselection.js
        .then((res)=>{

        })
    }
    
    render(){
        return(
            <div className="standardContainer">

            </div>
        )
    }
}

export default Profile