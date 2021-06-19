import { Component, useEffect } from 'react';
import axios from 'axios';
import underConstruction from '../../under_construction.gif'
import { useHistory } from "react-router-dom";
import { useState } from 'react';

class RacesTable extends Component {
  render() {
    let racelinks = this.props.races.map(race => {
      return <button className={"raceButton " + race.name} key={race.name + race.year} onClick={() => this.props.goToRace(race)}><span className="h7 bold">Go to {race.name.charAt(0).toUpperCase() + race.name.slice(1)} - {race.year}</span></button>
    });
    return (
      <div>
        {this.props.title}:
        {racelinks}
      </div>
    )
  }
}

const Home = (props) => {
  let history = useHistory();
  const [finishedRaces, setFinishedRaces] = useState([]);
  const [activeRaces, setActiveRaces] = useState([]);

  useEffect(() => {
    const getHomePageInfo = async () => {
      document.title = "Home";
      var res = await axios.post('/api/getHomePageInfo')
      setActiveRaces(res.data.activeRaces);
      setFinishedRaces(res.data.finishedRaces);
    }
    getHomePageInfo();
  }, [props]);

  useEffect(() => {
    if (activeRaces.length === 1 && localStorage.getItem('autoRedirectOnHomepage') === 'true') {
      goToRace(activeRaces[0])
    }
  },[activeRaces])

  const goToRace = (race) => {
    props.setRace(race)
    if (race.stagenr === 0) {// before start
      history.push('/teamselection')
    } else {
      history.push('/stage/' + race.stagenr)
    }
  }
  if (finishedRaces.length === 0 && activeRaces.length === 0) return (<></>)
  else {
    return (
      <div className="standardContainer">
        <div className="activeRaces">
          <RacesTable races={activeRaces} goToRace={goToRace} title={"Lopende Races"} />
        </div>
        <div className="finishedRace">
          <RacesTable races={finishedRaces} goToRace={goToRace} title={"Afgelopen Races"} />
        </div>
        <img src={underConstruction} alt="still building" />
            Coming Soon meer hier
            stuur suggesties naar Arjen Peijen
      </div>
    )
  }
}

export default Home