import { Component } from 'react';
import Table from '../../shared/table'
import LoadingDiv from '../../shared/loadingDiv'
import SelecTable from './SelecTable'
import { getSelectionData, updateKopmanCall, updateRiderCall } from './selectionHelperFunctions'
import jwt_decode from "jwt-decode";

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
  }

  componentDidMount() {
    this.setSelectionData(this.props.data.stage)
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.setSelectionData(this.props.data.stage);
    }
  }

  setSelectionData = async (stage) => {
    this.setState({ loading: true })
    const selectionData = await getSelectionData(stage, this.state, this.props);
    if (selectionData.mode === '404') {
      props.history.push('/');
    }
    this.setState(selectionData);
  }

  updateKopman = async (rider_participation_id, setremove) => {
    const updatedSelection = await updateKopmanCall(rider_participation_id, setremove, this.state, this.props)
    this.setState(updatedSelection);
  }

  updateRider = async (rider_participation_id, addRemove) => {
    const updatedSelection = await updateRiderCall(rider_participation_id, addRemove, this.state, this.props)
    this.setState(updatedSelection);
  }

  render() {
    const budget = this.props.data.budget
    const prevClassifications = this.state.prevClassifications[budget];
    const selecTableData = {
      teamSelection: this.state.teamSelection[budget],
      kopman: this.state.kopman[budget],
      selectionIDs: this.state.stageSelection[budget].map(rider => rider.rider_participation_id),
      loading: this.props.data.loading || this.state.loading
    }
    const authToken = localStorage.getItem('authToken')
    const memberOfFabFour = authToken ? jwt_decode(localStorage.getItem('authToken')).account_id <= 5 : false;
    let completeText = this.state.selectionsComplete[0] === 10 ? "Opstelling Compleet" : "Opstelling niet compleet"
    const selecTableFunctions = {
      updateRider: this.updateRider,
      updateKopman: this.updateKopman
    }
    return (
      <div className="">
        <div className="w-1/5 stagetext">
          {memberOfFabFour &&
            <div className={"completeContainer " + ((this.state.selectionsComplete[0] + this.state.selectionsComplete[1]) === 20 ? "allCompleet" : "")}>Compleet:
            <div className="gewoonCompleet"><div style={{ width: this.state.selectionsComplete[0] * 10 + "%" }} className={"backgroundCompleet teamSize"}></div><div className="textCompleet">Gewoon</div></div>
              <div className="budgetCompleet"><div style={{ width: this.state.selectionsComplete[1] * 10 + "%" }} className={"backgroundCompleet teamSize"}></div><div className="textCompleet">Budget</div></div>
            </div>}
          {!memberOfFabFour &&
            <div className="completeContainerNewUsers ">
              <div className="gewoonCompleet"><div style={{ width: this.state.selectionsComplete[0] * 10 + "%" }} className={"backgroundCompleetNewUsers teamSize"}></div><div className="textCompleet">{completeText}</div></div>
            </div>
          }
        </div>
        <div className='w-1/2'>
          <SelecTable data={selecTableData} functions={selecTableFunctions} />
        </div>
        <div className="prevClassifications w-1/2"> {/* TODO maak eigen component met static widths*/}
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