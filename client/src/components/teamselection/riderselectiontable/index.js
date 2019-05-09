import React, { Component } from 'react';

class Selectionbutton extends Component{
    addRider=()=> {
        if(this.props.selected==='unselected'){
            this.props.addRider(this.props.riderID, this.props.budgetParticipation);
        }
    }
    render(){
        return(
            <button className={this.props.selected} onClick={() => this.addRider(this.props.riderID, this.props.budgetParticipation)}>{this.props.selected}</button>
        )
    }
}

class Riderrow extends Component{
    render(){
        return(
            <tr >
                <td className={this.props.selected}>{this.props.name}</td>
                <td className={this.props.selected}>{this.props.team}</td>
                <td className={this.props.selected}>{this.props.price}</td>
                <td><Selectionbutton selected={this.props.selected} addRider={this.props.addRider} riderID={this.props.riderID} budgetParticipation={this.props.budgetParticipation}/></td>
            </tr>
        )
    }
}

class Riderselectiontable extends Component{
    render(){
        const rows = [];
        const selectionIDs = this.props.selectionIDs;
        const selectionLength = selectionIDs.length;
        this.props.riders.map(({name,team,price,rider_participation_id})=>{
            var selected = 'unselected';
            if(selectionIDs.includes(rider_participation_id)){
                selected = 'selected'
            }
            var teamCount = 0;
            for(var i in this.props.selectionTeams){
                if(this.props.selectionTeams[i] === team){
                    teamCount += 1;
                }
            }
            if(((this.props.budget<price + 500000*(20-selectionLength) || selectionLength>=20 || teamCount >= 4) && selected!=='selected') || (price>750000 && this.props.budgetParticipation)){
                rows.push(<Riderrow name={name} team={team} price={price} selected='unselectable' key={rider_participation_id} riderID={rider_participation_id} budgetParticipation={this.props.budgetParticipation} addRider={this.props.addRider}/>)
            }else{
                rows.push(<Riderrow name={name} team={team} price={price} selected={selected} key={rider_participation_id} riderID={rider_participation_id} budgetParticipation={this.props.budgetParticipation} addRider={this.props.addRider}/>)
            }
        })
        return(
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Team</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        )
    }
}

export default Riderselectiontable