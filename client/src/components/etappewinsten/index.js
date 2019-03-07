import React, { Component } from 'react';
import './index.css';
import axios from 'axios';

class EtappeRankingsTable extends Component{
  render(){
      const output = this.props.stagerankings
      const header = []
      var row = []
      const rows = []
      if(output.length>0){
          const properties = Object.keys(output[0])
          properties.forEach(function(property){
              header.push(<th>{property}</th>)
          })
          for(var i=0;i<output.length;i++){
              for (var property in output[i]) {
                  row.push(<td>{output[i][property]}</td>);
              }
              rows.push(<tr>{row}</tr>)
              row = []
          }
      }
      return(
          <table className="winnaarsTable">
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

class EtappeRankingsTableTotal extends Component{
  render(){
      const output = this.props.rankingscount
      const header = []
      var row = []
      const rows = []
      if(output.length>0){
          const properties = Object.keys(output[0])
          properties.forEach(function(property){
              header.push(<th>{property}</th>)
          })
          for(var i=0;i<output.length;i++){
              for (var property in output[i]) {
                  row.push(<td>{output[i][property]}</td>);
              }
              rows.push(<tr>{row}</tr>)
              row = []
          }
      }
      return(
          <table className="winnaarsTable">
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
    this.state = ({stagerankings: [],rankingscount: []});
  }

  componentWillMount() {
    axios.post('/api/getstagevictories', { race_id: 4, poule_id: 0 })
      .then((res) => {
        if (res) {
          console.log("DATA",res.data);
          this.setState({
            stagerankings:  res.data.stagerankings,
            rankingscount:  res.data.rankingscount
          })
          console.log("STATE:",this.state)
        }
      })
  }

  render() {
    return (
      <div className="etappewinstenContainer">
        <div>Etappe Uitslagen</div>
      <EtappeRankingsTable stagerankings={this.state.stagerankings} />
      <div>Hoe vaak welke positie</div>
      <EtappeRankingsTableTotal rankingscount={this.state.rankingscount} />
      </div>

    )
  }

}

export default etappewinsten