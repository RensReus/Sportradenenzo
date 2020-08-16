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
                        buttonclassname += index === this.state.classificationIndex ? 'block' : 'none';
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
            budget: 0,
            stage: parseInt(this.props.match.params.stagenumber), //Haal het nummer uit de link
            stageSelection: [[], []],
            userTeam: [[], []],
            kopman: ['',''],
            stageSelectionResults: [[], []],
            userScores: [[], []],
            stageResults: [[], []],
            lastStage: false,
            raceStarted: false,
            starttime: '',
            prevClassifications: [[], []],
            allSelections: [[], []],
            notSelected: [[], []],
            oldracelink: '',
            //new for partial update
            classificationDownloaded: [[false, false, false, false, false], [false, false, false, false, false]],
            pouleTeamResultDownloaded: [false, false],
            classificationIndex: 0,
        }
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
            let classificationIndex = 0;
            if (this.state.stage === 22) classificationIndex += 1;
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
                let classificationIndex = 0;
                if (this.state.stage === 22) classificationIndex += 1;
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
                classificationDownloaded: [[false, false, false, false, false], [false, false, false, false, false]],
                pouleTeamResultDownloaded: [false, false],
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
                classificationDownloaded: [[false, false, false, false, false], [false, false, false, false, false]],
                pouleTeamResultDownloaded: [false, false],
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
            pouleTeamResultDownloaded: [false, false],
            classificationDownloaded: [[false, false, false, false, false], [false, false, false, false, false]]
        }, () => {
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
        if (!this.state.pouleTeamResultDownloaded[budget]) {
            axios.post('/api/getstage', { racename, year, stage, budgetParticipation: budget })
                .then((res) => {
                    if (res.data.mode === '404') {
                        this.setState({
                            mode: '404',
                        })
                    } else if (res.data.mode === 'selection') {
                        let newUserTeam = _.cloneDeep(this.state.userTeam)
                        newUserTeam[budget] = res.data.userTeam;
                        let newStageSelection = _.cloneDeep(this.state.stageSelection)
                        newStageSelection[budget] = res.data.stageSelection;
                        let newKopman = _.cloneDeep(this.state.kopman)
                        newKopman[budget] = res.data.kopman;
                        let newPrevClassifications = _.cloneDeep(this.state.kopman)
                        newPrevClassifications[budget] = res.data.kopman;
                        let newPouleTeamResultDownloaded = _.cloneDeep(this.state.pouleTeamResultDownloaded)
                        newPouleTeamResultDownloaded[budget] = res.data.kopman;
                        this.setState({
                            mode: 'selection',
                            userTeam: newUserTeam,
                            stageSelection: newStageSelection,
                            kopman: newKopman,
                            starttime: res.data.starttime,
                            prevClassifications: newPrevClassifications,
                            pouleTeamResultDownloaded: newPouleTeamResultDownloaded
                        })
                    } else if (res.data.mode === 'results') {
                        let stageSelectionResults = _.cloneDeep(this.state.stageSelectionResults)
                        stageSelectionResults[budget] = res.data.teamresult;
                        let newUserScores = _.cloneDeep(this.state.userScores)
                        newUserScores[budget] = res.data.userscores;
                        this.setState({
                            mode: 'results',
                            userScoresColtype: res.data.userScoresColtype,
                            stageSelectionResults: stageSelectionResults,
                            userScores: newUserScores
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
        if (!this.state.classificationDownloaded[budget][classificationIndex]) {
            this.setState({
                loadingStageres: true,
            })
            axios.post('/api/getStageResults', { racename, year, stage, budgetParticipation: budget, classificationIndex })
                .then((res) => {
                    this.setDownloadedTrue(budget, classificationIndex);
                    let newResults = _.cloneDeep(this.state.stageResults);
                    newResults[budget][classificationIndex] = res.data.stageResults;
                    this.setState({
                        loadingStageres: false,
                        stageResults: newResults,
                    })
                })
        }
    }

    getAllSelections() { // TODO figure out a way to call this function
        const racename = this.state.racename;
        const year = this.state.year;
        const stage = this.state.stage;
        const budget = this.state.budget;
        axios.post('/api/getAllSelections', { racename, year, stage, budgetParticipation: budget })
            .then((res) => {
                let newAllSelections = _.cloneDeep(this.state.allSelections);
                newAllSelections[budget] = res.data.allSelections;
                let newNotSelected = _.cloneDeep(this.state.notSelected);
                newNotSelected[budget] = res.data.notSelected;
                console.log("alselections", res.data)
                this.setState({
                    allSelections: newAllSelections,
                    notSelected: newNotSelected
                })
            })
    }

    setDownloadedTrue(budget, classificationIndex) {
        let newClassificationDownloaded = _.cloneDeep(this.state.classificationDownloaded);
        newClassificationDownloaded[budget][classificationIndex] = true;
        this.setState({
            classificationDownloaded: newClassificationDownloaded
        })
    }

    setLoaders(state) {
        this.setState({
            loadingAll: state,
            loadingStageres: state,
            loadingSelection: state,
        })
    }

    budgetSwitch() {
        this.setState({
            budget: (this.state.budget - 1) * -1
        }, () => {
            this.updateData(this.state.stage)
        })
    }

    setKopman(rider_participation_id) {
        const stage = this.state.stage
        const racename = this.state.racename
        const year = this.state.year
        const budget = this.state.budget
        axios.post('/api/setkopman', { racename, year, stage, rider_participation_id, budgetParticipation: budget })
            .then((res) => {
                let newKopman = _.cloneDeep(this.state.kopman);
                newKopman[budget] = res.data.kopman;
                this.setState({ kopman: newKopman })
            })
    }

    addRemoveRider(rider_participation_id, addRemove) {
        var link = '';
        const stage = this.state.stage
        const racename = this.state.racename
        const year = this.state.year
        const budget = this.state.budget
        if (addRemove === 'add') {
            link = 'addridertostage';
        } else if (addRemove === 'remove') {
            link = 'removeriderfromstage';
        }
        axios.post(link, { racename, year, stage, rider_participation_id, budgetParticipation: budget })
        .then((res) => {
            let newStageSelection = _.cloneDeep(this.state.stageSelection);
            newStageSelection[budget] = res.data.stageSelection;
            this.setState({ stageSelectionBudget: newStageSelection })
        })
    }

    render() {
        const mode = this.state.mode
        const budget = this.state.budget;
        let starttimeString
        let allSelectionsPopup
        let selectionsCompleteDiv
        // always
        var stageProfile = '';
        if (this.state.stage > 2 && this.state.stage < 22) {//TODO netter, check if file exists
            stageProfile = <img className='profileImage' src={require('../../stageProfiles/stage' + this.state.stage + '.jpg')} alt="profile" />
        }
        //selection
        let userTeam = this.state.userTeam[budget];
        let kopman = this.state.kopman[budget];
        let prevClassifications = this.state.prevClassifications[budget];
        let stageSelection = this.state.stageSelection[budget];
        // results TODO get allSelections/notSelected on click
        let allSelections = this.state.allSelections[budget];
        let notSelected = this.state.notSelected[budget];
        if (mode === 'selection') {
            var gewoonCompleet = (this.state.stageSelection[0].length + (this.state.kopman[0] ? 1 : 0)) * 10
            var budgetCompleet = (this.state.stageSelection[1].length + (this.state.kopman[1] ? 1 : 0)) * 10;
            selectionsCompleteDiv = <div className={"completeContainer " + ((gewoonCompleet + budgetCompleet) === 200 ? "allCompleet" : "")}>Compleet:
                                    <div className="gewoonCompleet"><div style={{ width: gewoonCompleet + "%" }} className={"backgroundCompleet teamSize"}></div><div className="textCompleet">Gewoon</div></div>
                                    <div className="budgetCompleet"><div style={{ width: budgetCompleet + "%" }} className={"backgroundCompleet teamSize"}></div><div className="textCompleet">Budget</div></div>
            </div>
            var starttime = new Date(this.state.starttime);
            var dayArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            starttimeString = dayArray[starttime.getDay()] + " " + starttime.getHours() + ":" + starttime.getMinutes();
        } else if (mode === 'results') {
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
                {/* 404 */}
                {mode === '404' && <span className="h6">404: Data not found</span>}
                {/* Always TODO merge into one clean div */}
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
                    <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
                    <ModalButton
                        cssClassButton={"buttonStandard " + this.state.racename}
                        content="Profile "
                        contentIcon={<FontAwesomeIcon icon={faMountain} />}
                        modalContent={stageProfile}
                    />
                    {/* Selection */}
                    <div className='stagestarttime h7 bold'> {/* TODO move to stage selection file? */}
                        {starttimeString}
                    </div>
                    {selectionsCompleteDiv}
                </div>
                { mode === 'selection' && <div> {/* TODO? fix css divs/ move to stage selection file */}
                    <SelecTable userTeam={userTeam} selectionIDs={stageSelection.map(rider => rider.rider_participation_id)} kopman={kopman} addRemoveRider={this.addRemoveRider} setKopman={this.setKopman} loading={this.state.loadingSelection} />
                    <div className="prevClassifications">
                        <LoadingDiv loading={this.state.loadingSelection} />
                        <div style={{ display: prevClassifications[0].rows.length ? 'block' : 'none', float: "left" }} className="GC"><Table data={prevClassifications[0].rows} title="AK" /></div>
                        <div style={{ display: prevClassifications[1].rows.length ? 'block' : 'none', float: "left" }} className="Points"><Table data={prevClassifications[1].rows} title="Punten" /></div>
                        <div style={{ display: prevClassifications[2].rows.length ? 'block' : 'none', float: "left" }} className="KOM"><Table data={prevClassifications[2].rows} title="Berg" /></div>
                        <div style={{ display: prevClassifications[3].rows.length ? 'block' : 'none', float: "left" }} className="Youth"><Table data={prevClassifications[3].rows} title="Jong" /></div>
                    </div>
                </div>}

                {/* Results TODO merge into one div*/}
                {/* {mode === 'results' &&
                    <div> */}
                {allSelectionsPopup}
                <div className="res">
                    <LoadingDiv loading={this.state.loadingSelection} />
                    <Table data={this.state.stageSelectionResults[budget]} title={"Selectie"} />
                    <Table data={this.state.userScores[budget]} title={"Poule Stand"} coltype={this.state.userScoresColtype} />
                </div>
                <div className="stage">
                    <LoadingDiv loading={this.state.loadingStageres} />
                    <StageResults data={this.state.stageResults[budget]} stage={this.state.stage} changedClassificationDisplay={this.changedClassificationDisplay} />
                </div>
                <LoadingDiv loading={this.state.loadingAll} />
                {/* </div>
                } */}

            </div>
        )
    }
}

export default Stage