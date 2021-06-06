import { Component } from 'react';
import axios from 'axios';
import './index.css';
import Selection from './selection'
import Results from './results'
import StageInfo from './info'

class Stage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: '',
      budget: 0,
      stage: parseInt(this.props.match.params.stagenumber),
      stageType: '',
      starttime: ''
    }
  }

  componentDidMount() {
    if (this.props.race_id === undefined) {
      this.props.history.push('/home')
    } else {
      this.getStage(this.state.stage)
    }
  }

  getStage = (stage) => {
    if (stage == 0 && this.state.mode === 'selection') {
      this.props.history.push('/teamselection')
      return;
    }
    this.setState({ stage }, async () => {
      this.props.history.push('/stage/' + (stage).toString())
      document.title = "Etappe " + stage;

      const res = await axios.post('/api/getstageinfo', { race_id: this.props.race_id, stage })
      if (res.data.mode === '404') {
        this.props.history.push('/');
      } else {
        this.setState({
          mode: res.data.mode,
          starttime: res.data.starttime,
          stageType: res.data.stageType
        })
      }
    });
  }

  budgetSwitch = () => {
    this.setState({
      budget: (this.state.budget - 1) * -1
    })
  }

  starttimeString = (starttimeInput) => {
    var starttime = new Date(starttimeInput);
    var dayArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return dayArray[starttime.getDay()] + " " + starttime.toLocaleString().replace(/-[0-9]{4}/,'').replace(':00','')
  }

  render() {
    const mode = this.state.mode

    const childData = {
      race_id: this.props.race_id,
      stage: this.state.stage,
      racename: this.props.racename,
      starttime: this.state.starttime,
      stageType: this.state.stageType,
      budget: this.state.budget,
      mode
    }

    const stageInfoFunctions = {
      getStage: this.getStage,
      budgetSwitch: this.budgetSwitch,
      starttimeString: this.starttimeString
    }

    return (
      <div>
        {/* <div className='float-right'> */}
          <StageInfo data={childData} functions={stageInfoFunctions} />
        {/* </div> */}

        {mode === '404' && <span className="h6">404: Data not found</span>}

        {mode === 'selection' && <Selection data={childData} />}

        {mode === 'results' && <Results data={childData} />}
      </div>
    )
  }
}

export default Stage