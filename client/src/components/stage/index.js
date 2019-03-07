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

class PouleTableRow extends Component{
    render(){
        return(
            <tr>
                <td>{this.props.username}</td>
                <td>{this.props.stagescore}</td>
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

class PouleTable extends Component{
    render(){
        const rows = [];
        const userScores = this.props.userScores
        userScores.forEach(user => {
            rows.push(
                <PouleTableRow
                    username={user.username}
                    stagescore={user.stagescore}
                    totalscore={user.totalscore}
                />
            )
        });
        
        return(
            <table className="pouleTable">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Stagescore</th>
                        <th>Totalscore</th>
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
            userTeamResult: [],
            userScores: []
        }
        this.previousStage = this.previousStage.bind(this);
        this.nextStage = this.nextStage.bind(this);
    }
    updateData(stage){
        const race = this.state.race
        const year = this.state.year
        console.log(stage)
        axios.post('/api/getstageresultsclassics', { race: race, year: year, stageNumber: stage }) //to: stageresults.js
            .then((res) => {
                if(res.data.mode==='404'){
                    this.setState({
                        mode: '404'
                    })
                }else{
                    this.setState({
                        mode:'',
                        userTeamResult: res.data.teamresult,
                        userScores: res.data.userscores
                    })
                }
            })
    }
    previousStage(){
        const currentstage = this.state.stage
        this.props.history.push('/stage/'+(parseInt(currentstage)-1).toString())
        this.setState({
            stage:(parseInt(currentstage)-1).toString()
        })
        this.updateData((parseInt(currentstage)-1).toString())
    }
    nextStage(){
        const currentstage = this.state.stage
        this.props.history.push('/stage/'+(parseInt(currentstage)+1).toString())
        this.setState({
            stage:(parseInt(currentstage)+1).toString()
        })
        this.updateData((parseInt(currentstage)+1).toString())
    }
    componentDidMount() {
        this.updateData(this.state.stage)
    }

    render() {
        const mode = this.state.mode
        let message
        let resTable
        let pTable
        if(mode === '404'){
            message=<h3>404: Data not found</h3>
            resTable=''
            pTable=''
        }else{
            message=<h3></h3>
            resTable=<ResultsTable userTeamResult={this.state.userTeamResult}/>
            pTable=<PouleTable userScores={this.state.userScores}/>
        }
        return (
            <div className="standardContainer">
                <button id="previousStageButton" onClick={this.previousStage}>Previous Stage</button>
                <button id="nextStageButton" onClick={this.nextStage}>Next Stage</button>
                {message}
                {resTable}
                {pTable}
            </div>
        )
    }
}

export default Stage