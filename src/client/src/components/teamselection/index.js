import React, { Component } from 'react';
import Riderselectiontable from './riderselectiontable'
import Userselectiontable from './userselectiontable'
import axios from 'axios';
import './index.css';
import BudgetSwitchButton from '../shared/budgetSwitchButton';
import _ from "lodash"

class Teamselection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      allRiders: [],
      filteredRiders: [],
      userSelection: [[], []],
      budgetLeft: [0, 0],
      joinButton: ' ',
      filtervalue: '',
      showBudget: 0
    }
    this.addRemoveRider = this.addRemoveRider.bind(this);
    this.updatePage = this.updatePage.bind(this);
    this.budgetSwitch = this.budgetSwitch.bind(this);
    this.initialRender = this.initialRender.bind(this);
    this.filter = this.filter.bind(this);
  }

  componentDidMount() {
    this.setState({
      racename: this.props.racename,
      race_id: this.props.race_id
    }, () => {
      this.initialRender()
    })
  }

  initialRender() {
    const race_id = this.state.race_id;
    document.title = "Team Keuze " + this.state.racename.charAt(0).toUpperCase() + this.state.racename.slice(1);
    if (sessionStorage.getItem('currentStageLink') === '/teamselection') {
      axios.post('/api/teamselection', { apilink: 'getridersandteam', race_id })
        .then((res) => {
          if (res.data.noParticipation) {
            this.setState({
              joinButton: <button className={"buttonStandard joinRace " + this.state.racename} onClick={() => this.joinRace()}>Klik hier om mee te doen aan de {this.state.racename.charAt(0).toUpperCase() + this.state.racename.slice(1)}</button>
            })
          } else {
            this.setState({
              joinButton: '',
              allRiders: res.data.allRiders,
              filteredRiders: res.data.allRiders,
              userSelection: [res.data.userSelectionGewoon, res.data.userSelectionBudget],
              budgetLeft: [res.data.budgetGewoon, res.data.budgetBudget],
            })
          }
        })
    } else {
      this.redirect(this.props.redirect)
    }
  }



  joinRace() {
    axios.post('/api/teamselection', { apilink: 'addaccountparticipation', race_id: this.state.race_id })
      .then((res) => {
        if (res) {
          if (res.data.participationAdded) {
            this.setState({
              joinButton: ''
            }, () => {
              this.initialRender();
            })
          }
        }
      })
  }


  addRemoveRider = (addRemove, riderID, budgetParticipation) => {
    axios.post('/api/teamselection', { apilink: addRemove, race_id: this.props.race_id, rider_participation_id: riderID, budgetParticipation })
      .then((res) => {
        if (res) {
          this.updatePage(res.data, budgetParticipation);
        }
      })
  }

  updatePage(data, showBudget) {
    if (data) {
      let userSelection = _.cloneDeep(this.state.userSelection)
      userSelection[showBudget] = data.userSelection;
      let budgetLeft = _.cloneDeep(this.state.budgetLeft)
      budgetLeft[showBudget] = data.budgetLeft;
      this.setState({
        userSelection,
        budgetLeft
      })
    }
  }

  budgetSwitch() {
    this.setState({ showBudget: (this.state.showBudget - 1) * -1 }, () => {
      this.filter({ target: { value: this.state.filtervalue } })
    })
  }

  redirect = (url) => {
    this.props.history.push(url);
  }

  filter(e) {
    this.setState({ filtervalue: e.target.value }, () => {
      var regex = new RegExp("\\w*" + this.state.filtervalue + "\\w*", 'i')
      var filteredRiders = [];
      var allRiders = this.state.allRiders;
      for (var i in allRiders) {
        if ((allRiders[i].name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(regex) || allRiders[i].team.match(regex)) && (!this.state.showBudget || allRiders[i].price <= 750000)) {
          filteredRiders.push(allRiders[i])
        }
      }
      this.setState({ filteredRiders })
    })
  }

  render() {
    const allRiders = this.state.filteredRiders
    const userSelection = this.state.userSelection[this.state.showBudget]
    const budgetLeft = this.state.budgetLeft[this.state.showBudget]
    return (
      <div>
        {this.state.joinButton === '' &&
          <div className="containerTeamselection">
            <div className="switchAndSearch">
              <BudgetSwitchButton budget={this.state.showBudget} budgetSwitch={this.budgetSwitch} />
              Search for a rider: <textarea className="filterField" value={this.state.filtervalue} onChange={(e) => { this.filter(e) }} />
            </div>

            <div className="ridertablecontainer">
              <div className="teamindicator">
                Team Selectie
                    </div>
              <Riderselectiontable riders={allRiders} selectionIDs={userSelection.map(rider => rider.rider_participation_id)} selectionTeams={userSelection.map(rider => rider.team)} budget={budgetLeft} addRemoveRider={this.addRemoveRider} budgetParticipation={this.state.showBudget} />
            </div>
            <div className="usertablecontainer">
              <div className="budget">
                Budget over: {budgetLeft.toLocaleString('nl', { useGrouping: true })} Renners {userSelection.length}/20
                    </div>
              <Userselectiontable selection={userSelection} addRemoveRider={this.addRemoveRider} budgetParticipation={this.state.showBudget} />
            </div>
            <div id="stage1button">
              <button onClick={() => this.redirect('/stage/1')}>To stages </button>
            </div>
          </div>
        }
        <div className="containerTeamselection">
          {this.state.joinButton}
        </div>
      </div>
    )
  }
}

export default Teamselection