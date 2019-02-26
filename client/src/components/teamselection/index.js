import React, { Component } from 'react';
import RiderForm from './riderform'
import Userselectiontable from './userselectiontable'
import axios from 'axios';
import './index.css';

class Ridercard extends Component {
    render() {
        return (
            <div className='ridercard'>
                <img src={this.props.rider.imageURL} className='riderImage'></img>
                <select className="riderPrice">
                    <option value="500000">500,000</option>
                    <option value="750000">750,000</option>
                    <option value="1000000">1,000,000</option>
                    <option value="1500000">1,500,000</option>
                    <option value="2000000">2,000,000</option>
                    <option value="2500000">2,500,000</option>
                    <option value="3000000">3,000,000</option>
                    <option value="3500000">3,500,000</option>
                    <option value="4000000">4,000,000</option>
                    <option value="4500000">4,500,000</option>
                    <option value="5000000">5,000,000</option>
                </select>
                <ul>
                    <li>Name: {this.props.rider.firstName[0]} {this.props.rider.lastName}</li>
                    <li>Age: {this.props.rider.age}</li>
                    <li>Team: {this.props.rider.team}</li>
                </ul>
            </div>
        )
    }
}
class Teamselection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userSelection: [],
            race: 'classics',
            year: '2019',
            budget: 0,
            rider: {
                firstName: [],
                lastName: '',
                team: '',
                age: '',
                imageURL: '/images/blankProfilePicture.png'
            }
        }
        this.fetchRider = this.fetchRider.bind(this);
        this.selectRider = this.selectRider.bind(this);
        this.removeRider = this.removeRider.bind(this);
    }
    fetchRider = (e) => {
        e.preventDefault();
        axios.post('/api/getrider', { pcsid: e.target.pcsid.value })
            .then((res) => {
                this.setState({ rider: res.data.rider })
            });
    }
    selectRider() { }
    removeRider() { }
    componentDidMount() {
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/getuserteam', { race: race, year: year }) //to: teamselection.js
            .then((res) => {
                this.setState({
                    riders: res.data.allRiders,
                    userSelection: res.data.userSelection,
                    budget: res.data.budget
                })
            })
    }

    render() {
        const selection = this.state.userSelection
        const budget = this.state.budget
        const teamsize = this.state.userSelection.length
        return (
            <div className="teamselectionContainer">
                <div className="riderformcontainer">
                    <RiderForm fetchRider={this.fetchRider} budget={budget} teamsize={teamsize}/>
                    <Ridercard rider={this.state.rider} />
                </div>
                <div className="usertablecontainer">
                    <Userselectiontable selection={selection} removeRider={this.removeRider} />
                </div>
            </div>
        )
    }
}

export default Teamselection