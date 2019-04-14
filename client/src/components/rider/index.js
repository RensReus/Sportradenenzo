import React, { Component } from 'react';
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
    var data = this.state.data;
    var coltype = this.state.coltype;
    if (!data.length) {//een hele nare hack voor een error waar ik niks van snap
      data = this.props.overzicht;
      coltype = this.props.coltype
    }
    const header = []
    var row = []
    const rows = []
    if (data.length > 0) {
      const properties = Object.keys(data[0])
      properties.forEach(function(property) {
        if (property !== 'rider_participation_id') {
          if(coltype[property] != null){
            header.push(<th className="sortable" onClick={() => { this.onSort(property) }}>{property}</th>)
          }else{
            header.push(<th>{property}</th>)
          }
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



class Rider extends Component {
  constructor(props) {
    super(props);
    this.state = ({ overzicht: [],
    tableName: '' });
  }


  componentWillMount() {
    console.log(this.props)
    axios.post('/api/getriderresults', { rider_participation_id: this.props.match.params.rider_participation_id })
      .then((res) => {
        if (res) {
          this.setState({
            overzicht: res.data.overzicht,
            coltype: res.data.coltype,
            tableName: res.data.tableName
          })
        }
      })
  }

  render() {
    return (
      <div className="overzichtContainer">
        <div>{this.state.tableName}</div>
        <ScoreTable overzicht={this.state.overzicht} coltype={this.state.coltype}  />
      </div>

    )
  }

}

export default Rider