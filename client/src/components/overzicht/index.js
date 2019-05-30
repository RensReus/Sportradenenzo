import React, { Component } from 'react';
import './index.css';
import axios from 'axios';
import Table from '../table'

class overzicht extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      data: [],
      coltype: [],
      tableName: '',
      extraTables: '',
      budget: false,
      switchButton: ''
    });
    this.budgetSwitch = this.budgetSwitch.bind(this);
  }

  componentWillMount() {
    switch (this.props.match.params.selection) {
      case "all": this.renderAll(); break;
      case "selected": this.renderSelected(); break;
      case "missedpoints": this.renderMissedPoints(); break;
      case "missedpointsall": this.renderMissedPointsAll(); break;
      case "team": this.renderTeam(); break;
      case "teamall": this.renderTeamAll(); break;
      case "etappewinsten": this.renderEtappeWinsten(); break;
      default: this.renderAll(); break;
    }
  }

  budgetSwitch() {
    this.setState({budget: !this.state.budget},() =>{
    switch (this.props.match.params.selection) {
      case "all": this.renderAll(); break;
      case "selected": this.renderSelected(); break;
      case "missedpoints": this.renderMissedPoints(); break;
      case "missedpointsall": this.renderMissedPointsAll(); break;
      case "team": this.renderTeam(); break;
      case "teamall": this.renderTeamAll(); break;
      case "etappewinsten": this.renderEtappeWinsten(); break;
      default: this.renderAll(); break;
    }
    })
}

  renderAll() {
    document.title = "Alle Renners Overzicht";
    axios.post('/api/getriderpointsall', {token: localStorage.getItem('authToken'), race_id: 5})
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
    axios.post('/api/getriderpointsselected', {token: localStorage.getItem('authToken'), race_id: 5, poule_id: 0, budgetparticipation:this.state.budget})
      .then((res) => {
        if (res) {
          this.setState({
            data: res.data.tableData,
            coltype: res.data.coltype,
            tableName: res.data.title,
            switchButton: <button onClick={this.budgetSwitch}>Switch naar {!this.state.budget ? ' Budget' : ' Gewoon'}</button>
          })
        }
      })
  }

  renderMissedPoints() {
    document.title = "Gemiste Punten";
    axios.post('/api/missedpoints', {token: localStorage.getItem('authToken'), race_id: 5, budgetparticipation:this.state.budget})
      .then((res) => {
        if (res) {
          this.setState({
            data: res.data.tableData,
            tableName: res.data.title,
            switchButton: <button onClick={this.budgetSwitch}>Switch naar {!this.state.budget ? ' Budget' : ' Gewoon'}</button>
          })
        }
      })
  }

  renderMissedPointsAll() {
    document.title = "Gemiste Punten Iedereen";
    axios.post('/api/missedpointsall', {token: localStorage.getItem('authToken'), race_id: 5, budgetparticipation:this.state.budget})
      .then((res) => {
        if (res) {
          var extraTables = []
          for(var i in res.data.users){
              extraTables.push(<div className="tableDiv" ><Table data={res.data.users[i].tableData} title={res.data.users[i].title}/></div>)
          }
          this.setState({
            extraTables: extraTables,
            switchButton: <button onClick={this.budgetSwitch}>Switch naar {!this.state.budget ? ' Budget' : ' Gewoon'}</button>
          })
        }
      })
  }

  renderTeam(){
    document.title = "Team Overzicht";
    axios.post('/api/teamoverzicht', {token: localStorage.getItem('authToken'), race_id: 5, budgetparticipation:this.state.budget})
      .then((res) => {
        if (res) {
          this.setState({
            data: res.data.tableData,
            tableName: res.data.title,
            coltype: res.data.coltype,
            switchButton: <button onClick={this.budgetSwitch}>Switch naar {!this.state.budget ? ' Budget' : ' Gewoon'}</button>
          })
        }
      })
  }

  renderTeamAll() {
    document.title = "Team Overzicht Iedereen";
    axios.post('/api/teamoverzichtall', {token: localStorage.getItem('authToken'), race_id: 5, budgetparticipation:this.state.budget})
      .then((res) => {
        if (res) {
          console.log(res.data)
          var extraTables = []
          for(var i in res.data.users){
              extraTables.push(<div className="tableDiv" ><Table data={res.data.users[i].tableData} title={res.data.users[i].title} coltype={res.data.users[i].coltype}/></div>)
          }
          this.setState({
            extraTables: extraTables,
            switchButton: <button onClick={this.budgetSwitch}>Switch naar {!this.state.budget ? ' Budget' : ' Gewoon'}</button>
          })
        }
      })
  }

  renderEtappeWinsten(){//werkt nog niet vorm van table klopt niet
    document.title = "Etappe Winsten Overzicht";
      axios.post('/api/getstagevictories', { race_id: 5, poule_id: 0, token: localStorage.getItem('authToken'),budgetparticipation: this.state.budget})
      .then((res) => {
        if (res) {
          var extraTables = [];
          extraTables.push(<div className="tableDiv" ><Table data={res.data.rankTable} title={"Etappe Uitslagen"}/></div>)
          extraTables.push(<div className="tableDiv" ><Table data={res.data.countTable} title={"Hoe vaak welke positie"}/></div>)
          console.log(res.data)
          this.setState({
            extraTables: extraTables,
            switchButton: <button onClick={this.budgetSwitch}>Switch naar {!this.state.budget ? ' Budget' : ' Gewoon'}</button>
          })
        }
      })
  }


  render() {
    console.log(this.state)
    return (
      <div className="overzichtContainer">
        {this.state.switchButton}
        <Table data={this.state.data} coltype={this.state.coltype} title={this.state.tableName} />
        {this.state.extraTables}
      </div>

    )
  }

}

export default overzicht