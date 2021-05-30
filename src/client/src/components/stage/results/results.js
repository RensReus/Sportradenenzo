import { Component } from 'react';
import axios from 'axios';
import ModalButton from '../../shared/modal'
import Table from '../../shared/table'
import ResultsTables from './resultsTables'
import LoadingDiv from '../../shared/loadingDiv'
import { updateArray } from '../helperfunctions'

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

  componentDidUpdate(prevProps) { //TODO trigger less
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
    const res = await axios.post('/api/getstageresultsDEPRICATED', { race_id: raceData.race_id, stage: raceData.stage, budgetParticipation: budget })
    if (res.data.mode === '404') {
      this.props.history.push('/');
    } else if (res.data.mode === 'results') {
      const state = this.state;
      const data = res.data;
      if (!res.data.resultsComplete) this.autoupdate();
      this.setState({
        userScoresColtype: res.data.userScoresColtype,
        stageSelectionResults: updateArray(state.stageSelectionResults, data.teamresult, budget),
        userScores: updateArray(state.userScores, data.userScores, budget),
        pouleTeamResultDownloaded: updateArray(state.pouleTeamResultDownloaded, true, budget),
        classificationIndex: this.state.classificationIndex
      }, () => {
        this.getStageResults(raceData)
      })
    }
  }

  changedClassificationDisplay = (classificationIndex) => {
    this.setState({ classificationIndex }, () => {
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
      this.setState({
        loadingPoule: false,
        loadingResults: false,
        stageResults: updateArray(this.state.stageResults, res.data.stageResults, budget, classificationIndex),
        stageResultsLengths: res.data.stageResultsLengths
      })
    }
  }

  getAllSelections = async () => { //TODO add loader
    const race_id = this.props.data.race_id;
    const stage = this.props.data.stage;
    const budget = this.props.data.budget;
    const res = await axios.post('/api/getAllSelections', { race_id, stage, budgetParticipation: budget })
    this.setState({
      allSelections: updateArray(this.state.allSelections, res.data.allSelections, budget),
      notSelected: updateArray(this.state.notSelected, res.data.notSelected, budget),
    })
  }

  setDownloadedTrue = (budget, classificationIndex) => {
    this.setState({
      classificationDownloaded: updateArray(this.state.classificationDownloaded, true, budget, classificationIndex),
    })
  }

  render() {
    let allSelectionsPopup
    const budget = this.props.data.budget

    //Results
    // TODO move all logic and popup to separate file
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