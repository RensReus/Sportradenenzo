import React, { Component } from 'react';
import axios from 'axios';
import './index.css';
import ModalButton from '../shared/modal'
import Table from '../shared/table'
import SelecTable from './stageselection'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight, faMountain } from "@fortawesome/free-solid-svg-icons"; //Pijltjes next/prev stage  //Berg voor de stageprofielknop // add/remove riders
import BudgetSwitchButton from '../shared/budgetSwitchButton';
import LoadingDiv from '../shared/loadingDiv'
import _ from "lodash"

class StageResults extends Component {
    constructor(props) {
        super(props);
        this.state = {
            classificationIndex: 0
        }
    }

    componentDidMount() {
        if (this.props.stage === 22) {
            this.setState({
                classificationIndex: 1
            })
        }
    }
    showResult(i) {
        this.props.changedClassificationDisplay(i);
        this.setState({ classificationIndex: i });
    }
    render() {
        var klassementen = [];
        for (var i = 0; i < 5; i++) {
            if (this.props.data[i]) {
                klassementen.push(this.props.data[i]);
            } else {
                klassementen.push([])
            }
        }
        var classificationNamesButtons = ['Etappe', 'Algemeen', 'Punten', 'Bergen', 'Jong'];
        var classificationNames = ['Etappe', 'Algemeen Klassement', 'Punten Klassement', 'Bergen Klassement', 'Jongeren Klassement'];
        return (
            <div className="classificationsContainer">
                <div style={{ display: 'flex' }}>
                    {classificationNamesButtons.map((element, index) => {
                        var buttonclassname = "klassementButton ";
                        buttonclassname += index == this.state.classificationIndex ? 'block' : 'none';
                        return <button style={{ display: 'block' }} className={buttonclassname} key={element} onClick={this.showResult.bind(this, index)}>{element}</button>
                    })}
                </div>
                <div className="classification">
                    <Table data={klassementen[this.state.classificationIndex]} title={classificationNames[this.state.classificationIndex]} maxRows={20} classNames="classification" />
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
            stageresultsGewoon: [[], [], [], [], []],
            stageresultsBudget: [[], [], [], [], []],
            userTeamGewoon: [],
            userTeamBudget: [],
            kopmanGewoon: '',
            kopmanBudget: '',
            userTeamResult: [],
            userScoresGewoon: [],
            userScoresBudget: [],
            userTeamResultGewoon: [],
            userTeamResultBudget: [],
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
            //new for partial update
            classificationDownloaded: { gewoon: [false, false, false, false, false], budget: [false, false, false, false, false] },
            pouleTeamResultDownloaded: { gewoon: false, budget: false },
            classificationIndex: 0,
        }
        this.selectRider = this.selectRider.bind(this)
        this.removeRider = this.removeRider.bind(this)
        this.setKopman = this.setKopman.bind(this)
        this.budgetSwitch = this.budgetSwitch.bind(this)
        this.previousStage = this.previousStage.bind(this);
        this.nextStage = this.nextStage.bind(this);
        this.updateData = this.updateData.bind(this);
        this.addRemoveRider = this.addRemoveRider.bind(this);
        this.getStageResults = this.getStageResults.bind(this);
        this.changedClassificationDisplay = this.changedClassificationDisplay.bind(this);
        this.setDownloadedTrue = this.setDownloadedTrue.bind(this);
    }

    componentDidMount() {
        this.initialSetState();
    }

