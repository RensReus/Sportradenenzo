import { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faPlus, faCheckCircle as solFaCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { faCheckCircle as regFaCheckCircle } from "@fortawesome/free-regular-svg-icons"; // add/remove riders
import LoadingDiv from '../../../shared/loadingDiv'
import FlagIcon from '../../../shared/flagIcon'

class SelecTableRow extends Component {
  render() {
    let updateRiderButton
    let updateKopmanButton
    if (this.props.selected === 'selected') {
      updateRiderButton = <button className="button_standard small red" onClick={() => this.props.updateRider(this.props.riderID, 'remove')}><FontAwesomeIcon icon={faTimes} /></button>
      if (this.props.kopman === this.props.riderID) {
        updateKopmanButton = <button className="button_standard small green block m-auto" onClick={() => this.props.updateKopman(this.props.riderID, 'remove')}><FontAwesomeIcon icon={solFaCheckCircle} /></button>
      } else {
        updateKopmanButton = <button className="button_standard small yellow block m-auto" onClick={() => this.props.updateKopman(this.props.riderID, 'set')}><FontAwesomeIcon icon={regFaCheckCircle} /></button>
      }
    } else if (this.props.selected === 'unselected') {
      updateRiderButton = <button className="button_standard small blue" onClick={() => this.props.updateRider(this.props.riderID, 'add')}><FontAwesomeIcon icon={faPlus} /></button>
    }
    return (
      <tr className={this.props.selected}>
        <td><FlagIcon code={this.props.country}/></td>
        <td>{this.props.name}</td>
        <td>{this.props.team}</td>
        <td className="selectbutton">{updateKopmanButton}</td>
        <td className="selectbutton">{updateRiderButton}</td>
      </tr>
    )
  }
}

class SelecTable extends Component {
  render() {
    const selectionIDs = this.props.data.selectionIDs;
    const selectionLength = selectionIDs.length;
    const teamSelectionSorted = this.props.data.teamSelection.sort(function (a, b) {//put selected on top
      var aSelected = selectionIDs.includes(a.rider_participation_id);
      var bSelected = selectionIDs.includes(b.rider_participation_id);
      if (aSelected === bSelected) return 0;
      if (aSelected) return -1;
      return 1;
    })

    const rows = teamSelectionSorted.map(({ firstname, lastname, team, rider_participation_id, dnf, country }) => {
      var name = firstname + " " + lastname;
      var selectedState = "unselected"
      selectedState = selectionLength >= 9 ? "unselectable" : selectedState;
      selectedState = dnf ? "dnf" : selectedState;
      selectedState = selectionIDs.includes(rider_participation_id) ? 'selected' : selectedState;
      return <SelecTableRow name={name} team={team} country={country} selected={selectedState} key={rider_participation_id} riderID={rider_participation_id} kopman={this.props.data.kopman} updateRider={this.props.functions.updateRider} updateKopman={this.props.functions.updateKopman} />
    })
    return (
      <div className="selecTable w-full" style={{ position: 'relative' }}>
        <LoadingDiv loading={this.props.data.loading} />
        <table className="table-standard blue rounded w-full">
          <thead>
            <tr>
              <th></th>
              <th>Naam</th>
              <th>Team</th>
              <th>Kopman</th>
              <th>{selectionLength}/9</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    )
  }
}

export default SelecTable