import React, { Component } from 'react';
import './index.css';
import axios from 'axios';

class ScoreTable extends Component{
  render(){
      const output = this.props.overzicht
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
                rows.push(<tr>{row}</tr>)


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
    this.state = ({overzicht: [], teamselection: []});
  }

  componentWillMount() {
    switch(this.props.match.params.selection){
      case "all": this.renderAll(); break;
      case "selected": this.renderSelected(); break;
      default: this.renderAll(); break;
    }
    
  }

  renderAll(){
    axios.post('/api/getriderpointsall', { race_id: 4, poule_id: 0 })
      .then((res) => {
        if (res) {
          this.setState({
            overzicht:  res.data.overzicht
          })
        }
      })
  }

  renderSelected(){
    console.log('getriderpointsselected')
    axios.post('/api/getriderpointsselected', { race_id: 4, poule_id: 0 })
      .then((res) => {
        if (res) {
          this.setState({
            overzicht:  res.data.overzicht
          })
        }
      })
  }

  render() {
    return (
      <div className="overzichtContainer">
        <div>Alle Renners</div>
        <ScoreTable overzicht={this.state.overzicht} />
      </div>

    )
  }

}

export default overzicht