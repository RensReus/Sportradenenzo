import React, { Component } from 'react';
import axios from 'axios';
import './index.css';
import Table from '../table'

class PouleTableRow extends Component {
    render() {
        return (
            <tr>
                <td className="pouleUser">
                    {this.props.username}
                    <div className="selectionInfo"><Table data={this.props.riders} title={"renners #: "+ this.props.riderCount} /></div>
                </td>
                <td>{this.props.stagescore}</td>
                <td>{this.props.gcscore}</td>
                <td>{this.props.pointscore}</td>
                <td>{this.props.komscore}</td>
                <td>{this.props.youngscore}</td>
                <td>{this.props.totalscore}</td>
            </tr>
        )
    }
}


class PouleTable extends Component {
    render() {
        const rows = [];
        const userScores = this.props.userScores
        userScores.forEach(user => {
            var riders = []
            if (user.riderCount>0) riders = user.riders;
            rows.push(
                <PouleTableRow
                    username={user.username}
                    riderCount={user.riderCount}
                    riders={riders}
                    stagescore={user.stagescore}
                    gcscore={user.gcscore}
                    pointscore={user.pointscore}
                    komscore={user.komscore}
                    youngscore={user.youngscore}
                    totalscore={user.totalscore}
                />
            )
        });

        return (
            <table className="pouleTable">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Stage</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        )
    }
}

class Selectionbutton extends Component{
    selectRider=()=> {
        if(this.props.selected==='unselected'){
            this.props.selectRider(this.props.riderID);
        }
    }
    render(){
        return(
            <button className={this.props.selected} onClick={() => this.selectRider(this.props.riderID)}>{this.props.selected}</button>
        )
    }
}

class SelecTableRow extends Component{
    render(){
        return(
            <tr >
                <td className={this.props.selected}>{this.props.name}</td>
                <td className={this.props.selected}>{this.props.team}</td>
                <td><Selectionbutton selected={this.props.selected} selectRider={this.props.selectRider} riderID={this.props.riderID}/></td>
            </tr>
        )
    }
}


class SelecTable extends Component {
    render() {
        const rows = [];
        const selectionIDs = this.props.selectionIDs;
        const selectionLength = selectionIDs.length;
        this.props.userTeam.map(({lastname,team,rider_participation_id})=>{
            var selected = 'unselected';
            if(selectionIDs.includes(rider_participation_id)){
                selected = 'selected'
            }
            if( selectionLength>=9 && selected!=='selected'){
                rows.push(<SelecTableRow name={lastname} team={team} selected='unselectable' key={rider_participation_id} riderID={rider_participation_id} selectRider={this.props.selectRider}/>)
            }else{
                rows.push(<SelecTableRow name={lastname} team={team} selected={selected} key={rider_participation_id} riderID={rider_participation_id} selectRider={this.props.selectRider}/>)
            }
        })
        return(
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Team</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        )
    }
}

