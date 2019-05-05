import React, { Component } from 'react';
import Riderselectiontable from './riderselectiontable'
import Userselectiontable from './userselectiontable'
import axios from 'axios';
import './index.css';

class Teamselection extends Component{
    constructor(props){
        super(props);
        this.state = {
            allRiders: [],
            userSelectionGewoon: [], 
            userSelectionBudget: [], 
            race: 'giro', 
            year: '2019', 
            budgetGewoon: 0,
            budgetBudget: 0,
        showBudget: false}
        this.selectRider = this.selectRider.bind(this);
        this.removeRider = this.removeRider.bind(this);
        this.updatePage = this.updatePage.bind(this);
    }
    selectRider = (riderID) =>{
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/teamselectionadd',{race: race, year: year, rider_participation_id : riderID, budgetParticipation:this.state.showBudget})
        .then((res)=>{
            if(res){
               this.updatePage(res.data,this.state.showBudget);
            }
        })
    }
    removeRider = (riderID) =>{
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/teamselectionremove',{race: race, year: year, rider_participation_id : riderID, budgetParticipation:this.state.showBudget})
        .then((res)=>{
            if(res){
               this.updatePage(res.data,this.state.showBudget);
            }
        })
    }
    componentDidMount() {
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/getridersandteam',{race: race, year: year}) //to: teamselection.js
        .then((res)=>{
            this.setState({
                allRiders: res.data.allRiders,
                userSelectionGewoon: res.data.userSelectionGewoon,
                budgetGewoon: res.data.budgetGewoon,
                userSelectionBudget: res.data.userSelectionBudget,
                budgetBudget: res.data.budgetBudget
            })
        })
    }

    updatePage(data,showBudget){
        console.log(data)
        console.log("budget",showBudget)
        if(data){
            if(showBudget){
                console.log()
                this.setState({
                    userSelectionBudget: data.userSelection,
                    budgetBudget: data.budget
                })
            }else{
                this.setState({
                    userSelectionGewoon: data.userSelection,
                    budgetGewoon: data.budget,
                })
            }
        }
    }

    budgetSwitch(){
        this.setState({showBudget:!this.state.showBudget})
    }

    render(){
        const allRiders = this.state.allRiders
        const selectionGewoon = this.state.userSelectionGewoon
        const budgetGewoon = this.state.budgetGewoon
        const selectionBudget = this.state.userSelectionBudget
        console.log(this.state)
        console.log("bud",selectionBudget)
        const budgetBudget = this.state.budgetBudget
        return(
            <div className="container">
                
                <button className="budgetSwitch" onClick={this.budgetSwitch.bind(this)}>Swicht naar {!this.state.showBudget ? 'Budget':'Gewoon'} </button>
                <div className="ridertablecontainer" style={{display: this.state.showBudget ? 'none' : 'block'}}>
                    <div className="teamindicator">
                        Gewone Team Selectie
                    </div>
                    <Riderselectiontable riders={allRiders} selectionIDs={selectionGewoon.map(rider=> rider.rider_participation_id)} selectionTeams={selectionGewoon.map(rider=> rider.team)} budget={budgetGewoon} selectRider={this.selectRider}/>
                </div>
                <div className="usertablecontainer" style={{display: this.state.showBudget ? 'none' : 'block'}}>
                    <div className="budget">
                        Budget Left: {this.state.budgetGewoon}
                    </div>
                    <Userselectiontable selection={selectionGewoon} removeRider={this.removeRider}/>
                </div>
                <div className="ridertablecontainer" style={{display: !this.state.showBudget ? 'none' : 'block'}}>
                    <div className="teamindicator">
                        Budget Team Selectie
                    </div>
                    <Riderselectiontable riders={allRiders} selectionIDs={selectionBudget.map(rider=> rider.rider_participation_id)} selectionTeams={selectionBudget.map(rider=> rider.team)} budget={budgetBudget} selectRider={this.selectRider} budgetParticipation={true}/>
                </div>
                <div className="usertablecontainer" style={{display: !this.state.showBudget ? 'none' : 'block'}}>
                    <div className="budget">
                        Budget Left: {this.state.budgetBudget}
                    </div>
                    <Userselectiontable selection={selectionBudget} removeRider={this.removeRider}/>
                </div>
            </div>
        )
    }
}

export default Teamselection