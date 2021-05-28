import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserMinus, faUserPlus, faCheckCircle as solFaCheckCircle } from "@fortawesome/free-solid-svg-icons"; // add/remove riders
import { faCheckCircle as regFaCheckCircle } from "@fortawesome/free-regular-svg-icons"; // add/remove riders
import LoadingDiv from '../../../shared/loadingDiv'
import FlagIcon from '../../../shared/flagIcon'

class SelecTableRow extends Component {
  render() {
    let addRemoveButton
    let setKopmanButton
    if (this.props.selected === 'selected') {
      addRemoveButton = <button className="selectbutton" onClick={() => this.props.addRemoveRider(this.props.riderID, 'remove')}><FontAwesomeIcon icon={faUserMinus} /></button>
      if (this.props.kopman === this.props.riderID) {
        setKopmanButton = <button className="selectbutton" onClick={() => this.props.setRemoveKopman(this.props.riderID, 'remove')}><FontAwesomeIcon icon={solFaCheckCircle} /></button>
      } else {
        setKopmanButton = <button className="selectbutton" onClick={() => this.props.setRemoveKopman(this.props.riderID, 'set')}><FontAwesomeIcon icon={regFaCheckCircle} /></button>
      }
    } else if (this.props.selected === 'unselected') {
      addRemoveButton = <button className="selectbutton" onClick={() => this.props.addRemoveRider(this.props.riderID, 'add')}><FontAwesomeIcon icon={faUserPlus} /></button>
    }
    return (
      <tr className={this.props.selected}>
        <td className="selectbutton">{setKopmanButton}</td>
        <td><FlagIcon code={this.props.country}/></td>
        <td>{this.props.name}</td>
        <td>{this.props.team}</td>
        <td className="selectbutton">{addRemoveButton}</td>
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
      var selected = 'unselected';
      if (selectionIDs.includes(rider_participation_id)) {
        selected = 'selected'
      }
      if (dnf) {
        return <SelecTableRow name={name} team={team} country={country} selected='dnf' key={rider_participation_id} riderID={rider_participation_id} kopman={this.props.data.kopman} addRemoveRider={this.props.functions.addRemoveRider} />
      } else if ((selectionLength >= 9 && selected !== 'selected')) {
        return <SelecTableRow name={name} team={team} country={country} selected='unselectable' key={rider_participation_id} riderID={rider_participation_id} kopman={this.props.data.kopman} addRemoveRider={this.props.functions.addRemoveRider} />
      } else {
        if (selected === 'selected') {
          return <SelecTableRow name={name} team={team} country={country} selected={selected} key={rider_participation_id} riderID={rider_participation_id} kopman={this.props.data.kopman} addRemoveRider={this.props.functions.addRemoveRider} setRemoveKopman={this.props.functions.setRemoveKopman} />
        } else {
          return <SelecTableRow name={name} team={team} country={country} selected={selected} key={rider_participation_id} riderID={rider_participation_id} kopman={this.props.data.kopman} addRemoveRider={this.props.functions.addRemoveRider} />
        }
      }
    })
    return (
      <div className="selecTable" style={{ position: 'relative' }}>
        <LoadingDiv loading={this.props.data.loading} />
        <table>
          <caption>{selectionLength}/9</caption>
          <thead>
            <tr>
              <th>Kopman</th>
              <th></th>
              <th>Name</th>
              <th>Team</th>
              <th>   </th>
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