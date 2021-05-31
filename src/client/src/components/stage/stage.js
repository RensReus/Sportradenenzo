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
      stageType: ''
    }
  }

  componentDidMount() {
    if (this.props.race_id === undefined) {
      this.props.history.push('/home')
    } else {
      this.setState({
        racename: this.props.racename,
      }, () => {
        this.getStage(this.state.stage)
      })
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
          stageType: res.data.stageType
        })
      }
    });
  }

  budgetSwitch = () => {
    this.setState({
      budget: !this.state.budget
    })
  }

  render() {
    const mode = this.state.mode

    const childData = {
      race_id: this.props.race_id,
      stage: this.state.stage,
      racename: this.state.racename,
      stageType: this.state.stageType,
      budget: this.state.budget,
      mode
    }

    const stageInfoFunctions = {
      getStage: this.getStage,
      budgetSwitch: this.budgetSwitch,
    }

    return (
      <div>
        <StageInfo data={childData} functions={stageInfoFunctions} />

        {mode === '404' && <span className="h6">404: Data not found</span>}

        {mode === 'selection' && <Selection data={childData} />}

        {mode === 'results' && <Results data={childData} />}
      </div>
    )
  }
}

export default Stage