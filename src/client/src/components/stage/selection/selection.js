import { Component } from 'react';
import Table from '../../shared/table'
import LoadingDiv from '../../shared/loadingDiv'
import { updateArray } from '../helperfunctions'
import SelecTable from './SelecTable'
import axios from 'axios';

class Selection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      starttime: '',
      loading: true,
      stageSelection: [[], []],
      teamSelection: [[], []],
      kopman: [null, null],
      prevClassifications: [[[], [], [], []], [[], [], [], []]],
      selectionsComplete: [0, 0],
    }
    this.setRemoveKopman = this.setRemoveKopman.bind(this)
    this.updateData = this.updateData.bind(this);
    this.addRemoveRider = this.addRemoveRider.bind(this);
  }

  componentDidMount() {
    this.updateData(this.props.data.stage)
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.updateData(this.props.data.stage);
    }
  }

  updateData(stage) {
    this.setState({ loading: true })
    const budget = this.props.data.budget;
    axios.post('/api/getstage', { race_id: this.props.data.race_id, stage, budgetParticipation: budget })
      .then((res) => {
        const data = res.data;
        if (data.mode === '404') {
          this.props.history.push('/');
        } else {
          const state = this.state;
          this.setState({
            mode: 'selection',
            teamSelection: updateArray(state.teamSelection, budget, data.teamSelection),
            stageSelection: updateArray(state.stageSelection, budget, data.stageSelection),
            kopman: updateArray(state.kopman, budget, data.kopman),
            starttime: data.starttime,
            prevClassifications: updateArray(state.prevClassifications, budget, data.prevClassifications),
            selectionsComplete: data.selectionsComplete,
            loading: false
          })
        }
      })
  }

  setRemoveKopman(rider_participation_id, setremove) {
    const stage = this.props.data.stage;
    const race_id = this.props.data.race_id;
    const budget = this.props.data.budget;
    const link = setremove === 'set' ? 'setkopman' : 'removekopman';
    axios.post('/api/' + link, { race_id, stage, rider_participation_id, budgetParticipation: budget })
      .then((res) => {
        this.setState({
          kopman: updateArray(this.state.kopman, budget, res.data.kopman),
          selectionsComplete: res.data.selectionsComplete
        })
      })
  }

  addRemoveRider(rider_participation_id, addRemove) {
    const stage = this.props.data.stage
    const race_id = this.props.data.race_id
    const budget = this.props.data.budget
    const link = addRemove === 'add' ? 'addridertostage' : 'removeriderfromstage';
    axios.post('/api/' + link, { race_id, stage, rider_participation_id, budgetParticipation: budget })
      .then((res) => {
        const state = this.state;
        const data = res.data;
        this.setState({
          stageSelection: updateArray(state.stageSelection, budget, data.stageSelection),
          kopman: updateArray(state.kopman, budget, data.kopman),
          prevClassifications: updateArray(state.prevClassifications, budget, data.prevClassifications),
          selectionsComplete: data.selectionsComplete
        })
      })
  }

  render() {
    const budget = this.props.data.budget
    const prevClassifications = this.state.prevClassifications[budget];
    var starttime = new Date(this.state.starttime);
    var dayArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] 
    var minutes = starttime.getMinutes();
    var minutesString = minutes < 10 ? "0" + minutes : minutes;
    var starttimeString = dayArray[starttime.getDay()] + " " + starttime.getHours() + ":" + minutesString;
    const selecTableData = {
      teamSelection: this.state.teamSelection[budget],
      kopman: this.state.kopman[budget],
      selectionIDs: this.state.stageSelection[budget].map(rider => rider.rider_participation_id),
      loading: this.props.data.loading || this.state.loading
    }

    const selecTableFunctions = {
      addRemoveRider: this.addRemoveRider,
      setRemoveKopman: this.setRemoveKopman
    }
    return (
      <div className="stageContainer">
        <div className='stagetext'>
          <div className='stagestarttime h7 bold'>
            {starttimeString}
          </div>
          <div className={"completeContainer " + ((this.state.selectionsComplete[0] + this.state.selectionsComplete[1]) === 20 ? "allCompleet" : "")}>Compleet:
        <div className="gewoonCompleet"><div style={{ width: this.state.selectionsComplete[0] * 10 + "%" }} className={"backgroundCompleet teamSize"}></div><div className="textCompleet">Gewoon</div></div>
            <div className="budgetCompleet"><div style={{ width: this.state.selectionsComplete[1] * 10 + "%" }} className={"backgroundCompleet teamSize"}></div><div className="textCompleet">Budget</div></div>
          </div>
        </div>
        <SelecTable data={selecTableData} functions={selecTableFunctions} />
        <div className="prevClassifications"> {/* TODO maak eigen component */}
          <LoadingDiv loading={this.props.data.loading || this.state.loading} />
          <div style={{ display: prevClassifications[0].length ? 'block' : 'none', float: "left" }} className="GC"><Table data={prevClassifications[0]} title="AK" /></div>
          <div style={{ display: prevClassifications[1].length ? 'block' : 'none', float: "left" }} className="Points"><Table data={prevClassifications[1]} title="Punten" /></div>
          <div style={{ display: prevClassifications[2].length ? 'block' : 'none', float: "left" }} className="KOM"><Table data={prevClassifications[2]} title="Berg" /></div>
          <div style={{ display: prevClassifications[3].length ? 'block' : 'none', float: "left" }} className="Youth"><Table data={prevClassifications[3]} title="Jong" /></div>
        </div>
      </div>
    )
  }
}

export default Selection