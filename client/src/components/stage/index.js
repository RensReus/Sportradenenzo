import React, { Component } from 'react';
import axios from 'axios';
import './index.css';
import Table from '../table'

class PouleTableRow extends Component {
    render() {
        return (
            <tr>
                <td className="pouleUser">
                    {this.props.username}
                    <div className="selectionInfo"><Table data={this.props.riders} title={"renners #: "+ this.props.riderCount} /></div>
                </td>
                <td>{this.props.stagescore}</td>
                <td>{this.props.totalscore}</td>
            </tr>
        )
    }
}


class PouleTable extends Component {
    render() {
        const rows = [];
        const userScores = this.props.userScores
        userScores.forEach(user => {
            var riders = []
            if (user.riderCount>0) riders = user.riders;
            rows.push(
                <PouleTableRow
                    username={user.username}
                    riderCount={user.riderCount}
                    riders={riders}
                    stagescore={user.stagescore}
                    totalscore={user.totalscore}
                />
            )
        });

        return (
            <table className="pouleTable">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Stage</th>
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
            stage: parseInt(this.props.match.params.stagenumber), //Haal het nummer uit de link
            userTeamResult: [],
            userScores: [],
            stageresults: [],
            prevText: "",
            currText: "",
            nextText: "",
            lastStage: false,
            raceStarted: false,
        }
        this.previousStage = this.previousStage.bind(this);
        this.nextStage = this.nextStage.bind(this);
    }
    updateData(stage) {
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/getstageresultsclassics', { race: race, year: year, stageNumber: stage }) //to: stageresults.js
            .then((res) => {
                if (res.data.mode === '404') {
                    this.setState({
                        mode: '404'
                    })
                } else {
                    this.setState({
                        mode: '',
                        userTeamResult: res.data.teamresult,
                        userScores: res.data.userscores,
                        userScoresColtype: res.userScoresColtype,
                        stageresults: res.data.stageresults,
                        prevText: res.data.prevText,
                        currText: res.data.currText,
                        nextText: res.data.nextText,
                        lastStage: res.data.lastStage,
                        raceStarted: res.data.raceStarted
                    })
                }
            })
    }
    previousStage() {
        const currentstage = parseInt(this.state.stage)
        if(currentstage>1){
            this.props.history.push('/stage/' + (currentstage - 1).toString())
            this.setState({
                stage: (currentstage - 1).toString()
            })
            this.updateData((currentstage - 1).toString())
        }
}
    nextStage() {
        if(!this.state.lastStage){
            const currentstage = parseInt(this.state.stage)
            this.props.history.push('/stage/' + (currentstage + 1).toString())
            this.setState({
                stage: (currentstage + 1).toString()
            })
            this.updateData((currentstage + 1).toString())
        }else{
            this.props.history.push('/finalstandings')
        }
    }
    
    getSelectionDetails(stage){
    }

    componentDidMount() {
        this.updateData(parseInt(this.state.stage));
        this.getSelectionDetails(parseInt(this.state.stage));
    }


    

    render() {
        const mode = this.state.mode
        let message
        let resTable
        let pTable
        let stResTable
        var prevButton = ''
        if (mode === '404') {
            message = <h3>404: Data not found</h3>
            resTable = ''
            pTable = ''
            stResTable = ''
        } else {
            resTable = <Table data={this.state.userTeamResult} title={"Selectie"} />
            pTable = <PouleTable userScores={this.state.userScores}/>
            stResTable = <Table data={this.state.stageresults} title={"Uitslag"} />
        }
        if(!this.state.raceStarted || this.state.stage !== 1){
            prevButton = <div id="prevStageButton">
            <button  onClick={this.previousStage}>{this.state.prevText}</button>
            </div>;
        }
        return (
            <div className="stageContainer">
                <div id="titlebuttons">
                    {prevButton}
                    <div id='title'>{this.state.currText}</div>
                    <div id="nextStageButton">
                        <button onClick={this.nextStage}>{this.state.nextText}</button>
                    </div>
                </div>
                {message}
                <div className="res">{resTable}</div>
                <div className="poule">{pTable}</div>
                <div className="stage">{stResTable}</div>
            </div>
        )
    }
}

export default Stage