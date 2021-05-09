import React, { Component } from 'react';
import axios from 'axios';
import './index.css';
import ModalButton from '../shared/modal'
import Table from '../shared/table'
import StageSelectionPage from './stageselection'
import StageResultsTables from './stageresultstables'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight, faMountain } from "@fortawesome/free-solid-svg-icons"; //Pijltjes next/prev stage  //Berg voor de stageprofielknop // add/remove riders
import BudgetSwitchButton from '../shared/budgetSwitchButton';
import LoadingDiv from '../shared/loadingDiv'
import _ from "lodash"

class Stage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      mode: '',
      loadingAll: true,
      loadingStageres: false,
      loadingSelection: false,
      year: '',
      budget: 0,
      stage: parseInt(this.props.match.params.stagenumber), //Haal het nummer uit de link
      stageSelection: [[], []],
      teamSelection: [[], []],
      kopman: [null, null],
      stageSelectionResults: [[], []],
      userScores: [[], []],
      stageResults: [[[], [], [], [], []], [[], [], [], [], []]],
      stageResultsLengths: [0, 0, 0, 0, 0],
      lastStage: false,
      raceStarted: false,
      starttime: '',
      prevClassifications: [[[], [], [], []], [[], [], [], []]],
      allSelections: [[], []],
      notSelected: [[], []],
      oldracelink: '',
      classificationDownloaded: [[false, false, false, false, false], [false, false, false, false, false]],
      pouleTeamResultDownloaded: [false, false],
      selectionsComplete: [0, 0],
      classificationIndex: 0,
      stageType: ''
    }
    this.setKopman = this.setKopman.bind(this)
    this.removeKopman = this.removeKopman.bind(this)
    this.budgetSwitch = this.budgetSwitch.bind(this)
    this.previousStage = this.previousStage.bind(this);
    this.nextStage = this.nextStage.bind(this);
    this.updateData = this.updateData.bind(this);
    this.addRemoveRider = this.addRemoveRider.bind(this);
    this.getStageResults = this.getStageResults.bind(this);
    this.changedClassificationDisplay = this.changedClassificationDisplay.bind(this);
    this.setDownloadedTrue = this.setDownloadedTrue.bind(this);
    this.getAllSelections = this.getAllSelections.bind(this);
  }

  componentDidMount() {
    if (this.props.race_id === undefined) {
      this.props.history.push('/home')
    } else {
      this.setState({
        racename: this.props.racename,
      }, () => {
        this.updateData(this.state.stage)
      })
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
        stageResults: [[[], [], [], [], []], [[], [], [], [], []]],
        stage: currentstage - 1
      }, () => {
        this.props.history.push(this.state.oldracelink + '/stage/' + (currentstage - 1).toString())
        this.updateData(currentstage - 1)
      })
    } else {
      this.props.history.push('/teamselection')
    }
  }

  nextStage() {
    const stagenr = parseInt(this.state.stage)
    this.props.history.push(this.state.oldracelink + '/stage/' + (stagenr + 1).toString())
    this.setState({
      loadingStageres: true,
      loadingSelection: true,
      classificationDownloaded: [[false, false, false, false, false], [false, false, false, false, false]],
      pouleTeamResultDownloaded: [false, false],
      stageResults: [[[], [], [], [], []], [[], [], [], [], []]],
      stage: stagenr + 1
    }, () => {
      this.updateData(stagenr + 1)
    })
  }

  changedClassificationDisplay(classificationIndex) {
    this.setState({
      classificationIndex
    }, () => {
      this.getStageResults();
    })
  }

  autoupdate() {
    var now = new Date();
    var msToGo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 10, 0) - now; //10s after autoscrape
    if (msToGo < 0) {
      msToGo += 60 * 1000; // plus 60s if negative
    }
    setTimeout(function () {
      this.setState({
        pouleTeamResultDownloaded: [false, false],
        classificationDownloaded: [[false, false, false, false, false], [false, false, false, false, false]]
      }, () => {
        this.updateData(this.state.stage)
      })
    }.bind(this), msToGo);
  }

  updateData(stage) {
    if (stage < 1) { //TODO redirect via backend
      this.props.history.push('/');
    }
    const race_id = this.props.race_id;
    const budget = this.state.budget;
    document.title = "Etappe " + stage;
    if (!this.state.pouleTeamResultDownloaded[budget]) {
      axios.post('/api/getstage', { race_id, stage, budgetParticipation: budget })
        .then((res) => {
          if (res.data.mode === '404') {
            this.props.history.push('/');
          } else if (res.data.mode === 'selection') {
            let teamSelection = _.cloneDeep(this.state.teamSelection)
            teamSelection[budget] = res.data.teamSelection;
            let stageSelection = _.cloneDeep(this.state.stageSelection)
            stageSelection[budget] = res.data.stageSelection;
            let kopman = _.cloneDeep(this.state.kopman)
            kopman[budget] = res.data.kopman;
            let prevClassifications = _.cloneDeep(this.state.prevClassifications)
            prevClassifications[budget] = res.data.prevClassifications;
            this.setState({
              mode: 'selection',
              teamSelection,
              stageSelection,
              kopman,
              starttime: res.data.starttime,
              prevClassifications,
              selectionsComplete: res.data.selectionsComplete
            })
          } else if (res.data.mode === 'results') {
            let classificationIndex = this.state.classificationIndex;
            let stageType = res.data.stageType;
            if (stageType === "FinalStandings") classificationIndex = 1;
            let stageSelectionResults = _.cloneDeep(this.state.stageSelectionResults)
            stageSelectionResults[budget] = res.data.teamresult;
            let userScores = _.cloneDeep(this.state.userScores)
            userScores[budget] = res.data.userscores;
            let pouleTeamResultDownloaded = _.cloneDeep(this.state.pouleTeamResultDownloaded)
            pouleTeamResultDownloaded[budget] = true;
            if (!res.data.resultsComplete) this.autoupdate();
            this.setState({
              mode: 'results',
              userScoresColtype: res.data.userScoresColtype,
              stageSelectionResults,
              userScores: userScores,
              pouleTeamResultDownloaded,
              classificationIndex,
              stageType
            }, () => {
              this.getStageResults()
            })
          }
          this.setLoaders(false);
        })
    }
  }

  getStageResults() {
    const race_id = this.props.race_id;
    const stage = this.state.stage;
    const budget = this.state.budget;
    const classificationIndex = this.state.classificationIndex;
    if (!this.state.classificationDownloaded[budget][classificationIndex] && (this.state.mode === '' || this.state.mode === 'results')) {
      this.setState({
        loadingStageres: true,
      })
      axios.post('/api/getStageResults', { race_id, stage, budgetParticipation: budget, classificationIndex })
        .then((res) => {
          this.setDownloadedTrue(budget, classificationIndex);
          let newResults = _.cloneDeep(this.state.stageResults);
          newResults[budget][classificationIndex] = res.data.stageResults;
          this.setState({
            loadingStageres: false,
            stageResults: newResults,
            stageResultsLengths: res.data.stageResultsLengths
          })
        })
    }
  }

  getAllSelections() { //TODO add loader
    const race_id = this.props.race_id;
    const stage = this.state.stage;
    const budget = this.state.budget;
    axios.post('/api/getAllSelections', { race_id, stage, budgetParticipation: budget })
      .then((res) => {
        let newAllSelections = _.cloneDeep(this.state.allSelections);
        newAllSelections[budget] = res.data.allSelections;
        let newNotSelected = _.cloneDeep(this.state.notSelected);
        newNotSelected[budget] = res.data.notSelected;
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
    const race_id = this.props.race_id
    const budget = this.state.budget
    axios.post('/api/setkopman', { race_id, stage, rider_participation_id, budgetParticipation: budget })
      .then((res) => {
        let kopman = _.cloneDeep(this.state.kopman);
        kopman[budget] = res.data.kopman;
        this.setState({
          kopman,
          selectionsComplete: res.data.selectionsComplete
        })
      })
  }

  removeKopman(rider_participation_id) {
    const stage = this.state.stage
    const race_id = this.props.race_id
    const budget = this.state.budget
    axios.post('/api/removekopman', { race_id, stage, rider_participation_id, budgetParticipation: budget })
      .then((res) => {
        let kopman = _.cloneDeep(this.state.kopman);
        kopman[budget] = res.data.kopman;
        this.setState({
          kopman,
          selectionsComplete: res.data.selectionsComplete
        })
      })
  }

  addRemoveRider(rider_participation_id, addRemove) {
    var link = '';
    const stage = this.state.stage
    const race_id = this.props.race_id
    const budget = this.state.budget
    if (addRemove === 'add') {
      link = '/api/addridertostage';
    } else if (addRemove === 'remove') {
      link = '/api/removeriderfromstage';
    }
    axios.post(link, { race_id, stage, rider_participation_id, budgetParticipation: budget })
      .then((res) => {
        let kopman = _.cloneDeep(this.state.kopman)
        kopman[budget] = res.data.kopman;
        let prevClassifications = _.cloneDeep(this.state.prevClassifications)
        prevClassifications[budget] = res.data.prevClassifications;
        let stageSelection = _.cloneDeep(this.state.stageSelection);
        stageSelection[budget] = res.data.stageSelection;
        this.setState({
          stageSelection,
          kopman,
          prevClassifications,
          selectionsComplete: res.data.selectionsComplete
        })
      })
  }

  render() {
    console.log(this.state.stage,'length',this.state.stageResultsLengths)
    const mode = this.state.mode
    const budget = this.state.budget;
    let allSelectionsPopup
    // always
    var stageProfile = '';
    stageProfile = <div>
      <img className='profileImage' src={'/images/stageProfiles/' + this.props.race_id + '/stage-' + this.state.stage + '-profile.jpg'} alt="profile" />
      <br></br>
        finish
        <br></br>
      <img className='profileImage' src={'/images/stageProfiles/' + this.props.race_id + '/stage-' + this.state.stage + '-finish.jpg'} alt="" />
      <br></br>
      extra
        <br></br>
      <img className='profileImage' src={'/images/stageProfiles/' + this.props.race_id + '/stage-' + this.state.stage + '-extra.jpg'} alt="" />
    </div>
    if (this.state.racename === 'vuelta'){
      stageProfile = <iframe width="1800" height="900" title='profielen' src={`https://www.procyclingstats.com/race/vuelta-a-espana/2020/stage-${this.state.stage}/today/profiles`}></iframe>
    }
    //selection
    if (mode === 'results') {
      let allSelections = this.state.allSelections[budget];
      let notSelected = this.state.notSelected[budget];
      var allSelectionsPopupContent = [];
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
        cssClassButton={"buttonStandard " + this.props.racename}
        content="Alle opstellingen "
        modalContent={allSelectionsPopupContent}
        callback={this.getAllSelections}
      />
    }
    return (
      <div>
        {/* 404 */}
        {mode === '404' && <span className="h6">404: Data not found</span>}
        {/* Always renders TODO merge into one clean div */}
        <div className="stageContainer">
          <div className="stageInfo">
            <div className='stagetext'>
              <div id="prevStageButton"> {/* TODO hide if stage 1 and race started */}
                <button className={"buttonStandard " + this.props.racename} onClick={this.previousStage}><span className="h7 bold">   <FontAwesomeIcon icon={faAngleLeft} />   </span></button>
              </div>
              <span className="bold black h7">Stage: {this.state.stage}</span>
              {(this.state.stageType !== "FinalStandings" && this.state.stageType !== "" || mode === 'selection') && 
                <div id="nextStageButton">
                  <button className={"buttonStandard " + this.props.racename} onClick={this.nextStage}><span className="h7 bold">   <FontAwesomeIcon icon={faAngleRight} />   </span></button>
                </div>
              }
            </div>
            <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
            <ModalButton
              cssClassButton={"buttonStandard " + this.props.racename}
              content="Profile "
              contentIcon={<FontAwesomeIcon icon={faMountain} />}
              modalContent={stageProfile}
            />
          </div>
        </div>
        {mode === 'selection' && <StageSelectionPage
          teamSelection={this.state.teamSelection[budget]} kopman={this.state.kopman[budget]}
          prevClassifications={this.state.prevClassifications[budget]} stageSelection={this.state.stageSelection[budget]}
          loadingSelection={this.state.loadingSelection} starttime={new Date(this.state.starttime)} selectionsComplete={this.state.selectionsComplete}
          addRemoveRider={this.addRemoveRider} setKopman={this.setKopman} removeKopman={this.removeKopman}
        />}

        {/* Results TODO merge into one div*/}
        {mode === 'results' && <div className="stageContainer">
          {allSelectionsPopup}
          <div className="res">
            <LoadingDiv loading={this.state.loadingSelection} />
            <Table data={this.state.stageSelectionResults[budget]} title={"Selectie"} />
            <Table data={this.state.userScores[budget]} title={"Poule Stand"} coltype={this.state.userScoresColtype} />
          </div>
          <div className="stage">
            <LoadingDiv loading={this.state.loadingStageres} />
            <StageResultsTables data={this.state.stageResults[budget]} stageResultsLengths={this.state.stageResultsLengths} stageType={this.state.stageType} changedClassificationDisplay={this.changedClassificationDisplay} />
          </div>
          <LoadingDiv loading={this.state.loadingAll} />
        </div>}

      </div>
    )
  }
}

export default Stage