import React, { Component } from 'react';
import axios from 'axios';
import Table from '../shared/table'

class Profile extends Component {
    constructor(props) {
        super(props);
        this.state = ({
            scores: [],
            username: ''
        });
    }

    componentDidMount() {
        if (this.props.match.params.account_id) {
            axios.post('/api/getprofiledata', { account_id: this.props.match.params.account_id, username: null })
                .then((res) => {
                    document.title = res.data.username;
                    this.setState({
                        scores: res.data.scores,
                        username: res.data.username,
                    })

                })
        }
        if (this.props.match.params.username) {
            axios.post('/api/getprofiledata', { account_id: null, username: this.props.match.params.username })
                .then((res) => {
                    document.title = res.data.username;
                    this.setState({
                        scores: res.data.scores,
                        username: res.data.username,
                    })
                })
        }
    }

    render() {
        console.log(this.state.scores)
        var scoresTable = <div style={{ width: '50%' }}><Table data={this.state.scores} title={this.state.username} coltype={{ name: 0, year: 1, finalscore: 1, rank: 1 }} /></div>
        return (
            <div className="standardContainer">
                <div className='h7' style={{ display: this.state.upcomingParticipation ? 'none' : 'block' }}>
                    {scoresTable}

                </div>
                <div>En dan hier een sexy profiel foto of zo met duckface oid</div>
            </div>
        )
    }
}

export default Profile