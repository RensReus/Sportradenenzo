import React, { Component } from 'react';
import './index.css';
import axios from 'axios';
import Table from '../shared/table'
import BudgetSwitchButton from '../shared/budgetSwitchButton';

class overzicht extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      data: [],
      coltype: [],
      tableName: '',
      extraTables: '',
      budget: false,
      budgetSwitchButton: '',
      currlink: '',
    });
    this.budgetSwitch = this.budgetSwitch.bind(this);
  }

  componentDidMount() {
    this.stateUpdateAndRender()
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.stateUpdateAndRender()
    }
  }

  stateUpdateAndRender() {
    if (this.props.match.params.selection !== this.state.currlink) {
      if (this.props.match.params.racename && this.props.match.params.year) {
        this.setState({
          race: this.props.match.params.racename,
          year: this.props.match.params.year,
          oldracelink: '/' + this.props.match.params.racename + '-' + this.props.match.params.year,
          budget: false,
          budgetSwitchButton: '',
        }, () => {
          this.renderPage()
        })
      } else if(this.props.racename){ //if racename not ''  {
          this.setState({
              racename: this.props.racename,
              year: this.props.year,
              budget: false,
              budgetSwitchButton: '',
          },()=>{
              this.renderPage()
          })
      }
    }
  }

  renderPage() {
    this.setState({
      currlink: this.props.match.params.selection,
      data: [],
      coltype: [],
      tableName: '',
      extraTables: '',
    }, () => {
      console.log("redir",this.props)
      switch (this.props.match.params.selection) {
        case "all": this.renderAll(); break;
        case "selected": this.renderSelected(); break;
        case "missedpoints": this.renderMissedPoints(); break;
        case "missedpointsall": this.renderMissedPointsAll(); break;
        case "team": this.renderTeam(); break;
        case "teamall": this.renderTeamAll(); break;
        case "teamallsimple": this.renderTeamAllSimple(); break;
        case "etappewinsten": this.renderEtappeWinsten(); break;
        case "overigestats": this.renderOverigeStats(); break;
        default: this.props.history.push(this.props.redirect); break;
      }
    })
  }

  budgetSwitch() {
    this.setState({ budget: !this.state.budget }, () => {
      this.renderPage()
    })
  }

  renderAll() {
    document.title = "Alle Renners Overzicht";
    axios.post('/api/getriderpointsall', { token: localStorage.getItem('authToken'), racename:this.state.racename, year:this.state.year})
      .then((res) => {
        if (res) {
          this.setState({
            data: res.data.tableData,
            coltype: res.data.coltype,
            tableName: res.data.title
          })
        }
      })
  }

  renderSelected() {
    document.title = "Gekozen Renners Overzicht";
      axios.post('/api/getriderpointsselected', { token: localStorage.getItem('authToken'), racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res) {
          this.setState({
            data: res.data.tableData,
            coltype: res.data.coltype,
            tableName: res.data.title,
            budgetSwitchButton: <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
          })
        }
      })
  }

  renderMissedPoints() {
    document.title = "Gemiste Punten";
      axios.post('/api/missedpoints', { token: localStorage.getItem('authToken'), racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
        .then((res) => {
          if (res) {
            this.setState({
              data: res.data.tableData,
              tableName: res.data.title,
              budgetSwitchButton: <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
            })
          }
        })
    }

  renderMissedPointsAll() {
    document.title = "Gemiste Punten Iedereen";
    axios.post('/api/missedpointsall', { token: localStorage.getItem('authToken'), racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res) {
          var extraTables = []
          for (var i in res.data.users) {
            extraTables.push(<div className="tableDiv" ><Table data={res.data.users[i].tableData} title={res.data.users[i].title} /></div>)
          }
          this.setState({
            extraTables: extraTables,
            budgetSwitchButton: <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
          })
        }
      })
  }

  renderTeam() {
    document.title = "Team Overzicht";
    axios.post('/api/teamoverzicht', { token: localStorage.getItem('authToken'), racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res) {
          this.setState({
            data: res.data.tableData,
            tableName: res.data.title,
            coltype: res.data.coltype,
            budgetSwitchButton: <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
          })
        }
      })
  }

  renderTeamAll() {
    document.title = "Team Overzicht Iedereen";
    axios.post('/api/teamoverzichtall', { token: localStorage.getItem('authToken'), racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res) {
          var extraTables = []
          for (var i in res.data.users) {
            extraTables.push(<div className="tableDiv" ><Table data={res.data.users[i].tableData} title={res.data.users[i].title} coltype={res.data.users[i].coltype} /></div>)
          }
          this.setState({
            extraTables: extraTables,
            budgetSwitchButton: <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
          })
        }
      })
  }

  renderTeamAllSimple() {
    document.title = "Team Overzicht Iedereen";
    axios.post('/api/teamoverzichtallsimple', { token: localStorage.getItem('authToken'), racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res) {
          var extraTables = []
          for (var i in res.data.simpleSelections) {
            extraTables.push(<div className="tableDiv" ><Table data={res.data.simpleSelections[i].data} title={res.data.simpleSelections[i].title} coltype={res.data.simpleSelections[i].coltype} /></div>)
          }
          this.setState({
            extraTables: extraTables,
            budgetSwitchButton: <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
          })
        }
      })
  }

  renderEtappeWinsten() {//werkt nog niet vorm van table klopt niet
    document.title = "Etappe Winsten Overzicht";
    axios.post('/api/getstagevictories', { racename:this.state.racename, year:this.state.year, token: localStorage.getItem('authToken'), budgetparticipation: this.state.budget })
      .then((res) => {
        if (res) {
          var extraTables = [];
          extraTables.push(<div className="tableDiv" ><Table data={res.data.rankTable} title={"Etappe Uitslagen"} /></div>)
          extraTables.push(<div className="tableDiv" ><Table data={res.data.countTable} title={"Hoe vaak welke positie"} /></div>)
          this.setState({
            extraTables: extraTables,
            budgetSwitchButton: <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
          })
        }
      })
  }

  renderOverigeStats() {
    document.title = "Overige Statistieken"
    axios.post('/api/getadditionalstats', { token: localStorage.getItem('authToken'), racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget }).then((res) => {
      if (res) {
        var extraTables = []
        for (var i in res.data.tables) {
          extraTables.push(<div className="tableDiv" ><Table data={res.data.tables[i].tableData} title={res.data.tables[i].title} coltype={res.data.tables[i].coltype} /></div>)
        }
        this.setState({
          extraTables: extraTables,
          budgetSwitchButton: <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
        })
      }
    })
  }


  render() {
    return (
      <div className="overzichtContainer">
        {this.state.budgetSwitchButton}
        <Table data={this.state.data} coltype={this.state.coltype} title={this.state.tableName} />
        {this.state.extraTables}
      </div>

    )
  }

}

export default overzicht