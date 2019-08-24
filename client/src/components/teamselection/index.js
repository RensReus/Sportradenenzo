import React, { Component } from 'react';
import Riderselectiontable from './riderselectiontable'
import Userselectiontable from './userselectiontable'
import axios from 'axios';
import './index.css';
import BudgetSwitchButton from '../shared/budgetSwitchButton';

class Teamselection extends Component{
    constructor(props){
        super(props);
        this.state = {
            allRiders: [],
            filteredRiders: [],
            userSelectionGewoon: [], 
            userSelectionBudget: [], 
            racename: '', 
            year: '', 
            budgetGewoon: 0,
            budgetBudget: 0,
            joinButton: '',
            filtervalue: '',
            showBudget: false
        }
        this.addRider = this.addRider.bind(this);
        this.removeRider = this.removeRider.bind(this);
        this.updatePage = this.updatePage.bind(this);
        this.budgetSwitch = this.budgetSwitch.bind(this);
        this.initialRender = this.initialRender.bind(this);
        this.filter = this.filter.bind(this);
    }

    componentDidMount() {
        this.setState({
            racename: this.props.racename,
            year: this.props.year
        },()=>{
            this.initialRender()
        })
    }

    initialRender(){
        const race = this.state.racename
        const year = this.state.year;
        document.title = "Team Keuze " + race;
        if(this.props.redirect === '/teamselection'){
            axios.post('/api/getridersandteam',{race, year, token: localStorage.getItem('authToken')}) //to: teamselection.js
            .then((res)=>{
                if(res.data.noParticipation){
                    this.setState({
                        joinButton: <button className={"buttonStandard joinRace " + this.state.racename} onClick={() => this.joinRace()}>Klik hier om mee te doen aan de {this.state.racename.charAt(0).toUpperCase() + this.state.racename.slice(1)}</button>
                    })
                }else{
                    this.setState({
                        allRiders: res.data.allRiders,
                        filteredRiders: res.data.allRiders,
                        userSelectionGewoon: res.data.userSelectionGewoon,
                        budgetGewoon: res.data.budgetGewoon,
                        userSelectionBudget: res.data.userSelectionBudget,
                        budgetBudget: res.data.budgetBudget
                    })
                }
            })
        }else{
            this.redirect(this.props.redirect)
        }
    }

    joinRace(){
        axios.post('/api/addaccountparticipation',{token: localStorage.getItem('authToken') })
        .then((res)=>{
            if(res){
               if(res.data.participationAdded){
                   this.setState({
                       joinButton:''
                   },()=>{
                       this.initialRender();
                   })
               }
            }
        })
    }

    addRider = (riderID, budgetParticipation) =>{
        const racename = this.state.racename
        const year = this.state.year
        axios.post('/api/teamselectionadd',{race: racename, year, rider_participation_id : riderID, budgetParticipation, token: localStorage.getItem('authToken') })
        .then((res)=>{
            if(res){
               this.updatePage(res.data,budgetParticipation);
            }
        })
    }

    removeRider = (riderID, budgetParticipation) =>{
        const racename = this.state.racename
        const year = this.state.year
        axios.post('/api/teamselectionremove',{race: racename, year, rider_participation_id : riderID, budgetParticipation, token: localStorage.getItem('authToken') })
        .then((res)=>{
            if(res){
               this.updatePage(res.data,budgetParticipation);
            }
        })
    }

    updatePage(data,showBudget){
        if(data){
            if(showBudget){
                this.setState({
                    userSelectionBudget: data.userSelection,
                    budgetBudget: data.budget
                })
            }else{
                this.setState({
                    userSelectionGewoon: data.userSelection,
                    budgetGewoon: data.budget
                })
            }
        }
    }

    budgetSwitch(){
        this.setState({showBudget:!this.state.showBudget})
    }

    redirect = (url) => {
        this.props.history.push(url);
    }

    filter(e){
        this.setState({ filtervalue: e.target.value },()=>{
            var regex = new RegExp("\\w*"+this.state.filtervalue+"\\w*",'i')
            var filteredRiders = [];
            var allRiders = this.state.allRiders;
            for(let i in allRiders){
                if(allRiders[i].name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(regex)||allRiders[i].team.match(regex)){
                    filteredRiders.push(allRiders[i])
                }
            }
            this.setState({filteredRiders})
        })
    }

    render(){
        const allRiders = this.state.filteredRiders
        const selectionGewoon = this.state.userSelectionGewoon
        const budgetGewoon = this.state.budgetGewoon
        const selectionBudget = this.state.userSelectionBudget
        const budgetBudget = this.state.budgetBudget
        return(
            <div className="container">
                <div>
                    <BudgetSwitchButton budget = {this.state.budget} budgetSwitch = {this.budgetSwitch}/>
                    <textarea className = "filterField" value={this.state.filtervalue} onChange={(e) => {this.filter(e)}} />                
                </div>
                
                <div className="ridertablecontainer" style={{display: this.state.showBudget ? 'none' : 'block'}}>
                    <div className="teamindicator">
                        Gewone Team Selectie
                    </div>
                    <Riderselectiontable riders={allRiders} selectionIDs={selectionGewoon.map(rider=> rider.rider_participation_id)} selectionTeams={selectionGewoon.map(rider=> rider.team)} budget={budgetGewoon} addRider={this.addRider} budgetParticipation={false}/>
                </div>
                <div className="usertablecontainer" style={{display: this.state.showBudget ? 'none' : 'block'}}>
                    <div className="budget">
                        Budget Left: {this.state.budgetGewoon} Renners {selectionGewoon.length}/20
                    </div>
                    <Userselectiontable selection={selectionGewoon} removeRider={this.removeRider} budgetParticipation = {false}/>
                </div>
                <div className="ridertablecontainer" style={{display: !this.state.showBudget ? 'none' : 'block'}}>
                    <div className="teamindicator">
                        Budget Team Selectie
                    </div>
                    <Riderselectiontable riders={allRiders} selectionIDs={selectionBudget.map(rider=> rider.rider_participation_id)} selectionTeams={selectionBudget.map(rider=> rider.team)} budget={budgetBudget} addRider={this.addRider} budgetParticipation={true}/>
                </div>
                <div className="usertablecontainer" style={{display: !this.state.showBudget ? 'none' : 'block'}}>
                    <div className="budget">
                        Budget Left: {this.state.budgetBudget} Renners {selectionBudget.length}/20
                    </div>
                    <Userselectiontable selection={selectionBudget} removeRider={this.removeRider} budgetParticipation = {true}/>
                </div>
                <div id="stage1button">
                        <button onClick={() => this.redirect('/stage/1')}>To stages </button>
                </div>
                {this.state.joinButton}
            </div>
        )
    }
}

export default Teamselection