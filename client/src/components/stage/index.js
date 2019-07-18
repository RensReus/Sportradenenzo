import React, { Component } from 'react';
import axios from 'axios';
import './index.css';
import ModalButton from '../shared/modal'
import Table from '../shared/table'
import SelecTable from './stageselection'
import PouleTable from './stageresult'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons"; //Pijltje voor de dropdown
import { faAngleRight } from "@fortawesome/free-solid-svg-icons"; //Pijltje voor de dropdown
import { faMountain } from "@fortawesome/free-solid-svg-icons"; //Berg voor de stageprofielknop

class StageResults extends Component {
    constructor(props) {
        super(props);
        this.state = {
            scrollShow: ['block', 'none', 'none', 'none', 'none'],
        }
    }

    componentDidMount() {
        if (this.props.stage === 22) {
            this.setState({
                scrollShow: ['none', 'block', 'none', 'none', 'none'],
            })
        }
    }
    showResult(i) {
        var scrollShow = this.state.scrollShow;
        var curr = scrollShow.indexOf('block');
        scrollShow[curr] = 'none';
        scrollShow[i] = 'block';
        this.setState({ scrollShow: scrollShow });
    }
    render() {
        var buttons = []
        var klassementen = [];
        for (var i = 0; i < 5; i++) {
            if (this.props.data[i]) {
                klassementen.push(this.props.data[i]);
            } else {
                klassementen.push([])
            }
        }
        buttons.push(<button style={{ display: klassementen[0].length ? 'block' : 'none' }} className={"klassementButton " + this.state.scrollShow[0]} key="Etappe" onClick={this.showResult.bind(this, 0)}>Etappe</button>)
        buttons.push(<button style={{ display: klassementen[1].length ? 'block' : 'none' }} className={"klassementButton " + this.state.scrollShow[1]} key="Algemeen" onClick={this.showResult.bind(this, 1)}>Algemeen</button>)
        buttons.push(<button style={{ display: klassementen[2].length ? 'block' : 'none' }} className={"klassementButton " + this.state.scrollShow[2]} key="Punten" onClick={this.showResult.bind(this, 2)}>Punten</button>)
        buttons.push(<button style={{ display: klassementen[3].length ? 'block' : 'none' }} className={"klassementButton " + this.state.scrollShow[3]} key="Berg" onClick={this.showResult.bind(this, 3)}>Berg</button>)
        buttons.push(<button style={{ display: klassementen[4].length ? 'block' : 'none' }} className={"klassementButton " + this.state.scrollShow[4]} key="Jong" onClick={this.showResult.bind(this, 4)}>Jong</button>)
        return (
            <div className="classificationsContainer">
                <div style={{ display: 'flex' }}>
                    {buttons}
                </div>
                <div className="classification" style={{ display: this.state.scrollShow[0] }}>
                    <Table data={klassementen[0]} title={"Etappe"} maxRows={20} classNames="classification" />
                </div>
                <div className="classification" style={{ display: this.state.scrollShow[1] }}>
                    <Table data={klassementen[1]} title={"Algemeen Klassement"} maxRows={20} classNames="classification" />
                </div>
                <div className="classification" style={{ display: this.state.scrollShow[2] }}>
                    <Table data={klassementen[2]} title={"Punten Klassement"} maxRows={20} classNames="classification" />
                </div>
                <div className="classification" style={{ display: this.state.scrollShow[3] }}>
                    <Table data={klassementen[3]} title={"Berg Klassement"} maxRows={20} classNames="classification" />
                </div>
                <div className="classification" style={{ display: this.state.scrollShow[4] }}>
                    <Table data={klassementen[4]} title={"Jongeren Klassement"} maxRows={20} classNames="classification" />
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
            race: 'tour',
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
            prevClassificationsGewoon: [],
            prevClassificationsBudget: [],
        }
        this.selectRider = this.selectRider.bind(this)
        this.removeRider = this.removeRider.bind(this)
        this.setKopman = this.setKopman.bind(this)
        this.budgetSwitch = this.budgetSwitch.bind(this)
        this.previousStage = this.previousStage.bind(this);
        this.nextStage = this.nextStage.bind(this);
        this.updateData = this.updateData.bind(this);
        this.addRemoveRider = this.addRemoveRider.bind(this);
    }
    previousStage() {
        const currentstage = parseInt(this.state.stage)
        if (currentstage > 1) {
            this.props.history.push('/stage/' + (currentstage - 1).toString())
            this.setState({
                stage: currentstage - 1
            })
            this.updateData(currentstage - 1)
        } else {
            this.props.history.push('/teamselection')// TODO disable after stage 1 start
        }
    }
    nextStage() {
        const currentstage = parseInt(this.state.stage)
        if (currentstage < 22) {
            const currentstage = parseInt(this.state.stage)
            this.props.history.push('/stage/' + (currentstage + 1).toString())
            this.setState({
                stage: currentstage + 1
            })
            this.updateData(currentstage + 1)
        }
    }

