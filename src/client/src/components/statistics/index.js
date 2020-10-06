import React, { Component } from 'react';
import './index.css';
import axios from 'axios';
import Table from '../shared/table'
import BudgetSwitchButton from '../shared/budgetSwitchButton';
import StateSwitchButton from '../shared/stateSwitchButton';

class statistics extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      tables: '',
      budget: false,
      budgetSwitchButton: '',
      currlink: '',
      details: false
    });
    this.budgetSwitch = this.budgetSwitch.bind(this);
    this.detailsSwitch = this.detailsSwitch.bind(this);
  }

  componentDidMount() {
    this.stateUpdateAndRender();
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.stateUpdateAndRender();
    }
  }

  stateUpdateAndRender() {
    if (this.props.race_id === undefined) {
      this.props.history.push('/home')
    } else {
      this.setState({
        race_id: this.props.race_id,
        budget: false,
        budgetSwitchButton: ''
      }, () => {
        this.renderPage()
      })
    }
  }

  renderPage() {
    var apilinks = {
      "allriders": "getriderpointsall",
      "selectedriders": "getriderpointsselected",
      "missedpoints": "missedpoints",
      "missedpointsall": "missedpointsall",
      "teams": "teams",
      "etappewinsten": "getstagevictories",
      "rondewinsten": "gettourvictories",
      "teamcomparisons": "teamcomparisons",
      "overigestats": "getadditionalstats",
    }
    this.setState({
      currlink: this.props.match.params.selection,
      tables: '',
    }, () => {
      var pageref = this.state.currlink;
      switch (pageref) {
        case "rondewinsten":
          this.getDataAndRender(apilinks[pageref], true)
          break;
        case "allriders":
        case "selectedriders":
        case "missedpoints":
        case "missedpointsall":
        case "teams":
        case "etappewinsten":
        case "overigestats":
        case "teamcomparisons":
          this.getDataAndRender(apilinks[pageref], false)
          break;
        default: this.props.history.push(this.props.redirect); break;
      }
    })
  }

  budgetSwitch() {
    this.setState({ budget: !this.state.budget }, () => {
      this.renderPage()
    })
  }

  getDataAndRender(selection, alwaysget) {
    axios.post('/api/statistics', { selection, alwaysget, race_id: this.state.race_id, budgetparticipation: this.state.budget, details: this.state.details })
      .then((res) => {
        if (res.data.mode !== '404') {
          document.title = res.data.title;
          var tables = []
          console.log(res)
          for (var i in res.data.tables) {
            tables.push(<div className="tableDiv" ><Table data={res.data.tables[i].tableData} title={res.data.tables[i].title} coltype={res.data.tables[i].coltype} /></div>)
          }
          this.setState({
            tables: tables,
            budgetSwitchButton: <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
          })
        } else {
          document.title = '404';
          this.setState({
            tables: [],
            budgetSwitchButton: ''
          })
        }
      })
  }

  detailsSwitch() {
    this.setState({
      details: !this.state.details
    }, () => {
      this.renderPage()
    })
  }

  render() {
    return (
      <div className="statisticsContainer">
        {this.state.budgetSwitchButton}
        {this.state.currlink === "teams" && this.state.tables.length > 0 && <StateSwitchButton stateStrings={['Simpel', 'Details']} stateVar={this.state.details} stateVarSwitch={this.detailsSwitch} />}
        {this.state.tables}
      </div>

    )
  }

}

export default statistics