import React, { Component } from 'react';
import axios from 'axios';
import StateSwitchButton from '../shared/stateSwitchButton';


var CanvasJS = require('./canvasjs.min');
CanvasJS = CanvasJS.Chart ? CanvasJS : window.CanvasJS;

class CanvasJSChart extends Component {
  static _cjsContainerId = 0
  constructor(props) {
    super(props);
    this.options = props.options ? props.options : {};
    this.containerProps = props.containerProps ? props.containerProps : { width: "100%", position: "relative" };
    this.containerProps.height = props.containerProps && props.containerProps.height ? props.containerProps.height : this.options.height ? this.options.height + "px" : "400px";
    this.chartContainerId = "canvasjs-react-chart-container-" + CanvasJSChart._cjsContainerId++;
  }
  componentDidMount() {
    //Create Chart and Render		
    this.chart = new CanvasJS.Chart(this.chartContainerId, this.options);
    this.chart.render();

    if (this.props.onRef)
      this.props.onRef(this.chart);
  }
  shouldComponentUpdate(nextProps, nextState) {
    //Check if Chart-options has changed and determine if component has to be updated
    return !(nextProps.options === this.options);
  }
  componentDidUpdate() {
    //Update Chart Options & Render
    this.chart.options = this.props.options;
    this.chart.render();
  }
  componentWillUnmount() {
    //Destroy chart and remove reference
    this.chart.destroy();
    if (this.props.onRef)
      this.props.onRef(undefined);
  }
  render() {
    return <div id={this.chartContainerId} style={this.containerProps} />
  }
}

class ThemeSelector extends Component {
  render() {
    return (
      <div>
        <div>Theme</div>
        <select value={this.props.theme} onChange={this.props.changeTheme}>
          <option value="light1">light1</option>
          <option value="light2">light2</option>
          <option value="dark1">dark1</option>
          <option value="dark2">dark2</option>
        </select>
      </div>
    );
  }
}


class Charts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: {},
      race_id: '',
      budget: false,
      showEind: false,
      theme: "dark1",
      grouped: false,
      showGroupedSwitchButton: false
    };
    this.changeTheme = this.changeTheme.bind(this);
    this.budgetSwitch = this.budgetSwitch.bind(this);
    this.showEindSwitch = this.showEindSwitch.bind(this);
    this.groupedSwitch = this.groupedSwitch.bind(this);
  }

  componentDidMount() {
    if (this.props.race_id === undefined) {
      this.props.history.push('/home')
    } else{
      this.setState({
        race_id: this.props.race_id,
        budget: false,
      }, () => {
        this.renderPage()
      })
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.renderPage();
    }
  }

  renderPage() {
    var apilink = '/api/'
    var extraParams = {}
    var showGroupedSwitchButton = false;

    switch (this.props.match.params.chartname) {
      case "userscores":
        apilink += 'chartuserstagescores'
        break;
      case "userrank":
        apilink += 'chartuserranking'
        break;
      case "riderpercentage":
        apilink += 'chartriderpercentage'
        break;
      case "scorespread":
        apilink += 'chartscorespread'
        extraParams = { perStage: this.state.grouped }
        showGroupedSwitchButton = true;
        apilink += this.state.grouped ? 'grouped' : ''
        break;
      case "totalscorespread":
        apilink += 'charttotalscorespread'
        extraParams = { perRace: this.state.grouped }
        showGroupedSwitchButton = true;
        apilink += this.state.grouped ? 'grouped' : ''
        break;
      default:
        apilink += 'userscores'
    }
    axios.post(apilink, { race_id: this.state.race_id, budgetparticipation: this.state.budget, extraParams })
      .then((res) => {
          this.setState({ options: res.data.options, showGroupedSwitchButton })
          document.title = res.data.title
      })
  }

  budgetSwitch() {
    this.setState({ budget: !this.state.budget }, () => {
      this.renderPage()
    })
  }

  showEindSwitch() {
    this.setState({ showEind: !this.state.showEind }, () => {
      this.renderPage()
    })
  }

  groupedSwitch() {
    this.setState({ grouped: !this.state.grouped }, () => {
      this.renderPage()
    })
  }

  changeTheme(event) {
    this.setState({ theme: event.target.value });
  }

  render() {
    var options = this.state.options;
    options.theme = this.state.theme;
    return (
      <div className="overzichtContainer">
        <StateSwitchButton stateStrings={['Gewoon', 'Budget']} stateVar={this.state.budget} stateVarSwitch={this.budgetSwitch} />
        <StateSwitchButton stateStrings={['Zonder', 'Met Eindklassement']} stateVar={this.state.showEind} stateVarSwitch={this.showEindSwitch} />
        {this.state.showGroupedSwitchButton &&
          <StateSwitchButton stateStrings={['', 'Gegroepeerd']} stateVar={this.state.grouped} stateVarSwitch={this.groupedSwitch} />
        }
        <ThemeSelector changeTheme={this.changeTheme} theme={this.state.theme} />
        <CanvasJSChart options={options} />
      </div>
    );
  }
}


export default Charts;                              