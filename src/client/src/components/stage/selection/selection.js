import { Component } from 'react';
import Table from '../../shared/table'
import LoadingDiv from '../../shared/loadingDiv'
import SelecTable from './SelecTable'
import axios from 'axios';
import _ from "lodash"

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
    const budget = this.props.data.budget;
    axios.post('/api/getstage', { race_id: this.props.data.race_id, stage, budgetParticipation: budget })
      .then((res) => {
        if (res.data.mode === '404') {
          this.props.history.push('/');
        } else {
          let teamSelection = _.cloneDeep(this.state.teamSelection)
          teamSelection[budget] = res.data.teamSelection;
          let stageSelection = _.cloneDeep(this.state.stageSelection)
          stageSelection[budget] = res.data.stageSelection;
          let kopman = _.cloneDeep(this.state.kopman)
          kopman[budget] = res.data.kopman;
          let prevClassifications = _.cloneDeep(this.state.prevClassifications)
          prevClassifications[budget] = res.data.prevClassifications;
          this.setState({
            mode: 'selection',
            teamSelection,
            stageSelection,
            kopman,
            starttime: res.data.starttime,
            prevClassifications,
            selectionsComplete: res.data.selectionsComplete,
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
        let kopman = _.cloneDeep(this.state.kopman);
        kopman[budget] = res.data.kopman;
        this.setState({
          kopman,
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
        let kopman = _.cloneDeep(this.state.kopman)
        kopman[budget] = res.data.kopman;
        let prevClassifications = _.cloneDeep(this.state.prevClassifications)
        prevClassifications[budget] = res.data.prevClassifications;
        let stageSelection = _.cloneDeep(this.state.stageSelection);
        stageSelection[budget] = res.data.stageSelection;
        this.setState({
          stageSelection,
          kopman,
          prevClassifications,
          selectionsComplete: res.data.selectionsComplete
        })
      })
  }

  render() {
    const budget = this.props.data.budget
    const prevClassifications = this.state.prevClassifications[budget];
    // TODO fix startttime
    // var dayArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] 
    // var minutes = this.state.starttime.getMinutes();
    // var minutesString = minutes < 10 ? "0" + minutes : minutes;
    // var starttimeString = dayArray[this.state.starttime.getDay()] + " " + this.state.starttime.getHours() + ":" + minutesString;
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
      <div className="stageContainer"> {/* TODO? fix css divs/ move to stage selection file */}
        <div className='stagetext'>
          <div className='stagestarttime h7 bold'> {/* TODO move to stage selection file? */}
            {/* {starttimeString} */}
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