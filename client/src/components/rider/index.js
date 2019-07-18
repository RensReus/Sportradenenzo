import React, { Component } from 'react';
import axios from 'axios';
import Table from '../shared/table'

class Rider extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      data: [],
      coltype: [],
      tableName: ''
    });
  }


  componentWillMount() {
    console.log(this.props)
    axios.post('/api/getriderresults', { rider_participation_id: this.props.match.params.rider_participation_id })
      .then((res) => {
        if (res) {
          document.title = res.data.title;
          this.setState({
            data: res.data.tableData,
            coltype: res.data.coltype,
            tableName: res.data.title
          })
        }
      })
  }

  render() {
    return (
      <div className="overzichtContainer">
        <Table data={this.state.data} coltype={this.state.coltype} title={this.state.tableName} />
      </div>

    )
  }

}

export default Rider