    updateData(stage) {
        const race = this.state.race
        const year = this.state.year
        document.title = "Etappe " + stage;

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
                        starttime: res.data.starttime,
                        prevClassificationsGewoon: res.data.prevClassificationsGewoon,
                        prevClassificationsBudget: res.data.prevClassificationsBudget,
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
                        nextText: res.data.nextText,
                        lastStage: res.data.lastStage,
                        raceStarted: res.data.raceStarted
                    })
                }
            })
    }
    budgetSwitch() {
        if (this.state.budget) {
            this.setState({ budget: false })
        } else {
            this.setState({ budget: true })
        }
    }

    setKopman(rider_participation_id) {
        const stage = this.state.stage
        const race = this.state.race
        const year = this.state.year
        const budget = this.state.budget
        axios.post('/api/setkopman', { race, year, stage, rider_participation_id, budgetParticipation: budget, token: localStorage.getItem('authToken') })
            .then((res) => {
                if (budget) {
                    this.setState({ kopmanBudget: res.data.kopman })
                } else {
                    this.setState({ kopmanGewoon: res.data.kopman })
                }
            })
    }

    addRemoveRider(rider_participation_id, addRemove) {
        if (addRemove === 'add') {
            this.selectRider(rider_participation_id);
        } else if (addRemove === 'remove') {
            this.removeRider(rider_participation_id);
        } else {
            console.log("addremove has invalid value");
        }
    }

    removeRider(rider_participation_id) {
        const stage = this.state.stage
        const race = this.state.race
        const year = this.state.year
        const budget = this.state.budget
        axios.post('/api/removeriderfromstage', { race, year, stage, rider_participation_id, budgetParticipation: budget, token: localStorage.getItem('authToken') })
            .then((res) => {
                if (budget) {
                    this.setState({ stageSelectionBudget: res.data })
                } else {
                    this.setState({ stageSelectionGewoon: res.data })
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
                if (budget) {
                    this.setState({ stageSelectionBudget: res.data })
                } else {
                    this.setState({ stageSelectionGewoon: res.data })
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
        let prevClassifications
        let prevClassificationsDiv

        //selection
        if (this.state.budget) {
            stageSelection = this.state.stageSelectionBudget
            userTeam = this.state.userTeamBudget
            kopman = this.state.kopmanBudget
            prevClassifications = this.state.prevClassificationsBudget

        } else {
            stageSelection = this.state.stageSelectionGewoon
            userTeam = this.state.userTeamGewoon
            kopman = this.state.kopmanGewoon
            prevClassifications = this.state.prevClassificationsGewoon
        }
        //results
        if (this.state.budget) {
            userTeamResult = this.state.userTeamResultBudget
            userScores = this.state.userScoresBudget
            stageresults = this.state.stageresultsBudget
        } else {
            userTeamResult = this.state.userTeamResultGewoon
            userScores = this.state.userScoresGewoon
            stageresults = this.state.stageresultsGewoon
        }
        if (mode === 'loading') {
            loadingGif = <img className="loadingGif" src="/images/bicycleWheel.gif" alt="bicycleWheel.gif"></img>
            message = <h3>Fetching data..</h3>
        } else if (mode === '404') {
            message = <h3>404: Data not found</h3>
            resTable = ''
            pTable = ''
            stResTable = ''
        } else if (mode === 'selection') {
            var stageProfile = '';
            if (this.state.stage > 2 && this.state.stage < 22) {//TODO netter, voor etappe 8 geen profielen gedownload
                stageProfile = <img src={require('../../stageProfiles/stage' + this.state.stage + '.jpg')} alt="profile" />
            }
            var stageProfileKnopIcon = <FontAwesomeIcon icon={faMountain} />
            var starttime = new Date(this.state.starttime);
            var dayArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            starttimeString = dayArray[starttime.getDay()] + " " + starttime.getHours() + ":" + starttime.getMinutes();
            selecTable = <SelecTable userTeam={userTeam} selectionIDs={stageSelection.map(rider => rider.rider_participation_id)} kopman={kopman} addRemoveRider={this.addRemoveRider} setKopman={this.setKopman} />
            prevClassificationsDiv = <div className="prevClassifications">
                <div style={{ display: prevClassifications[0].rows.length ? 'block' : 'none', float: "left" }} className="GC"><Table data={prevClassifications[0].rows} title="AK" /></div>
                <div style={{ display: prevClassifications[1].rows.length ? 'block' : 'none', float: "left" }} className="Points"><Table data={prevClassifications[1].rows} title="Punten" /></div>
                <div style={{ display: prevClassifications[2].rows.length ? 'block' : 'none', float: "left" }} className="KOM"><Table data={prevClassifications[2].rows} title="Berg" /></div>
                <div style={{ display: prevClassifications[3].rows.length ? 'block' : 'none', float: "left" }} className="Youth"><Table data={prevClassifications[3].rows} title="Jong" /></div>
            </div>
        } else if (mode === 'results') {

            resTable = <Table data={userTeamResult} title={"Selectie"} />
            pTable = <PouleTable userScores={userScores} />
            stResTable = <StageResults data={stageresults} stage={this.state.stage} />
        }
        return (
            <div className="stageContainer">
                <div className="stageInfo">
                    <div className='stagetext'>
                        <div id="prevStageButton">
                            <button className="buttonStandard blue2" onClick={this.previousStage}><span className="h2 bold">   <FontAwesomeIcon icon={faAngleLeft} />   </span></button>
                        </div>
                        <span className="bold black h1">Stage: {this.state.stage}</span>
                        <div id="nextStageButton">
                            <button className="buttonStandard blue2" onClick={this.nextStage}><span className="h2 bold">   <FontAwesomeIcon icon={faAngleRight} />   </span></button>
                        </div>
                    </div>
                    <div className='stagestarttime h2 bold'>
                        {starttimeString}
                    </div>
                    <div className='budgettext h1'>
                        <span className={this.state.budget ? 'bold gray' : 'bold black'}>Gewoon </span>
                        <label className="switch">
                            <input type="checkbox" onClick={this.budgetSwitch}></input>
                            <span className="slider round"></span>
                        </label>
                        <span className={this.state.budget ? 'bold black' : 'bold gray'}> Budget</span>
                    </div>
                        <ModalButton
                            cssClassButton="buttonStandard blue2"
                            content="Profile "
                            contentIcon={stageProfileKnopIcon}
                            modalContent={stageProfile}
                        />
                </div>
                {selectionTable}
                {selecTable}
                {loadingGif}
                {message}
                <div className="res">{resTable}{pTable}</div>
                <div className="poule"></div>
                <div className="stage">{stResTable}</div>
                {prevClassificationsDiv}


            </div>
        )
    }
}

export default Stage