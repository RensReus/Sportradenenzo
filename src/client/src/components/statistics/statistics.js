import './index.css';
import axios from 'axios';
import Table from '../shared/table'
import StateSwitchButton from '../shared/stateSwitchButton';
import { useHistory } from "react-router-dom";
import { useState, useEffect } from 'react';
import { connect } from 'react-redux'

const statistics = (props) => {
  let history = useHistory();
  const [tables, setTables] = useState([]);
  const [details, setDetails] = useState(false);
  const [showClassifications, setShowClassifications] = useState(false);

  useEffect(() => {
    const getData = async (race_id, selection, budget) => {
      if (race_id === undefined) {
        history.push('/home')
      }
      const res = await axios.post('/api/statistics', { selection, race_id, budgetparticipation: budget, details, showClassifications })
      if (res.data.mode === '404') {
        history.push('/404');
      } else {
        document.title = res.data.title;
        var newTables = res.data.tables.map(x => <div className="tableDiv" ><Table data={x.tableData} title={x.title} coltype={x.coltype} hiddenCols={x.hiddenCols} /></div>)
        setTables(newTables);
      }
    }
    getData(props.race_id, props.match.params.selection, props.budget);
  }, [props, details, showClassifications])

  const detailsSwitch = () => {
    setDetails(!details);
  }

  const classificationsPointsSwitch = () => {
    setShowClassifications(!showClassifications);
  }

  return (
    <div className="statisticsContainer">
      {props.match.params.selection === "selectedriders" && <StateSwitchButton stateStrings={['Punten', 'Klassementen']} stateVar={showClassifications} stateVarSwitch={classificationsPointsSwitch} />}
      {props.match.params.selection === "teams" && tables.length > 0 && <StateSwitchButton stateStrings={['Simpel', 'Details']} stateVar={details} stateVarSwitch={detailsSwitch} />}
      {tables}
    </div>

  )
}

const mapStateToProps = state => {
  return { budget: state.budgetSwitch.value };
};

export default connect(mapStateToProps)(statistics);