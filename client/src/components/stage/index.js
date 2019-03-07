import React, { Component } from 'react';
import axios from 'axios';
import './index.css';

class ResultsTableRow extends Component{
    render(){
        return(
            <tr>
                <td>{this.props.firstname} {this.props.lastname}</td>
                <td>{this.props.team}</td>
                <td>{this.props.stagescore}</td>
                <td>{this.props.teamscore}</td>
                <td>{this.props.totalscore}</td>
            </tr>
        )
    }
}

class ResultsTable extends Component{
    render(){
        const rows = [];
        const userTeam = this.props.userTeamResult
        userTeam.forEach(rider => {
            rows.push(
                <ResultsTableRow
                    firstname={rider.firstname}
                    lastname={rider.lastname}
                    team={rider.team}
                    stagescore={rider.stagescore}
                    teamscore={rider.teamscore}
                    totalscore={rider.totalscore}
                />
            )
        });
        
        return(
            <table className="scoreTable">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Team</th>
                        <th>StageScore</th>
                        <th>TeamScore</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        )
    }
}

class Stage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            mode: '', 
            race: 'classics',
            year: '2019',
            stage: this.props.match.params.stagenumber, //Haal het nummer uit de link
            userTeamResult: []
        }
    }
   
    componentWillMount() {
        const stage = this.state.stage
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/getstageresultsclassics', { race: race, year: year, stageNumber: stage }) //to: stageresults.js
            .then((res) => {
                console.log(res.data)
                this.setState({
                    userTeamResult: res.data.teamresults
                })
            })
    }

    render() {
        return (
            <div className="standardContainer">
                <ResultsTable userTeamResult={this.state.userTeamResult}/>
            </div>
        )
    }
}

export default Stage