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
            <tr className={this.props.selected}>
                <td>{this.props.name}</td>
                <td>{this.props.team}</td>
                <td>{this.props.price}</td>
                <td><Selectionbutton selected={this.props.selected} selectRider={this.props.selectRider} riderID={this.props.riderID}/></td>
            </tr>
        )
    }
}

class Riderselectiontable extends Component{
    render(){
        const rows = [];
        this.props.riders.map(({name,team,price,rider_participation_id,selected})=>{
            if((this.props.budget<price || this.props.selectionLength>=20) && selected!=='selected'){
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
            <tbody>{rows}</tbody>
            </table>
        )
    }
}

export default Riderselectiontable