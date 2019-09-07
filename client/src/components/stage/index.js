import React, { Component } from 'react';
import axios from 'axios';
import './index.css';
import ModalButton from '../shared/modal'
import Table from '../shared/table'
import SelecTable from './stageselection'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft,faAngleRight,faMountain} from "@fortawesome/free-solid-svg-icons"; //Pijltjes next/prev stage  //Berg voor de stageprofielknop // add/remove riders
import BudgetSwitchButton from '../shared/budgetSwitchButton';
import LoadingDiv from '../shared/loadingDiv'

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
            mode: '',
            loadingAll: true,
            loadingStageres: false,
            loadingSelection: false,
            racename: '',
            year: '',
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
            allSelectionsGewoon: [],
            allSelectionsBudget: [],
            notSelectedGewoon: [],
            notSelectedBudget: [],
            oldracelink: '',
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

    componentDidMount() {
        this.initialSetState();        
    }

    componentDidUpdate(prevProps) {
        if (this.props !== prevProps) { // compares properties before and after update
            this.initialSetState();
        }
    }

    initialSetState(){
        if(this.props.match.params.racename && this.props.match.params.year){//not current race
            this.setState({
                racename: this.props.match.params.racename,
                year: this.props.match.params.year,
                oldracelink: '/' + this.props.match.params.racename + '-' + this.props.match.params.year,
            }, () => {
                this.updateData(this.state.stage)
                this.props.setRace(this.state.racename)
            })
        }else{
            if(this.props.racename){ //if racename not ''
                this.setState({
                    racename: this.props.racename,
                    year: this.props.year,
                },()=>{
                    this.updateData(this.state.stage)
                })
            }
        }

    }

    previousStage() {
        const currentstage = parseInt(this.state.stage)
        if (currentstage > 1) {
            this.setState({
                loadingStageres: true,
                loadingSelection: true,
            stage: currentstage - 1
            })
            this.props.history.push(this.state.oldracelink + '/stage/' + (currentstage - 1).toString())
            this.updateData(currentstage - 1)
        } else {
            this.props.history.push('/teamselection')// TODO disable after stage 1 start
        }
    }
    nextStage() {
        const currentstage = parseInt(this.state.stage)
        if (currentstage < 22) {
            const currentstage = parseInt(this.state.stage)
            this.props.history.push(this.state.oldracelink + '/stage/' + (currentstage + 1).toString())
            this.setState({
                loadingStageres: true,
                loadingSelection: true,
            stage: currentstage + 1
            })
            this.updateData(currentstage + 1)
        }
    }

    updateData(stage) {
        if(stage>22 || stage<1){
            this.props.history.push('/');
        }
        const racename = this.state.racename
        const year = this.state.year
        document.title = "Etappe " + stage;
        
        axios.post('/api/getstage', { racename, year, stage, token: localStorage.getItem('authToken') }) //to: stageresults.js
            .then((res) => {
                if (res.data.mode === '404') {
                    this.setState({
                        mode: '404',
                        loadingAll: false,
                        loadingStageres: false,
                        loadingSelection: false,
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
                        loadingAll: false,
                        loadingStageres: false,
                        loadingSelection: false,
                    })
                } else if (res.data.mode === 'results') {
                    this.setState({
                        mode: 'results',
                        userTeamResultGewoon: res.data.teamresultGewoon,
                        userTeamResultBudget: res.data.teamresultBudget,
                        userScoresGewoon: res.data.userscoresGewoon,
                        userScoresBudget: res.data.userscoresBudget,
                        userScoresColtype: res.data.userScoresColtype,
                        stageresultsGewoon: res.data.stageresultsGewoon,
                        stageresultsBudget: res.data.stageresultsBudget,
                        allSelectionsGewoon: res.data.allSelectionsGewoon,
                        allSelectionsBudget: res.data.allSelectionsBudget,
                        notSelectedGewoon: res.data.notSelectedGewoon,
                        notSelectedBudget: res.data.notSelectedBudget,
                        loadingAll: false,
                        loadingStageres: false,
                        loadingSelection: false,
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
        const racename = this.state.racename
        const year = this.state.year
        const budget = this.state.budget
        axios.post('/api/setkopman', { racename, year, stage, rider_participation_id, budgetParticipation: budget, token: localStorage.getItem('authToken') })
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
        }
    }

    removeRider(rider_participation_id) {
        const stage = this.state.stage
        const racename = this.state.racename
        const year = this.state.year
        const budget = this.state.budget
        axios.post('/api/removeriderfromstage', { racename, year, stage, rider_participation_id, budgetParticipation: budget, token: localStorage.getItem('authToken') })
            .then((res) => {
                console.log(budget)
                console.log(res.data)
                if (budget) {
                    this.setState({ stageSelectionBudget: res.data })
                } else {
                    this.setState({ stageSelectionGewoon: res.data })
                }
            })
    }

    selectRider(rider_participation_id) {
        const stage = this.state.stage
        const racename = this.state.racename
        const year = this.state.year
        const budget = this.state.budget
        axios.post('/api/addridertostage', { racename, year, stage, rider_participation_id, budgetParticipation: budget, token: localStorage.getItem('authToken') })
            .then((res) => {
                if (budget) {
                    this.setState({ stageSelectionBudget: res.data })
                } else {
                    this.setState({ stageSelectionGewoon: res.data })
                }
            })
    }

    
    render() {
        const mode = this.state.mode
        let message
        let resTable
        let pTable
        let stResTable
        let selecTable
        let stageSelection
        let userTeam
        let kopman
        let starttimeString
        let userTeamResult
        let userScores
        let stageresults
        let prevClassifications
        let prevClassificationsDiv
        let allSelections
        let allSelectionsPopup
        let notSelected
        let selectionsCompleteDiv
        // always
        var stageProfile = '';
        if (this.state.stage > 2 && this.state.stage < 22) {//TODO netter, check if file exists
            stageProfile = <img className = 'profileImage' src={require('../../stageProfiles/stage' + this.state.stage + '.jpg')} alt="profile" />
        }
        var stageProfileKnopIcon = <FontAwesomeIcon icon={faMountain} />
        var budgetSwitchButton = <BudgetSwitchButton budget = {this.state.budget} budgetSwitch = {this.budgetSwitch}/>
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
            allSelections = this.state.allSelectionsBudget
            notSelected = this.state.notSelectedBudget
        } else {
            userTeamResult = this.state.userTeamResultGewoon
            userScores = this.state.userScoresGewoon
            stageresults = this.state.stageresultsGewoon
            allSelections = this.state.allSelectionsGewoon
            notSelected = this.state.notSelectedGewoon
        }
        if (mode === '404') {
            message = <span className="h6">404: Data not found</span>
            resTable = ''
            pTable = ''
            stResTable = ''
        } else if (mode === 'selection') {
            var gewoonCompleet = (this.state.stageSelectionGewoon.length + (this.state.kopmanGewoon ? 1 : 0))*10
            var budgetCompleet = (this.state.stageSelectionBudget.length + (this.state.kopmanBudget ? 1 : 0))*10;
            selectionsCompleteDiv = <div className={"completeContainer " + ((gewoonCompleet + budgetCompleet) === 200 ? "allCompleet" : "")}>Compleet: 
                                    <div className ="gewoonCompleet"><div style={{width: gewoonCompleet + "%"}} className ={"backgroundCompleet teamSize" }></div><div className="textCompleet">Gewoon</div></div>
                                    <div className ="budgetCompleet"><div style={{width: budgetCompleet + "%"}} className ={"backgroundCompleet teamSize"}></div><div className="textCompleet">Budget</div></div>
                                    </div>
            var starttime = new Date(this.state.starttime);
            var dayArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            starttimeString = dayArray[starttime.getDay()] + " " + starttime.getHours() + ":" + starttime.getMinutes();
            selecTable = <SelecTable userTeam={userTeam} selectionIDs={stageSelection.map(rider => rider.rider_participation_id)} kopman={kopman} addRemoveRider={this.addRemoveRider} setKopman={this.setKopman} loading={this.state.loadingSelection}/>
            prevClassificationsDiv = <div className="prevClassifications">
                <LoadingDiv loading = {this.state.loadingSelection}/>
                <div style={{ display: prevClassifications[0].rows.length ? 'block' : 'none', float: "left" }} className="GC"><Table data={prevClassifications[0].rows} title="AK" /></div>
                <div style={{ display: prevClassifications[1].rows.length ? 'block' : 'none', float: "left" }} className="Points"><Table data={prevClassifications[1].rows} title="Punten" /></div>
                <div style={{ display: prevClassifications[2].rows.length ? 'block' : 'none', float: "left" }} className="KOM"><Table data={prevClassifications[2].rows} title="Berg" /></div>
                <div style={{ display: prevClassifications[3].rows.length ? 'block' : 'none', float: "left" }} className="Youth"><Table data={prevClassifications[3].rows} title="Jong" /></div>
            </div>
        } else if (mode === 'results') {
            resTable = <Table data={userTeamResult} title={"Selectie"} />
            pTable = <Table data={userScores} title={"Poule Stand"} coltype= {this.state.userScoresColtype}/>
            stResTable = <StageResults data={stageresults} stage={this.state.stage} />
            var allSelectionsPopupContent = [];
            var index = 0;
            for(var i in allSelections){
                var notSelectedTable = '';
                
                if(index<notSelected.length && allSelections[i].title === notSelected[index].username){
                    notSelectedTable = <Table data={notSelected[index].riders} title={"Niet Opgesteld"}/>    
                    index++;                
                }
                var totalRiders = '';
                    if(parseInt(i)===allSelections.length-1){
                    totalRiders = ' Totaal: ' + allSelections[i].tableData.length
                }
                allSelectionsPopupContent.push(<div className="tableDiv"><Table data={allSelections[i].tableData} title={allSelections[i].title + totalRiders} coltype={allSelections[i].coltype}/>{notSelectedTable}</div>)
            }
            allSelectionsPopup = <ModalButton
                            cssClassButton={"buttonStandard " + this.state.racename}
                            content="Alle opstellingen "
                            modalContent={allSelectionsPopupContent}
                        />
        }
        return (
            <div className="stageContainer">
                <div className="stageInfo">
                    <div className='stagetext'>
                        <div id="prevStageButton">
                            <button className={"buttonStandard " + this.state.racename} onClick={this.previousStage}><span className="h7 bold">   <FontAwesomeIcon icon={faAngleLeft} />   </span></button>
                        </div>
                        <span className="bold black h7">Stage: {this.state.stage}</span>
                        <div id="nextStageButton">
                            <button className={"buttonStandard " + this.state.racename} onClick={this.nextStage}><span className="h7 bold">   <FontAwesomeIcon icon={faAngleRight} />   </span></button>
                        </div>
                    </div>
                    <div className='stagestarttime h7 bold'>
                        {starttimeString}
                    </div>
                    {budgetSwitchButton}
                        {selectionsCompleteDiv}
                        <ModalButton
                            cssClassButton={"buttonStandard " + this.state.racename}
                            content="Profile "
                            contentIcon={stageProfileKnopIcon}
                            modalContent={stageProfile}
                        />
                </div>
                {message}
                {allSelectionsPopup}
                {selecTable}
                <div className="res">
                    <LoadingDiv loading = {this.state.loadingStageres}/>
                    {resTable}{pTable}
                    </div>
                <div className="stage">
                    <LoadingDiv loading = {this.state.loadingStageres}/>
                    {stResTable}
                </div>
                {prevClassificationsDiv}
                <LoadingDiv loading = {this.state.loadingAll}/>


            </div>
        )
    }
}

export default Stage