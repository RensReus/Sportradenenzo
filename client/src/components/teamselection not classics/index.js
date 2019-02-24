import React, { Component } from 'react';
import Riderselectiontable from './riderselectiontable'
import Userselectiontable from './userselectiontable'
import axios from 'axios';
import './index.css';

class Teamselection extends Component{
    constructor(props){
        super(props);
        this.state = {riders: [],userSelection: [], race: 'vuelta', year: '2018', budget: 0}
        this.selectRider = this.selectRider.bind(this);
        this.removeRider = this.removeRider.bind(this);
    }
    selectRider = (riderID) =>{
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/teamselectionadd',{race: race, year: year, rider_participation_id : riderID})
        .then((res)=>{
            if(res){
                const userSelection = this.state.userSelection.push(riderID)
                this.setState({
                    userSelection : userSelection
                })
            }
        })
    }
    removeRider = (riderID) =>{
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/teamselectionremove',{race: race, year: year, rider_participation_id : riderID})
        .then((res)=>{
            console.log(res)
            const userSelection = this.state.userSelection.pop(riderID)
            if(res){
                this.setState({userSelection:userSelection})
            }
        })
    }
    componentDidMount() {
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/getridersandteam',{race: race, year: year}) //to: teamselection.js
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
            <div className="container">
                <div className="ridertablecontainer">
                    <Riderselectiontable riders={riders} selectionLength={selectionlength} budget={budget} selectRider={this.selectRider}/>
                </div>
                <div className="usertablecontainer">
                    <Userselectiontable selection={selection} removeRider={this.removeRider}/>
                </div>
            </div>
        )
    }
}

export default Teamselection