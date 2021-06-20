import { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Riderselectiontable from './riderSelectionTable'
import SelectedRidersTable from './selectedRidersTable'
import axios from 'axios';
import './index.css';
import _ from "lodash"
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { connect } from 'react-redux'

class Teamselection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      allRiders: [],
      filteredRiders: [],
      userSelection: [[], []],
      budgetLeft: [0, 0],
      minPrice: 500000,
      maxPrice: 7000000,
      joinButton: ' ',
      filtervalue: '',
      skillFilter: '',
    }
  }

  componentDidMount() {
    this.initialRender()
  }

  initialRender = () => {
    const race_id = this.props.race_id;
    if (sessionStorage.getItem('currentStageLink') === '/teamselection' && race_id !== null) {
      document.title = "Team Keuze " + this.props.racename.charAt(0).toUpperCase() + this.props.racename.slice(1);
      axios.post('/api/teamselection', { apilink: 'getridersandteam', race_id })
        .then((res) => {
          if (res.data.noParticipation) {
            this.setState({
              joinButton: <button className={"button_standard blue joinRace " + this.props.racename} onClick={() => this.joinRace()}>Klik hier om mee te doen aan de {this.props.racename.charAt(0).toUpperCase() + this.props.racename.slice(1)}</button>
            })
          } else {
            this.setState({
              joinButton: '',
              allRiders: res.data.allRiders,
              filteredRiders: res.data.allRiders,
              userSelection: [res.data.userSelectionGewoon, res.data.userSelectionBudget],
              budgetLeft: [res.data.budgetGewoon, res.data.budgetBudget],
            })
            this.getRemainingBudget();
          }
        })
    } else {
      this.redirect('/home')
    }
  }

  getRemainingBudget = () => {
    let totalGewoon = 0;
    let totalBudget = 0;
    this.state.userSelection[0].forEach((rider) => {
      totalGewoon += rider.price;
    });
    this.state.userSelection[1].forEach((rider) => {
      totalBudget += rider.price;
    });
    this.setState({
      budgetLeft: [this.state.budgetLeft[0] - totalGewoon, this.state.budgetLeft[1] - totalBudget]
    })
  }

  joinRace() {
    axios.post('/api/teamselection', { apilink: 'addaccountparticipation', race_id: this.props.race_id })
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

  updatePage = (data, showBudget) => {
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

  handleChangeMinPrice = (e) => {
    this.setState({ minPrice: e.target.value }, () => {
      this.filter({ target: { value: this.state.filtervalue } })
    });
  }

  handleChangeMaxPrice = (e) => {
    this.setState({ maxPrice: e.target.value }, () => {
      this.filter({ target: { value: this.state.filtervalue } })
    });
  }

  handleChangeSkill = (e) => {
    this.setState({ skillFilter: e.target.value }, () => {
      this.filter({ target: { value: this.state.filtervalue } })
    });
  }

  redirect = (url) => {
    this.props.history.push(url);
  }

  filter = (e) => {
    this.setState({ filtervalue: e.target.value }, () => {
      var regex = new RegExp("\\w*" + this.state.filtervalue + "\\w*", 'i')
      var filteredRiders = [];
      var allRiders = this.state.allRiders;
      for (var i in allRiders) {
        if (
          (allRiders[i].name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(regex)
            || allRiders[i].team.match(regex))
          && (!this.props.budget ? 1 : 0 || allRiders[i].price <= 750000)
          && allRiders[i].price >= this.state.minPrice
          && allRiders[i].price <= this.state.maxPrice
          && this.filterSkills({
            'GC': allRiders[i].gc,
            'Climb': allRiders[i].climb,
            'Sprint': allRiders[i].sprint,
            'Punch': allRiders[i].punch,
            'Time Trial': allRiders[i].tt
          })
        ) {
          filteredRiders.push(allRiders[i])
        }
      }
      this.setState({ filteredRiders })
    })
  }

  filterSkills(specialty) {
    for (const [key, value] of Object.entries(specialty)) {
      if (key == this.state.skillFilter) {
        return value != 0;
      }
    }
    return true;
  }

  render() {
    const allRiders = this.state.filteredRiders
    const userSelection = this.state.userSelection[this.props.budget ? 1 : 0]
    const budgetLeft = this.state.budgetLeft[this.props.budget ? 1 : 0]
    let minPriceDropdown = [];
    let maxPriceDropdown = [];
    const priceArray = [50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700]
    priceArray.forEach(price => {
      if (price * 10000 <= this.state.maxPrice) {
        minPriceDropdown.push(<option value={price * 10000} key={'min' + price} className='minimalistic-dropdown-option'>{(price * 10000).toLocaleString('nl', { useGrouping: true })}</option>);
      }
      if (price * 10000 >= this.state.minPrice) {
        maxPriceDropdown.push(<option value={price * 10000} key={'max' + price} className='minimalistic-dropdown-option'>{(price * 10000).toLocaleString('nl', { useGrouping: true })}</option>);
      }
    });
    let skillsDropdown = []
    const skillName = ['Nothing', 'General Classification', 'Climbing', 'Sprinting', 'Punching', 'Time Trialing'];
    const skillCode = ['', 'GC', 'Climb', 'Sprint', 'Punch', 'Time Trial'];
    for (var i = 0; i < skillName.length; i++) {
      skillsDropdown.push(<option value={skillCode[i]} key={skillCode[i]} className='minimalistic-dropdown-option'>{skillName[i]}</option>);
    }
    return (
      <div>
        {this.state.joinButton === '' &&
          <div className="">
            <div className="w-full flex">

              <div className="w-1/2 p-4">
                <div className="text-lg">The rider I'm looking for...</div>
                <div className="pt-2 text-lg">...must be good at
                  <select
                    className='minimalistic-dropdown'
                    value={this.state.skillFilter}
                    name="skillFilter"
                    onChange={this.handleChangeSkill}>
                    {skillsDropdown}
                  </select>
                </div>
                <div className="pt-2 text-lg">...must be priced between
                  <select
                    className='minimalistic-dropdown'
                    value={this.state.minPrice}
                    name="minPrice"
                    onChange={this.handleChangeMinPrice}>
                    {minPriceDropdown}
                  </select>
                  and
                  <select
                    className='minimalistic-dropdown'
                    value={this.state.maxPrice}
                    name="maxPrice"
                    onChange={this.handleChangeMaxPrice}>
                    {maxPriceDropdown}
                  </select>
                </div>
                <div className="pt-2 text-lg">...must have a (team)name like
                  <input type="text" className="h-8 w-64 py-4 px-2 ml-2 text-base border-solid border-2 border-gray-200 rounded-md" placeholder="search..." value={this.state.filtervalue} onChange={(e) => { this.filter(e) }} />
                </div>
              </div>
              <div className="w-1/2 flex items-center flex-wrap mb-6 p-4">
                <div className="w-1/2">
                  <span>Budget: {budgetLeft.toLocaleString('nl', { useGrouping: true })}</span>
                </div>
                <div className="w-1/2 flex justify-end items-center space-x-14">
                  {userSelection.length == 20 ?
                    <button className="button_standard blue" onClick={() => this.redirect('/stage/1')}>To stages <FontAwesomeIcon icon={faAngleRight} /></button>
                    :
                    <button className="button_standard gray disabled">To stages <FontAwesomeIcon icon={faAngleRight} /></button>
                  }
                </div>
              </div>
            </div>
            <div className="teamselection-tables w-full flex">
              <div className="ridertablecontainer w-1/2">
                <Riderselectiontable
                  riders={allRiders}
                  selectionIDs={userSelection.map(rider => rider.rider_participation_id)}
                  selectionTeams={userSelection.map(rider => rider.team)} budget={budgetLeft}
                  skillFilter={this.state.skillFilter}
                  addRemoveRider={this.addRemoveRider}
                  budgetParticipation={this.props.budget ? 1 : 0}
                />
              </div>
              <div className="usertablecontainer w-1/2">
                <div className="w-5/6 ml-auto">
                  <SelectedRidersTable selection={userSelection} addRemoveRider={this.addRemoveRider} budgetParticipation={this.props.budget ? 1 : 0} />
                </div>
              </div>
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

const mapStateToProps = state => {
  return { budget: state.budgetSwitch.value };
};

export default connect(mapStateToProps)(Teamselection);