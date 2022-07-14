import axios from 'axios';
import StateSwitchButton from '../shared/stateSwitchButton';
import CanvasJSChart from './CanvasJSChart';
import { useHistory } from "react-router-dom";
import { useState, useEffect } from 'react';
import { connect } from 'react-redux'

const charts = (props) => {
  let history = useHistory();
  const [options, setOptions] = useState({});
  const [grouped, setGrouped] = useState({});
  const [showEind, setShowEind] = useState(false);
  const chartname = props.match.params.chartname;

  useEffect(() => {
    const getData = async (race_id, chartname, budgetparticipation, fabFourOnly) => {
      if (race_id === undefined) {
        history.push('/home')
      }
      var apilink = '/api/' + chartname
      var extraParams = {}
      switch (chartname) {
        case "missedpointsspread":
        case "missedpointsspreadrelatief":
        case "totalscorespread":
          apilink += grouped ? 'grouped' : ''
          break;
        case "scorespread":
          extraParams = { excludeFinal: !showEind }
          apilink += grouped ? 'grouped' : ''
          break;
      }
      const res = await axios.post(apilink, { race_id, budgetparticipation, fabFourOnly, extraParams })
      document.title = res.data.title
      var newOptions = res.data.options;
      newOptions.theme = 'dark1'
      setOptions(newOptions);
    }
    getData(props.race_id, chartname, props.budgetparticipation, props.fabFourOnly);
  }, [props, grouped, showEind])

  const showEindSwitch = () => {
    setShowEind(!showEind)
  }

  const groupedSwitch = () => {
    setGrouped(!grouped)
  }

  return (
    <div className="statisticsContainer">
      {chartname === "scorespread" &&
        <StateSwitchButton stateStrings={['Zonder', 'Met Eindklassement']} stateVar={showEind} stateVarSwitch={showEindSwitch} />
      }
      {chartname.includes("spread") &&
        <StateSwitchButton stateStrings={['', 'Gegroepeerd']} stateVar={grouped} stateVarSwitch={groupedSwitch} />
      }
      <CanvasJSChart options={options} />
    </div>
  );
}

const mapStateToProps = state => {
  return {
    budgetparticipation: state.budgetSwitch.value,
    fabFourOnly: state.fabFourSwitch.value
  };
};

export default connect(mapStateToProps)(charts);