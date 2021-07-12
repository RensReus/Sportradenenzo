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
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  useEffect(() => {
    const getData = async (race_id, selection, budget) => {
      if (race_id === undefined) {
        history.push('/home')
      }
      const res = await axios.post('/api/statistics', { selection, race_id, budgetparticipation: budget, details, showSelectedOnly })
      if (res.data.mode === '404') {
        history.push('/404');
      } else {
        document.title = res.data.title;
        var newTables = res.data.tables.map(x => <div className="tableDiv" key={x.title} ><Table data={x.tableData} title={x.title} coltype={x.coltype} hiddenCols={x.hiddenCols} /></div>)
        setTables(newTables);
      }
    }
    getData(props.race_id, props.match.params.selection, props.budget);
  }, [props, details, showSelectedOnly])

  const detailsSwitch = () => {
    setDetails(!details);
  }

  const allSelectedSwitch = () => {
    setShowSelectedOnly(!showSelectedOnly);
  }

  return (
    <div className="statisticsContainer">
      {props.match.params.selection === "allriders" && <StateSwitchButton stateStrings={['Alle', 'Geselecteerde']} stateVar={showSelectedOnly} stateVarSwitch={allSelectedSwitch} />}
      {props.match.params.selection === "teams" && tables.length > 0 && <StateSwitchButton stateStrings={['Simpel', 'Details']} stateVar={details} stateVarSwitch={detailsSwitch} />}
      {tables}
    </div>

  )
}

const mapStateToProps = state => {
  return { budget: state.budgetSwitch.value };
};

export default connect(mapStateToProps)(statistics);