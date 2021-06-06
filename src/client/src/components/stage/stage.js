import axios from 'axios';
import './index.css';
import Selection from './selection'
import Results from './results'
import StageInfo from './info'
import { useHistory } from "react-router-dom";
import { useState, useEffect } from 'react';
import { connect } from 'react-redux'

const Stage = (props) => {
  let history = useHistory();
  const [modeTypeTime, setModeTypeTime] = useState({mode: '', stageType: '', starttime: ''})
  const [stage, setStage] = useState(parseInt(props.match.params.stagenumber));

  useEffect(() => {
    setStage(parseInt(props.match.params.stagenumber));
  }, [props])

  useEffect(() => {
    getStage(stage);
  }, [stage])

  const getStage = async (stage) => {
    if (stage == 0 && modeTypeTime.mode === 'selection') {
      history.push('/teamselection')
      return;
    }
    history.push('/stage/' + (stage).toString())
    document.title = "Etappe " + stage;

    const res = await axios.post('/api/getstageinfo', { race_id: props.race_id, stage })
    if (res.data.mode === '404') {
      history.push('/');
    } else {
      setModeTypeTime({mode: res.data.mode, stageType: res.data.stageType, starttime: res.data.starttime})
    }
  }

  const updateStage = (newStage) => {
    setStage(parseInt(newStage))
  }

  const childData = {
    race_id: props.race_id,
    stage,
    racename: props.racename,
    starttime: modeTypeTime.starttime,
    stageType: modeTypeTime.stageType,
    budget: props.budget ? 1 : 0,
    mode: modeTypeTime.mode
  }

  return (
    <div>
      {/* <div className='float-right'> */}
      <StageInfo data={childData} updateStage={updateStage} />
      {/* </div> */}

      {modeTypeTime.mode === 'selection' && stage !== 0 && <Selection data={childData} />}

      {modeTypeTime.mode === 'results' && <Results data={childData} />}
    </div>
  )
}

const mapStateToProps = state => {
  return { budget: state.budgetSwitch.value };
};

export default connect(mapStateToProps)(Stage);