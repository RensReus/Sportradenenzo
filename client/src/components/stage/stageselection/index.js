import React, { Component } from 'react';

class SelecTableRow extends Component{
    setKopman=()=> {
        this.props.setKopman(this.props.riderID);
    }
    render(){
        let addRemoveButton
        let setKopmanButton
        if(this.props.selected==='selected'){
            addRemoveButton = <button className="selectbutton" onClick={() => this.props.addRemoveRider(this.props.riderID,'remove')}>-</button>
            if(this.props.kopman===this.props.riderID){
                setKopmanButton = <button className="selectbutton" onClick={() => this.setKopman(this.props.riderID)}>✓</button>
            }else{
                setKopmanButton = <button className="selectbutton" onClick={() => this.setKopman(this.props.riderID)}></button>
            }
        }else if(this.props.selected==='unselected'){
            addRemoveButton = <button className="selectbutton" onClick={() => this.props.addRemoveRider(this.props.riderID,'add')}>+</button>
        }
        return(
            <tr >
                <td className="selectbutton">{setKopmanButton}</td>
                <td className={this.props.selected}>{this.props.name}</td>
                <td className={this.props.selected}>{this.props.team}</td>
                <td className="selectbutton">{addRemoveButton}</td>
            </tr>
        )
    }
}

class SelecTable extends Component {
    render() {
        const rows = [];
        const selectionIDs = this.props.selectionIDs;
        const selectionLength = selectionIDs.length;
        const userTeamSorted = this.props.userTeam.sort(function(a,b){//put selected on top
            var aSelected = selectionIDs.includes(a.rider_participation_id);
            var bSelected = selectionIDs.includes(b.rider_participation_id);
            if(aSelected === bSelected) return 0;
            if(aSelected) return -1;
            return 1;
        })

        userTeamSorted.map(({lastname,team,rider_participation_id,dnf})=>{
            var selected = 'unselected';
            if(selectionIDs.includes(rider_participation_id)){
                selected = 'selected'
            }
            if((selectionLength>=9 && selected!=='selected') || dnf){
                rows.push(<SelecTableRow name={lastname} team={team} selected='unselectable' key={rider_participation_id} riderID={rider_participation_id} kopman={this.props.kopman} addRemoveRider={this.props.addRemoveRider}/>)
            }else{
                if(selected === 'selected'){
                    rows.push(<SelecTableRow name={lastname} team={team} selected={selected} key={rider_participation_id} riderID={rider_participation_id} kopman={this.props.kopman} addRemoveRider={this.props.addRemoveRider} setKopman={this.props.setKopman}/>)
                }else{
                    rows.push(<SelecTableRow name={lastname} team={team} selected={selected} key={rider_participation_id} riderID={rider_participation_id} kopman={this.props.kopman} addRemoveRider={this.props.addRemoveRider}/>)
                }
            }
        })
        return(
            <table>
                <caption>{selectionLength}/9</caption>
                <thead>
                    <tr>
                        <th>Kopman</th>
                        <th>Name</th>
                        <th>Team</th>
                        <th>   </th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        )
    }
}

export default SelecTable