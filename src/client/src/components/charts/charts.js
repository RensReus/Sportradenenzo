import axios from 'axios';
import StateSwitchButton from '../shared/stateSwitchButton';
import CanvasJSChart from './CanvasJSChart';
import { useHistory } from "react-router-dom";
import { useState, useEffect } from 'react';
import { connect } from 'react-redux'

charts = (props) => {
  let history = useHistory();
  const [options, setOptions] = useState({});
  const [grouped, setGrouped] = useState({});
  const [showEind, setShowEind] = useState(false);
  const chartname = props.match.params.chartname;

  useEffect(() => {
    const getData = async (race_id, chartname, budget) => {
      if (race_id === undefined) {
        history.push('/home')
      }
      var apilink = '/api/' + chartname
      var extraParams = {}
      switch (chartname) {
        case "totalscorespread":
          extraParams = { perRace: grouped }
          apilink += grouped ? 'grouped' : ''
          break;
        case "scorespread":
          extraParams = { perStage: grouped, excludeFinal: !showEind }
          apilink += grouped ? 'grouped' : ''
          break;
      }
      const res = await axios.post(apilink, { race_id, budgetparticipation: budget, extraParams })
      document.title = res.data.title
      var newOptions = res.data.options;
      console.log(newOptions)
      newOptions.theme = 'dark1'
      setOptions(newOptions);
    }
    getData(props.race_id, chartname, props.budget);
  }, [props, grouped, showEind])

  showEindSwitch = () => {
    setShowEind(!showEind)
  }

  groupedSwitch = () => {
    setGrouped(!grouped)
  }

  return (
    <div className="statisticsContainer">
      {chartname === "scorespread" &&
        <StateSwitchButton stateStrings={['Zonder', 'Met Eindklassement']} stateVar={showEind} stateVarSwitch={showEindSwitch} />
      }
      {chartname.includes("scorespread") &&
        <StateSwitchButton stateStrings={['', 'Gegroepeerd']} stateVar={grouped} stateVarSwitch={groupedSwitch} />
      }
      <CanvasJSChart options={options} />
    </div>
  );
}

mapStateToProps = state => {
  return { budget: state.budgetSwitch.value };
};

export default connect(mapStateToProps)(charts);