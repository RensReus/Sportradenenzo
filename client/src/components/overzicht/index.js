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
              extraTables.push(<Table data={res.data.users[i].tableData} title={res.data.users[i].title}/>)
          }
          this.setState({
            extraTables: extraTables,
            switchButton: <button onClick={this.budgetSwitch}>Switch naar {!this.state.budget ? ' Budget' : ' Gewoon'}</button>
          })
        }
      })
  }

  render() {
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