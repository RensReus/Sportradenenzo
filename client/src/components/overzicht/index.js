import React, { Component } from 'react';
import './index.css';
import axios from 'axios';

class ScoreTable extends Component {
  constructor(props) {
    super(props);
    this.state = ({ data: [],
          desc:[],
          coltype:[] });
    this.onSort = this.onSort.bind(this);
  }

  onSort(sortKey) {
    var data = this.state.data;
    var coltype = this.state.coltype;
    var desc = this.state.desc;
    if (!data.length) {//een hele nare hack voor een error waar ik niks van snap
      data = this.props.overzicht;
      coltype = JSON.parse(JSON.stringify(this.props.coltype));// nog een nare hack voor een probleem dat ik wel snap soort van
      desc = JSON.parse(JSON.stringify(this.props.coltype));
      this.setState({coltype:coltype})
    }

    if(coltype[sortKey] && desc[sortKey]){// number & desc
      data.sort((a, b) => parseFloat(a[sortKey]) < parseFloat(b[sortKey]))
    }
    if(coltype[sortKey] && !desc[sortKey]){// number & asc
      data.sort((b, a) => parseFloat(a[sortKey]) < parseFloat(b[sortKey]))
    }
    if(!coltype[sortKey] && desc[sortKey]){// string & desc
      data.sort((b,a) => a[sortKey].localeCompare(b[sortKey]))
    }
    if(!coltype[sortKey] && !desc[sortKey]){// string & asc
      data.sort((a, b) => a[sortKey].localeCompare(b[sortKey]))
    }
    desc[sortKey] = !desc[sortKey];

    this.setState({ data:data,
        desc:desc })
    }
    

  getDerivedStateFromProps () {
    this.setState({ 
      data: this.props.overzicht,
      desc: this.props.coltype,// string default asc numbers default desc
      coltype: this.props.coltype
     })
  }

  render() {
    var data = this.state.data
    if (!data.length) {//een hele nare hack voor een error waar ik niks van snap
      data = this.props.overzicht
    }
    const header = []
    var row = []
    const rows = []
    if (data.length > 0) {
      const properties = Object.keys(data[0])
      properties.forEach(function(property) {
        if (property !== 'rider_participation_id') {
          header.push(<th className="sortable" onClick={() => { this.onSort(property) }}>{property}</th>)
        }
      },this)
      for (var i = 0; i < data.length; i++) {
        for (var property in data[i]) {
          if (property !== 'rider_participation_id') {
            row.push(<td>{data[i][property]}</td>);
          }
        }
        rows.push(<tr>{row}</tr>)


        row = []
      }
    }
    return (
      <table className="ScoreTable">
        <thead>
          <tr>
            {header}
          </tr>
        </thead>
        <tbody className="ScoreTable">
          {rows}
        </tbody>
      </table>
    )
  }
}



class overzicht extends Component {
  constructor(props) {
    super(props);
    this.state = ({ overzicht: [] });
  }

  componentWillMount() {
    switch (this.props.match.params.selection) {
      case "all": this.renderAll(); break;
      case "selected": this.renderSelected(); break;
      default: this.renderAll(); break;
    }

  }

  renderAll() {
    axios.post('/api/getriderpointsall', { race_id: 4, poule_id: 0 })
      .then((res) => {
        if (res) {
          this.setState({
            overzicht: res.data.overzicht,
            coltype: res.data.coltype
          })
        }
      })
  }

  renderSelected() {
    console.log('getriderpointsselected')
    axios.post('/api/getriderpointsselected', { race_id: 4, poule_id: 0 })
      .then((res) => {
        if (res) {
          this.setState({
            overzicht: res.data.overzicht,
            coltype: res.data.coltype
          })
        }
      })
  }

  render() {
    console.log("parent", this.state.overzicht.length)
    var time = new Date().getMilliseconds();
    return (
      <div className="overzichtContainer">
        <div>Alle Renners{time}</div>
        <ScoreTable overzicht={this.state.overzicht} coltype={this.state.coltype}  />
      </div>

    )
  }

}

export default overzicht