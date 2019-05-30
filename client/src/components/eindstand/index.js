import React, { Component } from 'react';
import axios from 'axios';
//import './index.css';
import underConstruction from '../../under_construction.gif'


class FinalStandings extends Component{
    constructor(props) {
        super(props);
        this.state = {
            mode: '',
            race: 'giro',
            year: '2019',
            userTeamResult: [],
            userScores: [],
            stageresults: [],
            prevText: "",
            currText: "",
            lastStageLink: "",
            username: "",
        }
        this.toLastStage = this.toLastStage.bind(this);
    }
    componentDidMount() {
        axios.post('/api/getfinalclassics', { }) //to: userparticipation.js
        .then((res)=>{
            this.setState({
                prevText: res.data.prevText,
                lastStageLink: res.data.lastStageLink,
                username: res.data.username,
            })
        })
    }

    toLastStage(){
        this.props.history.push(this.state.lastStageLink)        
    }
    render(){
        console.log(this.state)
        return(
            <div className="standardContainer">
            <div id="titlebuttons">
                    <div id="prevStageButton">
                        <button onClick={this.toLastStage}>{this.state.prevText}</button>
                    </div>
                    <div id='title'>Eindstand</div>
                </div>
                <img src={underConstruction} alt="still building" />
                <font size="+4">Nog even geduld {this.state.username}</font>
                <div></div>
            </div>
        )
    }
}

export default FinalStandings