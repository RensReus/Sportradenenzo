import axios from 'axios';
import './index.css';
import Selection from './selection'
import Results from './results'
import StageInfo from './info'
import { useHistory } from "react-router-dom";
import { useState, useEffect } from 'react';
import { connect } from 'react-redux'
import RulesPopup from '../shared/RulesPopup';

const Stage = (props) => {
  let history = useHistory();
  const [modeTypeTimeStage, setModeTypeTimeStage] = useState({ mode: '', stageType: '', starttime: '', stage: parseInt(props.match.params.stagenumber) })

  useEffect(() => {
    getStage(parseInt(props.match.params.stagenumber));
  }, [])

  const getStage = async (stage) => {
    if (stage == 0 && modeTypeTimeStage.mode === 'selection') {
      history.push('/teamselection')
      return;
    }
    history.push('/stage/' + (stage).toString())
    document.title = "Etappe " + stage;

    const res = await axios.post('/api/getstageinfo', { race_id: props.race_id, stage })
    if (res.data.mode === '404') {
      history.push('/');
    } else {
      setModeTypeTimeStage({ mode: res.data.mode, stageType: res.data.stageType, starttime: res.data.starttime, stage })
    }
  }

  const childData = {
    race_id: props.race_id,
    stage: modeTypeTimeStage.stage,
    racename: props.racename,
    starttime: modeTypeTimeStage.starttime,
    stageType: modeTypeTimeStage.stageType,
    budget: props.budget ? 1 : 0,
    mode: modeTypeTimeStage.mode
  }

  return (
    <div>
      {/* <div className='float-right'> */}
      <StageInfo data={childData} updateStage={getStage} />
      {/* </div> */}
      <div>
        <RulesPopup page={"stageSelection"} raceName={props.racename} />
      </div>
      {modeTypeTimeStage.mode === 'selection' && <Selection data={childData} />}

      {modeTypeTimeStage.mode === 'results' && <Results data={childData} />}
    </div>
  )
}

const mapStateToProps = state => {
  return { budget: state.budgetSwitch.value };
};

export default connect(mapStateToProps)(Stage);