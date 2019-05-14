import React, { Component } from 'react';
import Table from '../../table'

class PouleTableRow extends Component {
    render() {
        return (
            <tr>
                <td className="pouleUser">
                    {this.props.username}
                    <div className="selectionInfo"><Table data={this.props.riders} title={"renners"} /></div>
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
            if (user.riders) riders = user.riders;
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

export default PouleTable