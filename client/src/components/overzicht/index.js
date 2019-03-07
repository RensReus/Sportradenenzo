import React, { Component } from 'react';
import './index.css';
import axios from 'axios';

class ScoreTable extends Component{
  render(){
      const output = this.props.overzicht
      const teamselection = this.props.teamselection2.map(rider => rider.rider_participation_id);
      const header = []
      var row = []
      const rows = []
      if(output.length>0){
          const properties = Object.keys(output[0])
          properties.forEach(function(property){
            if(property !== 'rider_participation_id'){
              header.push(<th>{property}</th>)
            }
          })
          for(var i=0;i<output.length;i++){
              for (var property in output[i]) {
                  if(property !== 'rider_participation_id'){
                    row.push(<td>{output[i][property]}</td>);
                  }
              }
              if(teamselection.includes(output[i]["rider_participation_id"])){
                rows.push(<tr className="inteam">{row}</tr>)
              }else{
                rows.push(<tr>{row}</tr>)
              }


              row = []
          }
      }
      return(
          <table className="ScoreTable">
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



class overzicht extends Component {
  constructor(props) {
    super(props);
    this.state = ({overzicht: [], teamselection: []});
  }

  componentWillMount() {
    axios.post('/api/getallriderpoints', { race_id: 4, poule_id: 0 })
      .then((res) => {
        if (res) {
          this.setState({
            overzicht:  res.data.overzicht,
            teamselection: res.data.teamselection
          })
        }
      })
  }


  

  render() {
    return (
      <div className="overzichtContainer">
        <div>Etappe Uitslagen</div>
        <ScoreTable overzicht={this.state.overzicht} teamselection2={this.state.teamselection} />
      </div>

    )
  }

}

export default overzicht