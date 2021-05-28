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
      stage: parseInt(this.props.match.params.stagenumber), //Haal het nummer uit de link
      oldracelink: '',
      stageType: ''
    }
    this.budgetSwitch = this.budgetSwitch.bind(this)
    this.previousStage = this.previousStage.bind(this);
    this.nextStage = this.nextStage.bind(this);
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
    document.title = "Etappe " + stage;
    axios.post('/api/getstageinfo', { race_id: this.props.race_id, stage })
    .then((res) => {
      if (res.data.mode === '404') {
        this.props.history.push('/');
      } else {
        this.setState({ 
          mode: res.data.mode,
          stageType: res.data.stageType
        })
      }
    })
  }

  previousStage() {
    const currentstage = parseInt(this.state.stage)
    if (currentstage > 1) {
      this.setState({
        stage: currentstage - 1
      }, () => {
        this.props.history.push(this.state.oldracelink + '/stage/' + (currentstage - 1).toString())
        this.updateMode(currentstage - 1)
      })
    } else if (this.state.mode === 'selection') {
      this.props.history.push('/teamselection')
    }
  }

  nextStage() {
    const currentstage = parseInt(this.state.stage)
    this.props.history.push(this.state.oldracelink + '/stage/' + (currentstage + 1).toString())
    this.setState({
      stage: currentstage + 1
    }, () => {
      this.updateMode(currentstage + 1)
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
      mode: this.state.mode,
      budget,
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
      budget,
    };

    // Results
    const resultsData = {
      race_id: this.props.race_id,
      racename: this.state.racename,
      stage: this.state.stage,
      stageType: this.state.stageType,
      budget
    };

    return (
      <div>
        <StageInfo data={stageInfoData} functions={stageInfoFunctions} />

        {mode === '404' && <span className="h6">404: Data not found</span>}

        {mode === 'selection' && <Selection data={selectionData} />}

        {mode === 'results' && <Results data={resultsData} />}

      </div>
    )
  }
}

export default Stage