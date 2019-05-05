import React, { Component } from 'react';

class Selectionbutton extends Component{
    selectRider=()=> {
        if(this.props.selected==='unselected'){
            this.props.selectRider(this.props.riderID);
        }
    }
    render(){
        return(
            <button className={this.props.selected} onClick={() => this.selectRider(this.props.riderID)}>{this.props.selected}</button>
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
                <td><Selectionbutton selected={this.props.selected} selectRider={this.props.selectRider} riderID={this.props.riderID}/></td>
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
            console.log(name,teamCount)
            if(((this.props.budget<price + 500000*(20-selectionLength) || selectionLength>=20 || teamCount >= 4) && selected!=='selected') || (price>750000 && this.props.budgetParticipation)){
                rows.push(<Riderrow name={name} team={team} price={price} selected='unselectable' key={rider_participation_id} riderID={rider_participation_id} selectRider={this.props.selectRider}/>)
            }else{
                rows.push(<Riderrow name={name} team={team} price={price} selected={selected} key={rider_participation_id} riderID={rider_participation_id} selectRider={this.props.selectRider}/>)
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