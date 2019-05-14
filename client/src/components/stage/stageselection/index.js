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

class SelecTableRow extends Component{
    removeRider=()=> {
        this.props.removeRider(this.props.riderID);
    }
    setKopman=()=> {
        this.props.setKopman(this.props.riderID);
    }
    render(){
        let removeButton
        let setKopmanButton
        if(this.props.selected==='selected'){
            if(this.props.kopman===this.props.riderID){
                setKopmanButton = <button onClick={() => this.setKopman(this.props.riderID)}>IS DE KOPMAN</button>
                removeButton = <button onClick={() => this.removeRider(this.props.riderID)}>Remove rider</button>
            }else{
                setKopmanButton = <button onClick={() => this.setKopman(this.props.riderID)}>Maak kopman</button>
                removeButton = <button onClick={() => this.removeRider(this.props.riderID)}>Remove rider</button>
            }
        }else{
            removeButton = ''
            setKopmanButton = ''
        }
        return(
            <tr >
                <td>{setKopmanButton}</td>
                <td className={this.props.selected}>{this.props.name}</td>
                <td className={this.props.selected}>{this.props.team}</td>
                <td><Selectionbutton selected={this.props.selected} selectRider={this.props.selectRider} riderID={this.props.riderID}/></td>
                <td>{removeButton}</td>
            </tr>
        )
    }
}

class SelecTable extends Component {
    render() {
        const rows = [];
        const selectionIDs = this.props.selectionIDs;
        const selectionLength = selectionIDs.length;
        this.props.userTeam.map(({lastname,team,rider_participation_id})=>{
            var selected = 'unselected';
            if(selectionIDs.includes(rider_participation_id)){
                selected = 'selected'
            }
            if( selectionLength>=9 && selected!=='selected'){
                rows.push(<SelecTableRow name={lastname} team={team} selected='unselectable' key={rider_participation_id} riderID={rider_participation_id} kopman={this.props.kopman} selectRider={this.props.selectRider}/>)
            }else{
                if(selected === 'selected'){
                    rows.push(<SelecTableRow name={lastname} team={team} selected={selected} key={rider_participation_id} riderID={rider_participation_id} kopman={this.props.kopman} selectRider={this.props.selectRider} removeRider={this.props.removeRider} setKopman={this.props.setKopman}/>)
                }else{
                    rows.push(<SelecTableRow name={lastname} team={team} selected={selected} key={rider_participation_id} riderID={rider_participation_id} kopman={this.props.kopman} selectRider={this.props.selectRider}/>)
                }
            }
        })
        return(
            <table>
                <caption>{selectionLength}/9</caption>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Team</th>
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