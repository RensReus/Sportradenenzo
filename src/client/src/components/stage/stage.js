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
  const [mode, setMode] = useState('');
  const [stage, setStage] = useState(parseInt(props.match.params.stagenumber));
  const [stageType, setStageType] = useState('');
  const [starttime, setStarttime] = useState('');

  useEffect(() => {
    setStage(parseInt(props.match.params.stagenumber));
  }, [props])

  useEffect(() => {
    getStage(stage);
  }, [stage])// and budget?

  const getStage = async (stage) => {
    if (stage == 0 && mode === 'selection') {
      history.push('/teamselection')
      return;
    }
    history.push('/stage/' + (stage).toString())
    document.title = "Etappe " + stage;

    const res = await axios.post('/api/getstageinfo', { race_id: props.race_id, stage })
    if (res.data.mode === '404') {
      history.push('/');
    } else {
      setStageType(res.data.stageType);
      setMode(res.data.mode);
      setStarttime(res.data.starttime);
    }
  }

  const updateStage = (newStage) => {
    setStage(parseInt(newStage))
  }

  const childData = {
    race_id: props.race_id,
    stage,
    racename: props.racename,
    starttime,
    stageType: stageType,
    budget: props.budget ? 1 : 0,
    mode
  }

  return (
    <div>
      {/* <div className='float-right'> */}
      <StageInfo data={childData} updateStage={updateStage} />
      {/* </div> */}

      {mode === 'selection' && <Selection data={childData} />}

      {mode === 'results' && <Results data={childData} />}
    </div>
  )
}

const mapStateToProps = state => {
  return { budget: state.budgetSwitch.value };
};

export default connect(mapStateToProps)(Stage);