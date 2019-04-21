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
      tableName: ''
    });
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
            data: res.data.tableData,
            coltype: res.data.coltype,
            tableName: res.data.title
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

export default overzicht