    initialSetState() {
        if (this.props.match.params.racename && this.props.match.params.year) {//not current race
            var classificationIndex = 0;
            if (this.state.stage == 22) classificationIndex += 1;
            this.setState({
                racename: this.props.match.params.racename,
                year: this.props.match.params.year,
                oldracelink: '/' + this.props.match.params.racename + '-' + this.props.match.params.year,
                classificationIndex
            }, () => {
                this.updateData(this.state.stage)
                this.props.setRace(this.state.racename)
            })
        } else {
            if (this.props.racename) { //if racename not ''
                var classificationIndex = 0;
                if (this.state.stage == 22) classificationIndex += 1;
                this.setState({
                    racename: this.props.racename,
                    year: this.props.year,
                    classificationIndex
                }, () => {
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
                resultsComplete: false,
                stage: currentstage - 1
            })
            this.props.history.push(this.state.oldracelink + '/stage/' + (currentstage - 1).toString())
            this.updateData(currentstage - 1)
        } else {
            this.props.history.push('/teamselection')
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
                resultsComplete: false,
                stage: currentstage + 1
            })
            this.updateData(currentstage + 1)
        }
    }

    changedClassificationDisplay(classificationIndex) {
        this.setState({
            classificationIndex
        }, () => {
            this.getStageResults();
        })
    }

    autoupdate() {
        this.setState({
            classificationDownloaded: [false, false, false, false, false]
        }, () => {
            //TODO reset downloaded vars
            this.updateData(this.state.stage)
        })
    }

    updateData(stage) {
        if (stage > 22 || stage < 1) {
            this.props.history.push('/');
        }
        const racename = this.state.racename;
        const year = this.state.year;
        const budget = this.state.budget;
        document.title = "Etappe " + stage;
        var pouleTeamResultDownloaded = budget ? this.state.pouleTeamResultDownloaded.budget : this.state.pouleTeamResultDownloaded.gewoon;
        if (!pouleTeamResultDownloaded) {
            axios.post('/api/getstage2', { racename, year, stage, budgetParticipation: budget }) //to: stageresults.js
                .then((res) => {
                    if (res.data.mode === '404') {
                        this.setState({
                            mode: '404',
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
                        if (res.data.budgetParticipation) {
                            console.log("results budget query",res.data)
                            this.setState({
                                mode: 'results',
                                userScoresColtype: res.data.userScoresColtype,
                                userTeamResultBudget: res.data.teamresult,
                                userScoresBudget: res.data.userscores,
                            })
                        } else {
                            this.setState({
                                mode: 'results',
                                userScoresColtype: res.data.userScoresColtype,
                                userTeamResultGewoon: res.data.teamresult,
                                userScoresGewoon: res.data.userscores,
                            })
                        }
                        this.setState({
                            mode: 'results',
                            userScoresColtype: res.data.userScoresColtype,
                        })
                    }
                    this.setLoaders(false);
                })
        }
        this.getStageResults()
    }

    getStageResults() {
        const racename = this.state.racename;
        const year = this.state.year;
        const stage = this.state.stage;
        const budget = this.state.budget;
        const classificationIndex = this.state.classificationIndex;
        var classificationDownloaded = budget ? this.state.classificationDownloaded.budget : this.state.classificationDownloaded.gewoon;
        
        if (!classificationDownloaded[classificationIndex])
            this.setState({
                loadingStageres: true,
            })
            axios.post('/api/getStageResults', { racename, year, stage, budgetParticipation: budget, classificationIndex })
                .then((res) => {
                    this.setDownloadedTrue(res.data.budgetParticipation,res.data.classificationIndex);
                    if (res.data.budgetParticipation) {
                        console.log("budget results")
                        var updatedResults = _.cloneDeep(this.state.stageresultsBudget);
                        updatedResults[res.data.classificationIndex] = res.data.stageresults;
                        this.setState({
                            loadingStageres: false,
                            stageresultsBudget: updatedResults,
                        })
                    } else {
                        var updatedResults = _.cloneDeep(this.state.stageresultsGewoon);
                        updatedResults[res.data.classificationIndex] = res.data.stageresults;
                        this.setState({
                            loadingStageres: false,
                            stageresultsGewoon: updatedResults,
                        })
                    }
                })
    }

    getAllSelections() {
        //TODO implement
    }

    setDownloadedTrue(budget, classificationIndex) {
        //TODO implement
    }

    setLoaders(state) {
        this.setState({
            loadingAll: state,
            loadingStageres: state,
            loadingSelection: state,
        })
    }

    budgetSwitch() {
        if (this.state.budget) {
            this.setState({
                budget: false
            }, () => {
                this.updateData(this.state.stage)
            })
        } else {
            this.setState({
                budget: true
            }, () => {
                this.updateData(this.state.stage)
            })
        }
    }

    setKopman(rider_participation_id) {
        const stage = this.state.stage
        const racename = this.state.racename
        const year = this.state.year
        const budget = this.state.budget
        axios.post('/api/setkopman', { racename, year, stage, rider_participation_id, budgetParticipation: budget })
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
        axios.post('/api/removeriderfromstage', { racename, year, stage, rider_participation_id, budgetParticipation: budget })
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
        const racename = this.state.racename
        const year = this.state.year
        const budget = this.state.budget
        axios.post('/api/addridertostage', { racename, year, stage, rider_participation_id, budgetParticipation: budget })
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
            stageProfile = <img className='profileImage' src={require('../../stageProfiles/stage' + this.state.stage + '.jpg')} alt="profile" />
        }
        var stageProfileKnopIcon = <FontAwesomeIcon icon={faMountain} />
        var budgetSwitchButton = <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
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
            var gewoonCompleet = (this.state.stageSelectionGewoon.length + (this.state.kopmanGewoon ? 1 : 0)) * 10
            var budgetCompleet = (this.state.stageSelectionBudget.length + (this.state.kopmanBudget ? 1 : 0)) * 10;
            selectionsCompleteDiv = <div className={"completeContainer " + ((gewoonCompleet + budgetCompleet) === 200 ? "allCompleet" : "")}>Compleet:
                                    <div className="gewoonCompleet"><div style={{ width: gewoonCompleet + "%" }} className={"backgroundCompleet teamSize"}></div><div className="textCompleet">Gewoon</div></div>
                <div className="budgetCompleet"><div style={{ width: budgetCompleet + "%" }} className={"backgroundCompleet teamSize"}></div><div className="textCompleet">Budget</div></div>
            </div>
            var starttime = new Date(this.state.starttime);
            var dayArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            starttimeString = dayArray[starttime.getDay()] + " " + starttime.getHours() + ":" + starttime.getMinutes();
            selecTable = <SelecTable userTeam={userTeam} selectionIDs={stageSelection.map(rider => rider.rider_participation_id)} kopman={kopman} addRemoveRider={this.addRemoveRider} setKopman={this.setKopman} loading={this.state.loadingSelection} />
            prevClassificationsDiv = <div className="prevClassifications">
                <LoadingDiv loading={this.state.loadingSelection} />
                <div style={{ display: prevClassifications[0].rows.length ? 'block' : 'none', float: "left" }} className="GC"><Table data={prevClassifications[0].rows} title="AK" /></div>
                <div style={{ display: prevClassifications[1].rows.length ? 'block' : 'none', float: "left" }} className="Points"><Table data={prevClassifications[1].rows} title="Punten" /></div>
                <div style={{ display: prevClassifications[2].rows.length ? 'block' : 'none', float: "left" }} className="KOM"><Table data={prevClassifications[2].rows} title="Berg" /></div>
                <div style={{ display: prevClassifications[3].rows.length ? 'block' : 'none', float: "left" }} className="Youth"><Table data={prevClassifications[3].rows} title="Jong" /></div>
            </div>
        } else if (mode === 'results') {
            resTable = <Table data={userTeamResult} title={"Selectie"} />
            pTable = <Table data={userScores} title={"Poule Stand"} coltype={this.state.userScoresColtype} />
            console.log("RESULTS", stageresults)
            stResTable = <StageResults data={stageresults} stage={this.state.stage} changedClassificationDisplay={this.changedClassificationDisplay} />
            var allSelectionsPopupContent = []; //TODO fix
            var index = 0;
            for (var i in allSelections) {
                var notSelectedTable = '';

                if (index < notSelected.length && allSelections[i].title === notSelected[index].username) {
                    notSelectedTable = <Table data={notSelected[index].riders} title={"Niet Opgesteld"} />
                    index++;
                }
                var totalRiders = '';
                if (parseInt(i) === allSelections.length - 1) {
                    totalRiders = ' Totaal: ' + allSelections[i].tableData.length
                }
                allSelectionsPopupContent.push(<div className="tableDiv"><Table data={allSelections[i].tableData} title={allSelections[i].title + totalRiders} coltype={allSelections[i].coltype} />{notSelectedTable}</div>)
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
                    <LoadingDiv loading={this.state.loadingSelection} />
                    {resTable}{pTable}
                </div>
                <div className="stage">
                    <LoadingDiv loading={this.state.loadingStageres} />
                    {stResTable}
                </div>
                {prevClassificationsDiv}
                <LoadingDiv loading={this.state.loadingAll} />


            </div>
        )
    }
}

export default Stage