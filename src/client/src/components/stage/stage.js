import { Component } from 'react';
import axios from 'axios';
import './index.css';
import ModalButton from '../shared/modal'
import Table from '../shared/table'
import Selection from './selection'
import StageResultsTables from './results'
import StageInfo from './info'
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
      budget: 0,
      stage: parseInt(this.props.match.params.stagenumber), //Haal het nummer uit de link
      stageSelectionResults: [[], []],
      userScores: [[], []],
      stageResults: [[[], [], [], [], []], [[], [], [], [], []]],
      stageResultsLengths: [0, 0, 0, 0, 0],
      allSelections: [[], []],
      notSelected: [[], []],
      oldracelink: '',
      classificationDownloaded: [[false, false, false, false, false], [false, false, false, false, false]],
      pouleTeamResultDownloaded: [false, false],
      classificationIndex: 0,
      stageType: ''
    }
    this.budgetSwitch = this.budgetSwitch.bind(this)
    this.previousStage = this.previousStage.bind(this);
    this.nextStage = this.nextStage.bind(this);
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
        this.updateMode(this.state.stage)
      })
    }
  }

  updateMode(stage) {
    axios.post('/api/getstagemode', { race_id: this.props.race_id, stage })
    .then((res) => {
      if (res.data.mode === '404') {
        this.props.history.push('/');
      } else {
        this.setState({ mode: res.data.mode })
      }
    })
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
    })
  }

  render() {
    const mode = this.state.mode
    const budget = this.state.budget;
    // Stage Info
    const stageInfoData = {
      race_id: this.props.race_id,
      racename: this.state.racename,
      stage: this.state.stage,
      stageType: this.state.stageType,
      budget: this.state.budget,
    };

    const stageInfoFunctions = {
      nextStage: this.nextStage,
      previousStage: this.previousStage,
      budgetSwitch: this.budgetSwitch,
    }

    // Selection
    const selectionData = {
      race_id: this.props.race_id,
      stage: this.state.stage,
      budget: this.state.budget,
    };

    let allSelectionsPopup

    //Results
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
        <StageInfo data={stageInfoData} functions={stageInfoFunctions} />
        {mode === 'selection' && <Selection data={selectionData} />}
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