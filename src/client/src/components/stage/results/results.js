import { Component } from 'react';
import axios from 'axios';
import ModalButton from '../../shared/modal'
import Table from '../../shared/table'
import ResultsTables from './resultsTables'
import LoadingDiv from '../../shared/loadingDiv'
import _ from "lodash"

class Results extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loadingPoule: false,
      loadingResults: false,
      stageSelectionResults: [[], []],
      userScores: [[], []],
      stageResults: [[[], [], [], [], []], [[], [], [], [], []]],
      stageResultsLengths: [0, 0, 0, 0, 0],
      allSelections: [[], []],
      notSelected: [[], []],
      classificationDownloaded: [[false, false, false, false, false], [false, false, false, false, false]],
      pouleTeamResultDownloaded: [false, false],
      classificationIndex: this.props.data.stageType === "FinalStandings" ? 1 : 0,
    }
  }

  componentDidMount() {
    this.updateData(this.props.data)
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.setState({
        classificationDownloaded: [[false, false, false, false, false], [false, false, false, false, false]],
        pouleTeamResultDownloaded: [false, false],
        stageResults: [[[], [], [], [], []], [[], [], [], [], []]]
      })
      this.updateData(this.props.data)
    }
  }

  updateData = async (raceData) => {
    this.setState({ loadingPoule: true, loadingResults: true })
    const budget = raceData.budget;
    const res = await axios.post('/api/getstage', { race_id: raceData.race_id, stage: raceData.stage, budgetParticipation: budget })
    if (res.data.mode === '404') {
      this.props.history.push('/');
    } else if (res.data.mode === 'results') {
      let stageSelectionResults = _.cloneDeep(this.state.stageSelectionResults)
      stageSelectionResults[budget] = res.data.teamresult;
      let userScores = _.cloneDeep(this.state.userScores)
      userScores[budget] = res.data.userscores;
      let pouleTeamResultDownloaded = _.cloneDeep(this.state.pouleTeamResultDownloaded)
      pouleTeamResultDownloaded[budget] = true;
      if (!res.data.resultsComplete) this.autoupdate();
      this.setState({
        userScoresColtype: res.data.userScoresColtype,
        stageSelectionResults,
        userScores: userScores,
        pouleTeamResultDownloaded,
        classificationIndex: this.state.classificationIndex
      }, () => {
        this.getStageResults(raceData)
      })
    }
  }

  changedClassificationDisplay = (classificationIndex) => {
    this.setState({
      classificationIndex
    }, () => {
      this.getStageResults(this.props.data);
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
        this.updateData(this.props.data)
      })
    }.bind(this), msToGo);
  }

  getStageResults = async (raceData) => {
    const budget = raceData.budget;
    const classificationIndex = this.state.classificationIndex;
    if (!this.state.classificationDownloaded[budget][classificationIndex]) {
      this.setState({ loadingResults: true })
      const res = await axios.post('/api/getStageResults', { race_id: raceData.race_id, stage: raceData.stage, budgetParticipation: budget, classificationIndex })
      this.setDownloadedTrue(budget, classificationIndex);
      let newResults = _.cloneDeep(this.state.stageResults);
      newResults[budget][classificationIndex] = res.data.stageResults;
      this.setState({
        loadingPoule: false,
        loadingResults: false,
        stageResults: newResults,
        stageResultsLengths: res.data.stageResultsLengths
      })
    }
  }

  getAllSelections = async () => { //TODO add loader
    const race_id = this.props.data.race_id;
    const stage = this.props.data.stage;
    const budget = this.props.data.budget;
    const res = await axios.post('/api/getAllSelections', { race_id, stage, budgetParticipation: budget })
    let newAllSelections = _.cloneDeep(this.state.allSelections);
    newAllSelections[budget] = res.data.allSelections;
    let newNotSelected = _.cloneDeep(this.state.notSelected);
    newNotSelected[budget] = res.data.notSelected;
    this.setState({
      allSelections: newAllSelections,
      notSelected: newNotSelected
    })
  }

  setDownloadedTrue = (budget, classificationIndex) => {
    let newClassificationDownloaded = _.cloneDeep(this.state.classificationDownloaded);
    newClassificationDownloaded[budget][classificationIndex] = true;
    this.setState({
      classificationDownloaded: newClassificationDownloaded
    })
  }

  render() {
    let allSelectionsPopup
    const budget = this.props.data.budget

    //Results
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
      cssClassButton={"buttonStandard " + this.props.data.racename}
      content="Alle opstellingen "
      modalContent={allSelectionsPopupContent}
      callback={this.getAllSelections}
    />
    return (
      <div className="stageContainer">
        {allSelectionsPopup}
        <div className="res">
          <LoadingDiv loading={this.state.loadingPoule} />
          <Table data={this.state.stageSelectionResults[budget]} title={"Selectie"} />
          <Table data={this.state.userScores[budget]} title={"Poule Stand"} coltype={this.state.userScoresColtype} />
        </div>
        <div className="stage">
          <LoadingDiv loading={this.state.loadingResults} />
          <ResultsTables data={this.state.stageResults[budget]} stageResultsLengths={this.state.stageResultsLengths} 
          classificationIndex={this.state.classificationIndex} changedClassificationDisplay={this.changedClassificationDisplay} />
        </div>
      </div>
    )
  }
}

export default Results