class Stage extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            mode: 'loading',
            race: 'giro',
            year: '2019',
            stage: parseInt(this.props.match.params.stagenumber), //Haal het nummer uit de link
            stageSelectionGewoon: [],
            stageSelectionBudget: [],
            userTeamResult: [],
            userScores: [],
            stageresults: [],
            prevText: "",
            currText: "",
            nextText: "",
            lastStage: false,
            raceStarted: false,
        }
        this.selectRider = this.selectRider.bind(this)
        this.previousStage = this.previousStage.bind(this);
        this.nextStage = this.nextStage.bind(this);
    }
    updateData(stage) {
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/getstage', { race: race, year: year, stage: stage, token: localStorage.getItem('authToken') }) //to: stageresults.js
            .then((res) => {
                console.log(res.data)
                if (res.data.mode === '404') {
                    this.setState({
                        mode: '404'
                    })
                } else if (res.data.mode === 'selection') {
                    this.setState({
                        mode: 'selection',
                        userTeamGewoon: res.data.userTeamGewoon,
                        userTeamBudget: res.data.userTeamBudget,
                        stageSelectionGewoon: res.data.stageSelectionGewoon,
                        stageSelectionBudget: res.data.stageSelectionBudget
                    })
                } else if (res.data.mode === 'results') {
                    this.setState({
                        mode: 'results',
                        userTeamResult: res.data.teamresult,
                        userScores: res.data.userscores,
                        userScoresColtype: res.userScoresColtype,
                        stageresults: res.data.stageresults,
                        prevText: res.data.prevText,
                        currText: res.data.currText,
                        nextText: res.data.nextText,
                        lastStage: res.data.lastStage,
                        raceStarted: res.data.raceStarted
                    })
                }
            })
    }
    previousStage() {
        const currentstage = parseInt(this.state.stage)
        if(currentstage>1){
            this.props.history.push('/stage/' + (currentstage - 1).toString())
            this.setState({
                stage: (currentstage - 1).toString()
            })
            this.updateData((currentstage - 1).toString())
        }
}
    nextStage() {
        if(!this.state.lastStage){
            const currentstage = parseInt(this.state.stage)
            this.props.history.push('/stage/' + (currentstage + 1).toString())
            this.setState({
                stage: (currentstage + 1).toString()
            })
            this.updateData((currentstage + 1).toString())
        }else{
            this.props.history.push('/finalstandings')
        }
    }
    
    selectRider(riderID) {
        window.alert('called' + this.state.stage)
        const stage = this.state.stage
        const race = this.state.race
        const year = this.state.year
        const budget = false
        console.log(stage)
        //axios.post('/api/addridertostage', { 
        //    race: race, 
        //    year: year, 
        //    stage: stage, 
        //    rider_id: riderID, 
        //    budgetParticipation: budget, 
        //    token: localStorage.getItem('authToken') 
        //})
        //    .then((res) => {
        //        console.log(res.data)
        //    })
    }

    componentDidMount() {
        this.updateData(parseInt(this.state.stage));
        this.getSelectionDetails(parseInt(this.state.stage));
    }

    render() {
        const mode = this.state.mode
        const stageSelectionGewoon = this.state.stageSelectionGewoon
        let loadingGif
        let message
        let resTable
        let pTable
        let stResTable
        let selecTable
        let selectionTable
        var prevButton = ''

        if (mode === 'loading'){
            loadingGif = <img className="loadingGif" src="/images/bicycleWheel.gif" alt="bicycleWheel.gif"></img>
            message = <h3>Fetching data..</h3>
        }else if (mode === '404') {
            message = <h3>404: Data not found</h3>
            resTable = ''
            pTable = ''
            stResTable = ''
        } else if (mode === 'selection') {
            selecTable = <SelecTable userTeam={this.state.userTeamGewoon} selectionIDs={stageSelectionGewoon.map(rider=> rider.rider_participation_id)} selectRider={this.selectRider}/>
            selectionTable = <Table stageTeam={this.state.stageSelectionGewoon}/>
        } else if (mode === 'results') {
            resTable = <Table data={this.state.userTeamResult} title={"Selectie"} />
            pTable = <PouleTable userScores={this.state.userScores}/>
            stResTable = <Table data={this.state.stageresults} title={"Uitslag"} />
        }
        if(!this.state.raceStarted || this.state.stage !== 1){
            prevButton = <div id="prevStageButton">
            <button  onClick={this.previousStage}>{this.state.prevText}</button>
            </div>;
        }
        return (
            <div className="stageContainer">
                <div id="titlebuttons">
                    {prevButton}
                    <div id='title'>{this.state.currText}</div>
                    <div id="nextStageButton">
                        <button onClick={this.nextStage}>{this.state.nextText}</button>
                    </div>
                </div>
                {selectionTable}
                {selecTable}
                {loadingGif}
                {message}
                <div className="res">{resTable}</div>
                <div className="poule">{pTable}</div>
                <div className="stage">{stResTable}</div>
            </div>
        )
    }
}

export default Stage