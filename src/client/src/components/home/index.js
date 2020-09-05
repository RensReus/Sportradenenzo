import React, { Component } from 'react';
import axios from 'axios';
//import './index.css';
import underConstruction from '../../under_construction.gif'

class RacesTable extends Component {
  render() {
    let racelinks = this.props.races.map(race => {
      return <button className={"raceButtonHomepage " + race.name} key={race.name + race.year} onClick={() => this.props.goToRace(race)}><span className="h7 bold">Go to {race.name.charAt(0).toUpperCase() + race.name.slice(1)} - {race.year}</span></button>
    });
    return (
      <div>
        {this.props.title}:
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
      finishedRaces: []
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
        let activeRaces = res.data.activeRaces;
        this.setState({
          activeRaces
        },()=>{
          if (activeRaces.length && localStorage.getItem('autoRedirectOnHomepage') === 'true'){
            this.goToRace(activeRaces[0])
          }
        })
      })
    axios.post('/api/getfinishedraces')
      .then(res => {
        this.setState({
          finishedRaces: res.data.finishedRaces
        })
      })
  }

  goToRace(race) {
    this.props.setRace(race)
    this.props.history.push('/stage/' + race.stagenr)
  }


  render() {
    return (
      <div className="standardContainer">
        <div className="activeRaces">
          <RacesTable races={this.state.activeRaces} goToRace={this.goToRace} title={"Lopende Races"} />
        </div>
        <div className="finishedRace">
          <RacesTable races={this.state.finishedRaces} goToRace={this.goToRace} title={"Afgelopen Races"} />
        </div>
        <img src={underConstruction} alt="still building" />
                Coming Soon meer hier
                stuur suggesties naar Arjen Peijen
      </div>
    )
  }
}

export default Home