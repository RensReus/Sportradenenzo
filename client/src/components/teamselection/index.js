import React, { Component } from 'react';
import Riderselectiontable from './riderselectiontable'
import Userselectiontable from './userselectiontable'
import axios from 'axios';
import './index.css';

class Teamselection extends Component{
    constructor(props){
        super(props);
        this.state = {
            allRidersGewoon: [],
            allRidersBudget: [],
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
        axios.post('/api/teamselectionadd',{race: race, year: year, rider_participation_id : riderID, budget:this.state.showBudget})
        .then((res)=>{
            if(res){
               this.updatePage();
            }
        })
    }
    removeRider = (riderID) =>{
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/teamselectionremove',{race: race, year: year, rider_participation_id : riderID, budget:this.state.showBudget})
        .then((res)=>{
            if(res){
                this.updatePage();
            }
        })
    }
    componentDidMount() {
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/getridersandteam',{race: race, year: year}) //to: teamselection.js
        .then((res)=>{
            this.setState({
                allRidersGewoon: res.data.allRidersGewoon,
                userSelectionGewoon: res.data.userSelectionGewoon,
                budgetGewoon: res.data.budgetGewoon,
                allRidersBudget: res.data.allRidersBudget,
                userSelectionBudget: res.data.userSelectionBudget,
                budgetBudget: res.data.budgetBudget
            })
        })
    }

    updatePage(){
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/getridersandteam',{race: race, year: year}) //to: teamselection.js
        .then((res)=>{
            this.setState({
                allRidersGewoon: res.data.allRidersGewoon,
                userSelectionGewoon: res.data.userSelectionGewoon,
                budgetGewoon: res.data.budgetGewoon,
                allRidersBudget: res.data.allRidersBudget,
                userSelectionBudget: res.data.userSelectionBudget,
                budgetBudget: res.data.budgetBudget
            })
        })
    }

    budgetSwitch(){
        this.setState({showBudget:!this.state.showBudget})
    }

    render(){
        const ridersGewoon = this.state.allRidersGewoon
        const selectionGewoon = this.state.userSelectionGewoon
        const selectionGewoonlength = this.state.userSelectionGewoon.length
        const budgetGewoon = this.state.budgetGewoon
        const ridersBudget = this.state.allRidersBudget
        const selectionBudget = this.state.userSelectionBudget
        const selectionBudgetlength = this.state.userSelectionBudget.length
        const budgetBudget = this.state.budgetBudget
        return(
            <div className="container">
                {this.state.showBudget ? 'Budget':'Gewone'} Team
                <button onClick={this.budgetSwitch.bind(this)}>Swicht naar {!this.state.showBudget ? 'Budget':'Gewoon'} </button>
                <div className="ridertablecontainer" style={{display: this.state.showBudget ? 'none' : 'block'}}>
                    <Riderselectiontable riders={ridersGewoon} selectionLength={selectionGewoonlength} budget={budgetGewoon} selectRider={this.selectRider}/>
                </div>
                <div className="usertablecontainer" style={{display: this.state.showBudget ? 'none' : 'block'}}>
                    <Userselectiontable selection={selectionGewoon} removeRider={this.removeRider}/>
                </div>
                <div className="ridertablecontainer" style={{display: !this.state.showBudget ? 'none' : 'block'}}>
                    <Riderselectiontable riders={ridersBudget} selectionLength={selectionBudgetlength} budget={budgetBudget} selectRider={this.selectRider}/>
                </div>
                <div className="usertablecontainer" style={{display: !this.state.showBudget ? 'none' : 'block'}}>
                    <Userselectiontable selection={selectionBudget} removeRider={this.removeRider}/>
                </div>
            </div>
        )
    }
}

export default Teamselection