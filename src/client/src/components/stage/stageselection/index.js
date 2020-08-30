import React, { Component } from 'react';
import Table from '../../shared/table'
import LoadingDiv from '../../shared/loadingDiv'
import SelecTable from './SelecTable'

class stageSelectionPage extends Component {
  render() {
    const prevClassifications = this.props.prevClassifications;
    var dayArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    var starttimeString = dayArray[this.props.starttime.getDay()] + " " + this.props.starttime.getHours() + ":" + this.props.starttime.getMinutes();
    return (
      <div className="stageContainer"> {/* TODO? fix css divs/ move to stage selection file */}
        <div className='stagetext'>
          <div className='stagestarttime h7 bold'> {/* TODO move to stage selection file? */}
            {starttimeString}
          </div>
          <div className={"completeContainer " + ((this.props.selectionsComplete[0] + this.props.selectionsComplete[1]) === 20 ? "allCompleet" : "")}>Compleet:
        <div className="gewoonCompleet"><div style={{ width: this.props.selectionsComplete[0] + "%" }} className={"backgroundCompleet teamSize"}></div><div className="textCompleet">Gewoon</div></div>
            <div className="budgetCompleet"><div style={{ width: this.props.selectionsComplete[1] + "%" }} className={"backgroundCompleet teamSize"}></div><div className="textCompleet">Budget</div></div>
          </div>
        </div>
        <SelecTable
          teamSelection={this.props.teamSelection} selectionIDs={this.props.stageSelection.map(rider => rider.rider_participation_id)}
          kopman={this.props.kopman} addRemoveRider={this.props.addRemoveRider} setKopman={this.props.setKopman} removeKopman={this.props.removeKopman} loading={this.props.loadingSelection} />
        <div className="prevClassifications"> {/* TODO maak eigen component */}
          <LoadingDiv loading={this.props.loadingSelection} />
          <div style={{ display: prevClassifications[0].length ? 'block' : 'none', float: "left" }} className="GC"><Table data={prevClassifications[0]} title="AK" /></div>
          <div style={{ display: prevClassifications[1].length ? 'block' : 'none', float: "left" }} className="Points"><Table data={prevClassifications[1]} title="Punten" /></div>
          <div style={{ display: prevClassifications[2].length ? 'block' : 'none', float: "left" }} className="KOM"><Table data={prevClassifications[2]} title="Berg" /></div>
          <div style={{ display: prevClassifications[3].length ? 'block' : 'none', float: "left" }} className="Youth"><Table data={prevClassifications[3]} title="Jong" /></div>
        </div>
      </div>
    )
  }
}

export default stageSelectionPage