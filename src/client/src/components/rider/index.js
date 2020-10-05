import React, { Component } from 'react';
import axios from 'axios';
import Table from '../shared/table'
import FlagIcon from '../shared/flagIcon'

class Rider extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      posData: [],
      pointsData: [],
      coltype: [],
      tableName: '',
      riderName: '',
      selectedRace: 0,
      races: []
    });
  }


  componentDidMount() {
    axios.post('/api/getriderresults', { rider_id: this.props.match.params.rider_id})
      .then((res) => {
        if (res) {
          document.title = res.data.riderName;
          this.setState({
            selectedRace: res.data.pointsData.length-1,
            posData: res.data.posData,
            pointsData: res.data.pointsData,
            riderName: res.data.riderName,
            country: res.data.country,
            races: res.data.races
          })
        }
      })
  }

  render() {
    let selectedRace = this.state.selectedRace
    let posData = this.state.posData[selectedRace] === undefined ? [] : this.state.posData[selectedRace]
    let pointsData = this.state.pointsData[selectedRace] === undefined ? [] : this.state.pointsData[selectedRace]
    let racelinks = this.state.races.map((race, index) => {
      return <button className={"raceButton " + race.name} disabled={index===selectedRace} key={race.name + race.year} onClick={() => this.setState({selectedRace:index})}><span className="h7 bold">{race.name.charAt(0).toUpperCase() + race.name.slice(1)} - {race.year}</span></button>
    });
    let selectedRaceInfo = this.state.races[selectedRace] === undefined ? {team:'', name: '', year: ''} : this.state.races[selectedRace]
    return (
      <div className="statisticsContainer">
        {racelinks}
        <div className="h3">{this.state.riderName} <FlagIcon code={this.state.country}/> - {selectedRaceInfo.team} </div>
        <div className="h4">{selectedRaceInfo.name.charAt(0).toUpperCase() + selectedRaceInfo.name.slice(1)} - {selectedRaceInfo.year} </div>
        <div className='tableDiv'><Table data={posData} title={"Uitslagen"} /></div>
        <div className='tableDiv'><Table data={pointsData} title={"Punten"} /></div>
      </div>

    )
  }

}

export default Rider