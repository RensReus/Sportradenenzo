import React, { Component } from 'react';
import RiderForm from './riderform'
import Userselectiontable from './userselectiontable'
import axios from 'axios';
import './index.css';

class Finances extends Component {
    render() {
        return (
            <table className='finances'>
                <thead>
                    <tr><td>Finances</td><td></td></tr>
                </thead>
                <tbody>
                    <tr><td>Budget</td><td>: €{this.props.budget}</td></tr>
                    <tr><td>Riders to pick</td><td>: {20 - this.props.teamsize}</td></tr>
                    <tr><td>Average</td><td>: €{this.props.budget / (20 - this.props.teamsize)}</td></tr>
                </tbody>
            </table>
        )
    }
}
class Ridercard extends Component {
    render() {
        return (
            <div className='ridercard'>
                <img src={this.props.rider.imageURL} className='riderImage' alt='riderimage'></img>
                <select className="riderPrice" onChange={this.props.changePrice}>
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
                    <li>Name: {this.props.rider.firstName} {this.props.rider.lastName}</li>
                    <li>Age: {this.props.rider.age}</li>
                    <li>Team: {this.props.rider.team}</li>
                    <li>Country: {this.props.rider.countryFullname}</li>
                </ul>
                <button className={this.props.buttonClass} onClick={this.props.selectRider}>{this.props.buttonText}</button>
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
                firstName: '',
                lastName: '',
                team: '',
                age: '',
                country: '',
                imageURL: '/images/blankProfilePicture.png',
                pcsid: '',
                countryFullname: '',
            },
            price: 500000,
            buttonClass: 'riderSelectButton',
            buttonText: 'Nothing to add',
            errorClass: '',
            errorText: ''
        }
        this.fetchRider = this.fetchRider.bind(this);
        this.selectRider = this.selectRider.bind(this);
        this.removeRider = this.removeRider.bind(this);
        this.changePrice = this.changePrice.bind(this);
    }
    fetchRider = (e) => {
        e.preventDefault();
        const pcsid = e.target.pcsid.value.split('/').pop(); //Interpreteer de aanwezigheid van / als een link en pak het laatste stukje
        this.setState({ buttonClass: 'riderSelectButton', buttonText: 'Fetching..' })
        axios.post('/api/getrider', { pcsid: pcsid })
            .then((res) => { //Returned false als niks gevonden
                if (res.data === false) {
                    this.setState({ 
                        errorClass: 'errorDiv', 
                        errorText: 'Rider could not be found', 
                        buttonText: 'Nothing to add'
                    })
                } else {
                    console.log(res.data.rider)
                    this.setState({ 
                        rider: res.data.rider, 
                        buttonClass: 'riderSelectButton active',
                        buttonText: 'Add rider to team',
                        errorClass: '', 
                        errorText: ''
                    });
                }
            });
    }
    selectRider() {
        const rider = this.state.rider;
        const race = this.state.race;
        const year = this.state.year;
        const price = this.state.price;
        const pcsid = this.state.pcsid;
        axios.post('/api/teamselectionaddclassics', { pcsid: pcsid, race: race, year: year, rider: rider, price: price })
            .then((res) => {
                if (res) {
                    const userSelection = this.state.userSelection.push(res.riderID)
                    this.setState({
                        userSelection: userSelection
                    })
                }
            })
    }
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
    changePrice(e) {
        this.setState({
            price : e.target.value
        })
    }

    render() {
        const selection = this.state.userSelection
        const budget = this.state.budget
        const teamsize = this.state.userSelection.length
        const buttonClass = this.state.buttonClass
        const buttonText = this.state.buttonText
        return (
            <div className="teamselectionContainer">
                <div className="riderformcontainer">
                    <RiderForm fetchRider={this.fetchRider} errorClass={this.state.errorClass} errorText={this.state.errorText}/>
                    <Ridercard 
                        rider={this.state.rider} 
                        selectRider={this.selectRider} 
                        buttonClass={buttonClass} 
                        buttonText={buttonText} 
                        changePrice={this.changePrice}
                    />
                    <Finances teamsize={teamsize} budget={budget} />
                </div>
                <div className="usertablecontainer">
                    <Userselectiontable selection={selection} removeRider={this.removeRider} />
                </div>
            </div>
        )
    }
}

export default Teamselection