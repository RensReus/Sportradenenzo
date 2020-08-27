import React, { Component } from 'react';
import axios from 'axios';
import BudgetSwitchButton from '../shared/budgetSwitchButton';


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
    //return React.createElement('div', { id: this.chartContainerId, style: this.containerProps });		
    return <div id={this.chartContainerId} style={this.containerProps} />
  }
}

class TypeSelector extends Component {
  render() {
    return (
      <div>
        <div>ChartType</div>
        <select value={this.props.chartType} onChange={this.props.handleChange}>
          <option value="stackedArea100">Relatief</option>
          <option value="stackedArea">Absoluut</option>
          <option value="line">Absoluut per renner</option>
        </select>
      </div>
    );
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


class charts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: {},
      chartname: this.props.match.params.chartname,
      chartType: "",
      chartTypeOptions: [],
      data: [],
      racename: '',
      year: '',
      budget: false,
      budgetSwitchButton: '',
      theme: "dark1"
    };
    this.handleChange = this.handleChange.bind(this);
    this.changeTheme = this.changeTheme.bind(this);
  }

  componentDidMount() {
    if (this.props.match.params.racename && this.props.match.params.year) {
      this.setState({
        racename: this.props.match.params.racename,
        year: this.props.match.params.year,
        budget: false,
      }, () => {
        this.props.setRace(this.state.racename)
        this.initialRender()
      })
    } else if (this.props.racename) { //if racename not ''  {
      this.setState({
        racename: this.props.racename,
        year: this.props.year,
        budget: false,
      }, () => {
        this.initialRender()  
      })
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.initialRender();
    }
  }

  initialRender() {
    switch (this.props.match.params.chartname) {
      case "userscores":
        this.userscores();
        document.title = "Chart: User Scores";
        this.setState({ chartType: "line" })
        break;
      case "userrank":
        this.userranking();
        document.title = "User Rankings";
        this.setState({ chartType: "line" })
        break;
      case "riderpercentage":
        this.riderpercentage()
        document.title = "Chart: Renners Punten Aandeel/Relatief";
        this.setState({ chartType: "stackedColumn" })
        break;
      case "riderpercentagetotal":
        this.riderpercentagetotal()
        document.title = "Chart: Renners Punten Aandeel/Absoluut";
        this.setState({ chartType: "stackedArea" })
        break;
      case "scorespread":
        this.scorespread()
        document.title = "Chart: Score Spreiding";
        this.setState({ chartType: "column" })
        break;
      case "totalscorespread":
        this.totalscoresspread()
        document.title = "Chart: Score Spreiding";
        this.setState({ chartType: "column" })
        break;
      default:
        this.newChart();
    }
  }

  set404() {
    console.log('error 404')
    document.title = "404";
  }

  userscores() {
    console.log("userscores")
    axios.post('/api/chartuserstagescores', { racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res.data.mode !== '404') {
          this.setState({ data: res.data }, () => {
            this.buildUserscores()
          })
        } else {
          this.set404()
        }
      })
  }

  buildUserscores() {
    var data = this.state.data;
    for (var i in data) {
      data[i].type = this.state.chartType
    }
    var options = {
      title: {
        text: "Scores"
      },
      subtitles: [{
        text: "Totaal score na iedere etappe"
      }],
      axisX: {
        interval: 1,
        title: "Stage"
      },
      axisY: {
        title: "Points"
      },
      toolTip: {
        shared: true
      },
      data: data
    }
    this.setState({ options: options })
  }

  userranking() {
    axios.post('/api/chartuserranking', { racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res.data.mode !== '404') {
          this.setState({ data: res.data }, () => {
            this.buildUserranking()
          })
        } else {
          this.set404()
        }
      })
  }

  buildUserranking() {
    var data = this.state.data;
    for (var i in data) {
      data[i].type = this.state.chartType
    }
    var options = {
      title: {
        text: "Ranking"
      },
      subtitles: [{
        text: "Positie na iedere etappe"
      }],
      axisX: {
        interval: 1,
        title: "Stage"
      },
      axisY: {
        title: "Rank",
      },
      toolTip: {
        shared: true
      },
      data: data
    }
    this.setState({ options: options })
  }

  riderpercentage() {
    axios.post('/api/chartriderpercentage', { racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res) {
          this.setState({ data: res.data }, () => {
            this.buildRiderpercentage()
          })
        }
      })
  }

  buildRiderpercentage() {
    var data = this.state.data;
    for (var i in data) {
      data[i].type = this.state.chartType
    }
    var options = {
      title: {
        text: "Scores per etappe"
      },
      subtitles: [{
        text: "Punten per renner"
      }],
      axisX: {
        title: "Stage",
        interval: 1
      },
      axisY: {
        title: "Points"
      },
      toolTip: {
        content: "{name}: {y} ",
      },
      data: data
    }
    this.setState({ options: options })
  }

  riderpercentagetotal() {
    axios.post('/api/chartriderpercentagetotal', { racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res) {
          this.setState({ data: res.data }, () => {
            this.buildRiderpercentagetotal(this.state.chartType)
          })
        } else {
          this.set404()
        }
      })
  }

  buildRiderpercentagetotal(value) {
    var data = this.state.data;
    for (var i in data) {
      data[i].type = value
    }
    var options = {
      title: {
        text: "Totaal Scores"
      },
      subtitles: [{
        text: "Punten per renner"
      }],
      axisX: {
        title: "Stage",
        interval: 1
      },
      axisY: {
        title: "Points"
      },
      toolTip: {
        content: "{name}: {y} "
      },
      data: data
    }
    this.setState({ options: options })
  }

  scorespread() {
    axios.post('/api/chartscorespread', { racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget, excludeFinal: true })
      .then((res) => {
        if (res) {
          this.setState({ data: res.data }, () => {
            this.buildscorespread()
          })
        }
      })
  }

  totalscoresspread() {
    axios.post('/api/charttotalscorespread', { racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res) {
          this.setState({ data: res.data }, () => {
            this.buildscorespread()
          })
        }
      })
  }

  buildscorespread() {
    var data = this.state.data;
    var options = {
      title: {
        text: "Scores"
      },
      height: 800,
      axisY: {
        title: "Points"
      },
      toolTip: {
        backgroundColor: 'black',
        fontColor: 'white'
      },
      data: data
    }

    this.setState({ options: options })
  }

  newChart() {
    axios.post('/api/newchart', { racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res) {
          this.setState({ data: res.data }, () => {
            this.buildNewChart()
          })
        }
      })
  }

  buildNewChart() {
    var data = this.state.data;
    var options = {
      title: {
        text: "Scores"
      },
      height: 800,
      axisY: {
        title: "Points"
      },
      data: data
    }

    this.setState({ options: options })
  }

  budgetSwitch() {
    this.setState({ budget: !this.state.budget }, () => {
      this.renderPage()
    })
  }

  handleChange(event) {
    this.setState({ chartType: event.target.value },()=>{
      this.buildRiderpercentagetotal(event.target.value)
    });
  }

  changeTheme(event) {
    this.setState({ theme: event.target.value });
  }

  render() {
    let typeSelector = "";
    if (this.state.chartname === "riderpercentagetotal") {
      typeSelector = <TypeSelector handleChange={this.handleChange} chartType={this.state.chartType} />
    }
    var options = this.state.options;
    options.theme = this.state.theme;
    return (
      <div className="overzichtContainer">
        <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
        {typeSelector}
        <ThemeSelector changeTheme={this.changeTheme} theme={this.state.theme} />
        <CanvasJSChart options={options} />
      </div>
    );
  }
}


export default charts;                              