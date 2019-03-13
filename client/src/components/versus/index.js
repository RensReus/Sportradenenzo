import React, { Component } from 'react';
// import './index.css';
import axios from 'axios';





class versus extends Component {
  constructor(props) {
    super(props);
    this.state = {
        versus_id: this.props.match.params.chartname,
        teamselections: []
    };
  }

  componentWillMount() {
    axios.post('/api/versus', { race_id: 4, versus_id: this.state.versus_id })
      .then((res) => {
        if (res) {
          this.setState({
            teamselections: res.data.teamselections
          })
        }
      })
  }


  

  render() {
    return (
      <div className="mainContainer">
        <div className="selectionContainer">Etappe Uitslagen</div>
      </div>

    )
  }

}

export default versus