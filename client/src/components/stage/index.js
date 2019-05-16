import React, { Component } from 'react';
import axios from 'axios';
import './index.css';
import Table from '../table'
import SelecTable from './stageselection'
import PouleTable from './stageresult'


class StageResults extends Component{
    constructor(props){
        super(props);
        this.state = {
            scrollShow: ['block','none','none','none','none']
        }
    }
    showResult(i){
        var scrollShow = this.state.scrollShow;
        var curr = scrollShow.indexOf('block');
        scrollShow[curr] = 'none';
        scrollShow[i] = 'block';
        this.setState({scrollShow: scrollShow});
    }
    render(){
        var buttons = []
        buttons.push(<button className={"klassementButton " + this.state.scrollShow[0]} key="Etappe" onClick={this.showResult.bind(this,0)}>Etappe</button>)
        buttons.push(<button className={"klassementButton " + this.state.scrollShow[1]} key="Algemeen" onClick={this.showResult.bind(this,1)}>Algemeen</button>)
        buttons.push(<button className={"klassementButton " + this.state.scrollShow[2]} key="Punten" onClick={this.showResult.bind(this,2)}>Punten</button>)
        buttons.push(<button className={"klassementButton " + this.state.scrollShow[3]} key="Berg" onClick={this.showResult.bind(this,3)}>Berg</button>)
        buttons.push(<button className={"klassementButton " + this.state.scrollShow[4]} key="Jong" onClick={this.showResult.bind(this,4)}>Jong</button>)
        return(
            <div>
                {buttons}
                <div style={{display: this.state.scrollShow[0]}}>
                    <Table data={this.props.data[0]} title={"Etappe"} maxRows={20} />
                </div>
                <div style={{display: this.state.scrollShow[1]}}>
                    <Table data={this.props.data[1]} title={"Algemeen Klassement"} />
                </div>
                <div style={{display: this.state.scrollShow[2]}}>
                    <Table data={this.props.data[2]} title={"Punten Klassement"} />
                </div>
                <div style={{display: this.state.scrollShow[3]}}>
                    <Table data={this.props.data[3]} title={"Berg Klassement"} />
                </div>
                <div style={{display: this.state.scrollShow[4]}}>
                    <Table data={this.props.data[4]} title={"Jongeren Klassement"} />
                </div>
            </div>


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
            budget: false,
            stage: parseInt(this.props.match.params.stagenumber), //Haal het nummer uit de link
            stageSelectionGewoon: [],
            stageSelectionBudget: [],
            userTeamGewoon: [],
            userTeamBudget: [],
            kopmanGewoon: '',
            kopmanBudget: '',
            userTeamResult: [],
            userScoresGewoon: [],
            userScoresBudget: [],
            stageresults: [],
            lastStage: false,
            raceStarted: false,
            starttime: '',
        }
        this.selectRider = this.selectRider.bind(this)
        this.removeRider = this.removeRider.bind(this)
        this.setKopman = this.setKopman.bind(this)
        this.budgetSwitch = this.budgetSwitch.bind(this)
        this.previousStage = this.previousStage.bind(this);
        this.nextStage = this.nextStage.bind(this);
        this.updateData = this.updateData.bind(this)
    }
    previousStage() {
        const currentstage = parseInt(this.state.stage)
        if(currentstage>1){
            this.props.history.push('/stage/' + (currentstage - 1).toString())
            this.setState({
                stage: currentstage - 1
            })
            this.updateData(currentstage - 1)
        }else{
            this.props.history.push('/teamselection')
        }
    }
    nextStage() {
        if(!this.state.lastStage){
            const currentstage = parseInt(this.state.stage)
            this.props.history.push('/stage/' + (currentstage + 1).toString())
            this.setState({
                stage: currentstage + 1
            })
            this.updateData(currentstage + 1)
        }else{
            this.props.history.push('/finalstandings')
        }
    }

