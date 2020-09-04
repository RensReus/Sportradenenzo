import React, { Component } from 'react';
import axios from 'axios';
//import './index.css';
import underConstruction from '../../under_construction.gif'

class ActiveRacesTable extends Component {
  render() {
    let racelinks = this.props.races.map(race => {
      return <button className={"buttonStandard " + race.name} onClick={() => this.props.goToRace(race)}><span className="h7 bold">Go to {race.name} - {race.year}</span></button>
    });
    return (
      <div>
        Active races:
        {racelinks}
      </div>
    )
  }
}

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      participations: [],
      activeRaces: [],
      finishedRacess: []
    });
    this.goToRace = this.goToRace.bind(this)
  }

  componentDidMount() {
    document.title = "Home";
    axios.post('/api/getracepartcipation')
      .then(res => {
        this.setState({
          participations: res.data
        })
      })
    axios.post('/api/getactiveraces')
      .then(res => {
        this.setState({
          activeRaces: res.data.activeRaces
        })
      })
      axios.post('/api/getfinishedraces')
      .then(res => {
        this.setState({
          finishedRacess: res.data.finishedRacess
        })
      })
  }

  goToRace(race) {
    this.props.setRace(race)
    this.props.history.push('/stage/'+race.stagenr)
  }


  render() {
    return (
      <div className="standardContainer">
        <div className="activeRaces">
          <ActiveRacesTable races={this.state.activeRaces} goToRace={this.goToRace}/>
        </div>
        <img src={underConstruction} alt="still building" />
                Coming Soon meer hier
                stuur suggesties naar Arjen Peijen
      </div>
    )
  }
}

export default Home