import axios from 'axios';
import Table from '../../shared/table'
import ResultsTables from './resultsTables.js'
import SelectionComparison from './selectionComparison.js'
import LoadingDiv from '../../shared/loadingDiv'
import { updateArray } from '../helperfunctions'
import { useHistory } from "react-router-dom";
import { useState, useEffect } from 'react';

const results = (props) => {
  let history = useHistory();
  const [loadingPoule, setLoadingPoule] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [stageSelectionResults, setStageSelectionResults] = useState([[], []]);
  const [userScores, setUserScores] = useState([[], []]);
  const [stageResultsLengths, setStageResultsLengths] = useState([0, 0, 0, 0, 0]); 
  const [stageResults, setStageResults] = useState([[[], [], [], [], []], [[], [], [], [], []]]); 
  const [classificationDownloaded, setClassificationDownloaded] = useState([[false, false, false, false, false], [false, false, false, false, false]]); 
  const [pouleTeamResultDownloaded, setPouleTeamResultDownloaded] = useState([false, false]); 
  const [classificationIndex, setClassificationIndex] = useState(props.data.stageType === "FinalStandings" ? 1 : 0);

  useEffect(() => {
    updateData(props.data);
  }, [props.data])

  useEffect(() => {
    getStageResults(props.data);
  }, [classificationIndex])

  const updateData = async (raceData) => {
    setLoadingPoule(true);
    setLoadingResults(true);
    setClassificationDownloaded([[false, false, false, false, false], [false, false, false, false, false]]);
    setPouleTeamResultDownloaded([false, false]);
    setStageResults([[[], [], [], [], []], [[], [], [], [], []]]);
    const budget = raceData.budget;
    getStageResults(raceData)
    const res = await axios.post('/api/getPouleTeamResults', { race_id: raceData.race_id, stage: raceData.stage, budgetParticipation: budget })
    const data = res.data;
    if (data.mode === '404') {
      history.push('/');
    } else if (data.mode === 'results') {
      if (!data.resultsComplete) autoupdate();
      setStageSelectionResults(updateArray(stageSelectionResults, data.teamresult, budget));
      setUserScores(updateArray(userScores, data.userScores, budget));
      setPouleTeamResultDownloaded(updateArray(pouleTeamResultDownloaded, true, budget));
    }
  }

  const changedClassificationDisplay = (classificationIndex) => {
    setClassificationIndex(classificationIndex)
  }

  const autoupdate = () => {
    var now = new Date();
    var msToGo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 10, 0) - now; //10s after autoscrape
    if (msToGo < 0) {
      msToGo += 60 * 1000; // plus 60s if negative
    }
    setTimeout(function () {
      updateData(props.data);
    }, msToGo);
  }

  const getStageResults = async (raceData) => {
    const budget = raceData.budget;
    if (!classificationDownloaded[budget][classificationIndex]) {
      setLoadingResults(true); //TODO subtielere loader zodat je gewoon al de results ziet maar wel een kleine hint krijgt dat er misschien nog wat extra bij komt
      const res = await axios.post('/api/getClassificationResults', { race_id: raceData.race_id, stage: raceData.stage, budgetParticipation: budget, classificationIndex });
      setClassificationDownloaded(updateArray(classificationDownloaded, true, budget, classificationIndex));
      setStageResults(updateArray(stageResults, res.data.stageResults, budget, classificationIndex));
      setStageResultsLengths(res.data.stageResultsLengths);
    }
    setLoadingPoule(false);
    setLoadingResults(false);
  }

  const budget = props.data.budget

  return (
    <div className="stageContainer">
      <SelectionComparison data={props.data} />
      <div className="res">
        <LoadingDiv loading={loadingPoule} />
        <Table data={stageSelectionResults[budget]} title={"Selectie"} />
        <Table data={userScores[budget]} title={"Poule Stand"} coltype={{ "Stage": 1, "Total": 1 }} />
      </div>
      <div className="stage">
        <LoadingDiv loading={loadingResults} />
        <ResultsTables data={stageResults[budget]} stageResultsLengths={stageResultsLengths}
          classificationIndex={classificationIndex} changedClassificationDisplay={changedClassificationDisplay} />
      </div>
    </div>
  )
}

export default results