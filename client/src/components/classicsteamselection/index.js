import React, { Component } from 'react';
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
            <div className="homepageContainer">
                <div className="riderformcontainer">
                    <RiderForm selectRider={this.selectRider}/>
                </div>
                <div className="usertablecontainer">
                    <Userselectiontable selection={selection} removeRider={this.removeRider}/>
                </div>
            </div>
        )
    }
}

export default Teamselection