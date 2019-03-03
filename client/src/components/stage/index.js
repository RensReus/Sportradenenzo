import React, { Component } from 'react';
import axios from 'axios';
import './index.css';

class Stage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            mode: '', 
            race: 'classics',
            year: '2019'
        }
    }
   
    componentWillMount() {
        const race = this.state.race
        const year = this.state.year
        axios.post('', { race: race, year: year }) //to: teamselection.js
            .then((res) => {
                this.setState({
                })
            })
    }

    render() {
        return (
            <div className="stageContainer">

            </div>
        )
    }
}

export default Stage