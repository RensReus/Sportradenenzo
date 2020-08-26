import React, { Component } from 'react';
import './index.css';
import axios from 'axios';
import Table from '../shared/table'
import BudgetSwitchButton from '../shared/budgetSwitchButton';

class overzicht extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      tables: '',
      budget: false,
      budgetSwitchButton: '',
      currlink: '',
    });
    this.budgetSwitch = this.budgetSwitch.bind(this);
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
    if (this.props.match.params.selection !== this.state.currlink) {
      if (this.props.match.params.racename && this.props.match.params.year) {
        this.setState({
          racename: this.props.match.params.racename,
          year: this.props.match.params.year,
          oldracelink: '/' + this.props.match.params.racename + '-' + this.props.match.params.year,
          budget: false,
          budgetSwitchButton: '',
        }, () => {
          this.props.setRace(this.state.racename)
          this.renderPage()
        })
      } else if (this.props.racename) { //if racename not ''  {
        this.setState({
          racename: this.props.racename,
          year: this.props.year,
          budget: false,
          budgetSwitchButton: '',
        }, () => {
          this.renderPage()
        })
      }
    }
  }

  renderPage() {
    var apilinks = {
      "all": "getriderpointsall",
      "selected": "getriderpointsselected",
      "missedpoints": "missedpoints",
      "missedpointsall": "missedpointsall",
      "team": "teamoverzicht",
      "teamall": "teamoverzichtall",
      "teamallsimple": "teamoverzichtallsimple",
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
        this.getDataAndRender(apilinks[pageref],true)
        break;        
        case "all":
        case "selected":
        case "missedpoints":
        case "missedpointsall":
        case "team":
        case "teamall":
        case "teamallsimple":
        case "etappewinsten":
        case "overigestats":
        case "teamcomparisons":
          this.getDataAndRender(apilinks[pageref],false)
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
    axios.post('/api/statistics', { selection, alwaysget, racename: this.state.racename, year: this.state.year, budgetparticipation: this.state.budget })
      .then((res) => {
        if (res.data.mode !== '404') {
          document.title = res.data.title;
          var tables = []
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

  render() {
    return (
      <div className="overzichtContainer">
        {this.state.budgetSwitchButton}
        {this.state.tables}
      </div>

    )
  }

}

export default overzicht