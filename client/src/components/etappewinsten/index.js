import React, { Component } from 'react';
import './index.css';
import axios from 'axios';

class Table extends Component{
  render(){
    const header = []
      const rows = []
      for (var i in this.props.data.header){
        header.push(<th>{this.props.data.header[i]}</th>)
      }
      for(i in this.props.data.rows){
        var row = []
        for(var j in this.props.data.rows[i]){
          row.push(<td>{this.props.data.rows[i][j]}</td>);
        }
        rows.push(<tr>{row}</tr>)
      }
      return(
          <table className="winnaarsTable">
              <caption>{this.props.title}</caption>
              <thead>
                  <tr>
                      {header}
                  </tr>
              </thead>
              <tbody>
                  {rows}
              </tbody>
          </table>
      )
  }
}




class etappewinsten extends Component {
  constructor(props) {
    super(props);
    this.state = ({rankTable: {},countTable: {}});
  }

  componentDidMount() {
    //TODO remove hard code race_id and write code that does a getrace 
    // of 1 centrale plek waar huidige race_id gedefinieerd is en alle oude paginas zijn op te vragen
    //dmv extra paramters eg. /etappewinsten vs /etappewinsten/race_id of /etappewinsten/racename/year
      document.title = "Etappe Winsten Overzicht";
      axios.post('/api/getstagevictories', { race_id: 5, poule_id: 0, token: localStorage.getItem('authToken'),budgetparticipation: false})
      .then((res) => {
        if (res) {
          this.setState({
            rankTable:  res.data.rankTable,
            countTable:  res.data.countTable
          })
        }
      })
  }

  render() {
    return (
      <div className="etappewinstenContainer">
      <Table data={this.state.rankTable} title="Etappe Uitslagen"/>
      <Table data={this.state.countTable} title="Hoe vaak welke positie"/>
      </div>

    )
  }

}

export default etappewinsten