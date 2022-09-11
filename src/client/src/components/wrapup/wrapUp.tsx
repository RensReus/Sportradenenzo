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

interface WrapUpProps {
  race_id: number
}

const wrapup = (props: WrapUpProps) => {
  let history = useHistory();
  const [bestDealsTable, setBestDealTable] = useState<JSX.Element>();
  const [bestRidersTable, setBestRidersTable] = useState<JSX.Element>();
  const [bestRidersExclTeamTable, setBestRidersExclTeamTable] = useState<JSX.Element>();
  const [worstRidersTable, setWorstRidersTable] = useState<JSX.Element>();
  const [podium, setPodium] = useState<JSX.Element>();

  useEffect(() => {
    const getData = async (race_id: number) => {
      if (race_id === undefined) {
        history.push('/home');
      }
      const resRiderPoints = await axios.post('/api/wrapup', { race_id }); //TODO budget participation
      const resScores = await axios.post('/api/getPouleTeamResults', {
        race_id,
        stage: 22,
        budgetParticipation: false
      });
      if (resScores.data.mode === '404') {
        history.push('/404');
      } else {
        document.title = "Tour 2022 wrap-up";
        const bestAndWorst = getBestAndWorstRiders(resRiderPoints.data[0].rows, resRiderPoints.data[1].rows);
        const bestDealsTable = mapToTable(bestAndWorst.bestDeals, "Beste deals");
        setBestDealTable(bestDealsTable);
        const bestRidersTable = mapToTable(bestAndWorst.bestRiders, "Beste renners");
        setBestRidersTable(bestRidersTable);
        const bestRidersExclTeamTable = mapToTable(bestAndWorst.bestDealsExclTeam, "Beste deals (Excl. Teampunten)");
        setBestRidersExclTeamTable(bestRidersExclTeamTable);
        const worstRidersTable = mapToTable(bestAndWorst.worstRiders, "Grootste miskopen");
        setWorstRidersTable(worstRidersTable);
        setPodium(createPodium(resScores.data.userScores));
      }
    }
    getData(props.race_id);
  }, [])

  return (
    <div className="flex flex-col space-y-8 items-center statisticsContainer">
      <div className="w-full max-w-sm">
        <span className="text-lg">Eindklassement</span>
        <div className="bg-white shadow-md">
          {podium}
        </div>
      </div>
      <div className="flex flex-col max-w-5xl space-y-4">
        {bestRidersTable}
        {bestDealsTable}
        {bestRidersExclTeamTable}
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

const getBestAndWorstRiders = (riders: RiderScore[], ridersExclTeam: RiderScore[]) => {
  const sortedRiders = riders.sort((a, b) => (parseInt(a.PPM) - a.Price / 100000) > (parseInt(b.PPM) - b.Price / 100000) ? -1 : 1);
  const sortedRidersExclTeam = ridersExclTeam.sort((a, b) => (parseInt(a.PPM) - a.Price / 100000) > (parseInt(b.PPM) - b.Price / 100000) ? -1 : 1);
  const bestDeals = [
    sortedRiders[0],
    sortedRiders[1],
    sortedRiders[2],
    sortedRiders[3],
    sortedRiders[4],
  ];
  const bestDealsExclTeam = [
    sortedRidersExclTeam[0],
    sortedRidersExclTeam[1],
    sortedRidersExclTeam[2],
    sortedRidersExclTeam[3],
    sortedRidersExclTeam[4],
  ];
  const end = sortedRiders.length - 1;
  const worstRiders = [
    sortedRiders[end],
    sortedRiders[end - 1],
    sortedRiders[end - 2],
    sortedRiders[end - 3],
    sortedRiders[end - 4],
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
    bestDealsExclTeam,
    worstRiders,
  }
}

const createPodium = (users: UserScore[]) => {
  let row: JSX.Element[] = [];
  row.push(fillPodiumRow(users[0], 'text-lg bold', '🏆'));
  row.push(fillPodiumRow(users[1], 'text-lg', '🥈'));
  row.push(fillPodiumRow(users[2], 'text-lg', '🥉'));
  for (let i = 3; i < users.length; i++) {
    row.push(fillPodiumRow(users[i], 'text-base text-gray-700'))
  }
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
      <Table data={data} title={title} />
    </div>
  )
}

export default connect(mapStateToProps)(wrapup);