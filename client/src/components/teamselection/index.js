import React, { Component } from 'react';
import RiderForm from './riderform'
import Userselectiontable from './userselectiontable'
import axios from 'axios';
import './index.css';

class Teamselection extends Component{
    constructor(props){
        super(props);
        this.state = {riders: [],userSelection: [], race: 'classics', year: '2019', budget: 0}
        this.fetchRider = this.fetchRider.bind(this);
        this.selectRider = this.selectRider.bind(this);
        this.removeRider = this.removeRider.bind(this);
    }
    fetchRider = (e) => {
        e.preventDefault();
        axios.post('/api/getrider',{pcsid: e.target.pcsid.value})
        .then((res)=>{
            console.log(res)
        });
    }
    selectRider(){}
    removeRider(){}
    componentDidMount() {
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/getuserteam',{race: race, year: year}) //to: teamselection.js
        .then((res)=>{
            this.setState({
                riders: res.data.allRiders,
                userSelection: res.data.userSelection,
                budget: res.data.budget
            })
        })
    }
    
    render(){
        const riders = this.state.riders
        const selection = this.state.userSelection
        const selectionlength = this.state.userSelection.length
        const budget = this.state.budget
        return(
            <div className="standardContainer">
                <h1>Budget: {this.state.budget}</h1>
                <div className="riderformcontainer">
                    <RiderForm fetchRider={this.fetchRider}/>
                </div>
                <div className="usertablecontainer">
                    <Userselectiontable selection={selection} removeRider={this.removeRider}/>
                </div>
            </div>
        )
    }
}

export default Teamselection