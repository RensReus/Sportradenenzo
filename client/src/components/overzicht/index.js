import React, { Component } from 'react';
import './index.css';
import axios from 'axios';
import Table from '../shared/table'
import BudgetSwitchButton from '../shared/budgetSwitchButton';

class overzicht extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      extraTables: '',
      budget: false,
      budgetSwitchButton: '',
      currlink: '',
    });
    this.budgetSwitch = this.budgetSwitch.bind(this);
  }

  componentDidMount() {
    this.stateUpdateAndRender()
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.stateUpdateAndRender()
    }
  }

  stateUpdateAndRender() {
    if (this.props.match.params.selection !== this.state.currlink) {
      if (this.props.match.params.racename && this.props.match.params.year) {
        this.setState({
          race: this.props.match.params.racename,
          year: this.props.match.params.year,
          oldracelink: '/' + this.props.match.params.racename + '-' + this.props.match.params.year,
          budget: false,
          budgetSwitchButton: '',
        }, () => {
          this.renderPage()
        })
      } else if(this.props.racename){ //if racename not ''  {
          this.setState({
              racename: this.props.racename,
              year: this.props.year,
              budget: false,
              budgetSwitchButton: '',
          },()=>{
              this.renderPage()
          })
      }
    }
  }

  renderPage() {
    var titles = {
      "all":"Alle Renners Overzicht",
      "selected":"Gekozen Renners Overzicht",
      "missedpoints":"Gemiste Punten",
      "missedpointsall":"Gemiste Punten Iedereen",
      "team":"Team Overzicht",
      "teamall":"Team Overzicht Iedereen",
      "teamallsimple":"Team Overzicht Iedereen",
      "etappewinsten":"Etappe Winsten Overzicht",
      "rondewinsten":"Ronde Winsten Overzicht",
      "teamcomparisons":"Vergelijking van Selecties",
      "overigestats":"Overige Statistieken",
    }
    var apilinks = {
      "all":"getriderpointsall",
      "selected":"getriderpointsselected",
      "missedpoints":"missedpoints",
      "missedpointsall":"missedpointsall",
      "team":"teamoverzicht",
      "teamall":"teamoverzichtall",
      "teamallsimple":"teamoverzichtallsimple",
      "etappewinsten":"getstagevictories",
      "rondewinsten":"gettourvictories",
      "teamcomparisons":"teamcomparisons",
      "overigestats":"getadditionalstats",
    }
    this.setState({
      currlink: this.props.match.params.selection,
      extraTables: '',
    }, () => {
      var pageref = this.state.currlink;
      switch (pageref) {
        case "all":
        case "selected": 
        case "missedpoints": 
        case "missedpointsall": 
        case "team": 
        case "teamall": 
        case "teamallsimple": 
        case "etappewinsten": 
        case "rondewinsten": 
        case "overigestats": 
        case "teamcomparisons": 
          this.getDataAndRender(apilinks[pageref],titles[pageref])
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

   getDataAndRender(apiLink,title) {
    document.title = title;
      axios.post('/api/'+apiLink, { token: localStorage.getItem('authToken'), racename:this.state.racename, year:this.state.year, budgetparticipation: this.state.budget })
        .then((res) => {
          if (res) {
            console.log(res)
            var extraTables = []
            for (var i in res.data.tables) {
              extraTables.push(<div className="tableDiv" ><Table data={res.data.tables[i].tableData} title={res.data.tables[i].title} coltype={res.data.tables[i].coltype} /></div>)
            }
            this.setState({
              extraTables: extraTables,
              budgetSwitchButton: <BudgetSwitchButton budget={this.state.budget} budgetSwitch={this.budgetSwitch} />
            })
          }
        })
    }

  render() {
    return (
      <div className="overzichtContainer">
        {this.state.budgetSwitchButton}
        {this.state.extraTables}
      </div>

    )
  }

}

export default overzicht