import { Component, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from "react-router-dom";
import { useState } from 'react';
import SREButton from '../ui/SREButton'

class RacesTable extends Component {
  render() {
    let racelinks = this.props.races.map(race => {
      return (
        <div className="m-2" key={race.name + race.year}>
          <SREButton
            color={race.name}
            content={<span className="text-base bold">{race.name.charAt(0).toUpperCase() + race.name.slice(1)} - {race.year}</span>}
            onClick={() => this.props.goToRace(race)}
          />
        </div>
      )
    });
    return (
      <div>
        {this.props.title}:
        <div className="flex">{racelinks}</div>
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
          <RacesTable races={activeRaces} goToRace={goToRace} title={"Open Races"} />
        </div>
        {finishedRaces.length > 0?
        <div className="finishedRace">
          <RacesTable races={finishedRaces} goToRace={goToRace} title={"Past Races"} />
        </div>
        :<></>}
      </div>
    )
  }
}

export default Home