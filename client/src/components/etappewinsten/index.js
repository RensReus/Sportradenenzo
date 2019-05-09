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

  componentWillMount() {
    axios.post('/api/getstagevictories', { race_id: 4, poule_id: 0 })
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