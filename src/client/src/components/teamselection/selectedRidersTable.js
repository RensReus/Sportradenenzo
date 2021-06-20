import { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from "@fortawesome/free-solid-svg-icons";

class Deselectionbutton extends Component {
  addRemoveRider = () => {
    this.props.addRemoveRider('removeRider', this.props.riderID, this.props.budgetParticipation);
  }
  render() {
    return (
      <button className='button_standard small text red' onClick={() => this.addRemoveRider(this.props.riderID, this.props.budgetParticipation)}><FontAwesomeIcon icon={faTimes} /></button>
    )
  }
}

class UserRiderrow extends Component {
  render() {
    const rider = this.props
    return (
      <tr>
        <td>
          <div>
          <div>
            {rider.firstname} {rider.lastname}
          </div>
          <div className="text-gray-500 mt-2">
            {rider.team}
          </div>
          </div>
        </td>
        <td>
          {rider.price.toLocaleString('nl', { useGrouping: true })}
        </td>
        <td>
          <Deselectionbutton addRemoveRider={this.props.addRemoveRider} riderID={this.props.riderID} budgetParticipation={this.props.budgetParticipation} />
        </td>
      </tr>
    )
  }
}
class SelectedRidersTable extends Component {Table
  render() {
    const rows = this.props.selection.map(({ firstname, lastname, team, price, rider_participation_id}) => {
      return <UserRiderrow 
        firstname={firstname} 
        lastname={lastname} 
        team={team} 
        price={price} 
        key={rider_participation_id} 
        riderID={rider_participation_id} 
        budgetParticipation={this.props.budgetParticipation} 
        addRemoveRider={this.props.addRemoveRider} 
        />;
    });
    return (
      <table className="teamselection-table userteam">
        <thead>
          <tr>
            <th colSpan="4">Selection 
            {this.props.selection.length<10?
              <span className="text-blue-500"> 0</span>:' '
            }
            {this.props.selection.length}/20</th>
          </tr>
        </thead>
        <tbody>
          {rows}
          {this.props.selection.length == 0?
          <tr>
          <td colSpan="4">
            <div className="text-gray-400 text-center text-2xl">Click on a rider to add them to your selection</div>
          </td>
          </tr>
          :
          <></>  
          }
        </tbody>
      </table>
    )
  }
}

export default SelectedRidersTable