    updateData(stage) {
        const race = this.state.race
        const year = this.state.year
        var start = new Date();
        axios.post('/api/getstage', { race, year, stage, token: localStorage.getItem('authToken') }) //to: stageresults.js
            .then((res) => {
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
                        stageSelectionBudget: res.data.stageSelectionBudget,
                        kopmanGewoon: res.data.kopmanGewoon.kopman_id,
                        kopmanBudget: res.data.kopmanBudget.kopman_id,
                        currText: "Stage " + this.state.stage,
                        starttime: res.data.starttime
                    })
                } else if (res.data.mode === 'results') {
                    this.setState({
                        mode: 'results',
                        userTeamResultGewoon: res.data.teamresultGewoon,
                        userTeamResultBudget: res.data.teamresultBudget,
                        userScoresGewoon: res.data.userscoresGewoon,
                        userScoresBudget: res.data.userscoresBudget,
                        userScoresColtype: res.userScoresColtype,
                        stageresultsGewoon: res.data.stageresultsGewoon,
                        stageresultsBudget: res.data.stageresultsBudget,
                        prevText: res.data.prevText,
                        currText: "Stage " + this.state.stage,
                        nextText: res.data.nextText,
                        lastStage: res.data.lastStage,
                        raceStarted: res.data.raceStarted
                    })
                }
            })
    }
    budgetSwitch() {
        if(this.state.budget){
            this.setState({budget: false})
        }else{
            this.setState({budget: true})
        }
    }

    setKopman(rider_participation_id) {
        const stage = this.state.stage
        const race = this.state.race
        const year = this.state.year
        const budget = this.state.budget
        axios.post('/api/setkopman', { race, year, stage, rider_participation_id, budgetParticipation: budget, token: localStorage.getItem('authToken') })
            .then((res) => {
                if(budget){
                    this.setState({kopmanBudget:res.data.kopman})
                }else{
                    this.setState({kopmanGewoon:res.data.kopman})
                }
            })
    }

    removeRider(rider_participation_id) {
        const stage = this.state.stage
        const race = this.state.race
        const year = this.state.year
        const budget = this.state.budget
        axios.post('/api/removeriderfromstage', { race, year, stage, rider_participation_id, budgetParticipation: budget, token: localStorage.getItem('authToken') })
            .then((res) => {
                if(budget){
                    this.setState({stageSelectionBudget:res.data})
                }else{
                    this.setState({stageSelectionGewoon:res.data})
                }
            })
    }

    selectRider(rider_participation_id) {
        const stage = this.state.stage
        const race = this.state.race
        const year = this.state.year
        const budget = this.state.budget
        axios.post('/api/addridertostage', { race, year, stage, rider_participation_id, budgetParticipation: budget, token: localStorage.getItem('authToken') })
            .then((res) => {
                if(budget){
                    this.setState({stageSelectionBudget:res.data})
                }else{
                    this.setState({stageSelectionGewoon:res.data})
                }
            })
    }

    componentDidMount() {
        this.updateData(this.state.stage) 
    }

    render() {
        const mode = this.state.mode
        let loadingGif
        let message
        let resTable
        let pTable
        let stResTable
        let selecTable
        let selectionTable
        let stageSelection
        let userTeam
        let kopman
        let starttimeString
        let userTeamResult
        let userScores
        let stageresults

        //selection
        if (this.state.budget){
            stageSelection = this.state.stageSelectionBudget
            userTeam = this.state.userTeamBudget
            kopman = this.state.kopmanBudget

        }else{
            stageSelection = this.state.stageSelectionGewoon
            userTeam = this.state.userTeamGewoon
            kopman = this.state.kopmanGewoon
        }
        //results
        if (this.state.budget){
            userTeamResult = this.state.userTeamResultBudget
            userScores = this.state.userScoresBudget
            stageresults = this.state.stageresultsBudget
        }else{
            userTeamResult = this.state.userTeamResultGewoon
            userScores = this.state.userScoresGewoon
            stageresults = this.state.stageresultsGewoon
        }
        if (mode === 'loading'){
            loadingGif = <img className="loadingGif" src="/images/bicycleWheel.gif" alt="bicycleWheel.gif"></img>
            message = <h3>Fetching data..</h3>
        }else if (mode === '404') {
            message = <h3>404: Data not found</h3>
            resTable = ''
            pTable = ''
            stResTable = ''
        } else if (mode === 'selection') {
            var starttime = new Date(this.state.starttime);
            starttimeString = " Starttijd: " + starttime.getHours() + ":" + starttime.getMinutes();
            selecTable = <SelecTable userTeam={userTeam} selectionIDs={stageSelection.map(rider=> rider.rider_participation_id)} kopman={kopman} selectRider={this.selectRider} removeRider={this.removeRider} setKopman={this.setKopman}/>
        } else if (mode === 'results') {

            resTable = <Table data={userTeamResult} title={"Selectie"} />
            pTable = <PouleTable userScores={userScores}/>
            stResTable = <StageResults data={stageresults}/>
        }
        return (
            <div className="stageContainer">
                <div id="titlebuttons">
                <div id="prevStageButton">
                        <button onClick={this.previousStage}>To previous stage </button>
                </div> 
                <div id='title'>{this.state.currText}{this.state.budget ? ' Budget' : ' Gewoon'}{starttimeString}</div>
                <div id="nextStageButton">
                    <button onClick={this.nextStage}>To next stage </button>
                </div>
            </div>
            <button onClick={this.budgetSwitch}>Switch mode normaal/budget</button>
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