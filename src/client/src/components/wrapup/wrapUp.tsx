import axios from 'axios';
import Table from '../shared/table'
import { useHistory } from "react-router-dom";
import { useState, useEffect } from 'react';
import { connect } from 'react-redux'

interface UserScore {
  User: string,
  Total: number,
  User_link: string,
}

interface RiderScore {
  Name: string;
  Team: string;
  PPM: string;
  Price: number;
  Total: number;
  Usercount: number;
  Users: string;
  dnf: string;
}

const wrapup = () => {
  let history = useHistory();
  const [bestDealsTable, setBestDealTable] = useState<JSX.Element>();
  const [bestRidersTable, setBestRidersTable] = useState<JSX.Element>();
  const [worstRidersTable, setWorstRidersTable] = useState<JSX.Element>();
  const [podium, setPodium] = useState<JSX.Element>();

  useEffect(() => {
    const getData = async (race_id: number) => {
      if (race_id === undefined) {
        history.push('/home');
      }
      const resRiderPoints = await axios.post('/api/racestatistics/25');
      const resScores = await axios.post('/api/getPouleTeamResults', { 
        race_id, 
        stage: 22, 
        budgetParticipation: false 
      });
      if (resScores.data.mode === '404') {
        history.push('/404');
      } else {
        document.title = "Tour 2022 wrap-up";
        const bestAndWorst = getBestAndWorstRiders(resRiderPoints.data);
        const bestDealsTable = mapToTable(bestAndWorst.bestDeals, "Beste deals");
        setBestDealTable(bestDealsTable);
        const bestRidersTable = mapToTable(bestAndWorst.bestRiders, "Beste renners");
        setBestRidersTable(bestRidersTable);
        const worstRidersTable = mapToTable(bestAndWorst.worstRiders, "Grootste miskopen");
        setWorstRidersTable(worstRidersTable);
        setPodium(createPodium(resScores.data.userScores));
      }
    }
    getData(25);
  }, [])

  return (
    <div className="flex flex-col space-y-8 items-center statisticsContainer">
      <div className="w-full max-w-sm">
        <span className="text-lg">Eindklassement Tour de France 2022</span>
        <div className="bg-white shadow-md">
          {podium}
        </div>
      </div>
      <div className="flex flex-col max-w-5xl space-y-4">
        {bestRidersTable}
        {bestDealsTable}
        {worstRidersTable}
      </div>
    </div>
  )
}

const mapStateToProps = (state: any) => {
  return { 
    budgetparticipation: state.budgetSwitch.value,
    fabFourOnly: state.fabFourSwitch.value
   };
};

const getBestAndWorstRiders = (riders: RiderScore[]) => {
  const sortedRiders = riders.sort((a, b) => (parseInt(a.PPM) - a.Price/100000) > (parseInt(b.PPM) - b.Price/100000) ? -1 : 1);
  const bestDeals = [
    sortedRiders[0], 
    sortedRiders[1],
    sortedRiders[2],
    sortedRiders[3],
    sortedRiders[4],
  ];
  const end = sortedRiders.length-1;
  const worstRiders = [
    sortedRiders[end], 
    sortedRiders[end-1], 
    sortedRiders[end-2],
    sortedRiders[end-3],
    sortedRiders[end-4],
  ];
  const sortedRidersPoints = riders.sort((a, b) => a.Total > b.Total ? -1 : 1);
  const bestRiders = [
    sortedRidersPoints[0], 
    sortedRidersPoints[1], 
    sortedRidersPoints[2],
    sortedRidersPoints[3], 
    sortedRidersPoints[4],
  ];
  return {
    bestRiders,
    bestDeals,
    worstRiders, 
  }
}

const createPodium = (users: UserScore[]) => {
  let row: JSX.Element[] = [];
  console.log(fillPodiumRow(users[0], 'text-lg bold', ''))
  row.push(fillPodiumRow(users[0], 'text-lg bold', '🏆'));
  row.push(fillPodiumRow(users[1], 'text-lg', '🥈'));
  row.push(fillPodiumRow(users[2], 'text-lg', '🥉'));
  console.log(row)
  for(let i=3;i<users.length;i++) {
    row.push(fillPodiumRow(users[i], 'text-base text-gray-700'))
  }
  console.log(row)
  return <table>{row}</table>;
}

const fillPodiumRow = (user: UserScore, rowClass?: string, trophy?: string) => {
  return (<tr className={rowClass}>
    <td className="w-8">{trophy}</td>
    <td>{user.User}</td>
    <td className="w-12 pr-4">{user.Total}</td>
  </tr>)
}

const mapToTable = (data: any[], title?: string) => {
  return (
  <div className="tableDiv" key={title} >
    <Table data={data} title={title}/>
  </div>
  )
}

export default connect(mapStateToProps)(wrapup);