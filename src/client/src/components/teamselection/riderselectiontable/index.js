import { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faPlus } from "@fortawesome/free-solid-svg-icons";

class Selectionbutton extends Component{
    addRemoveRider=()=> {
        if(this.props.selected==='unselected'){
            this.props.addRemoveRider('addRider', this.props.riderID, this.props.budgetParticipation);
        } else if (this.props.selected==='selected') {
          this.props.addRemoveRider('removeRider', this.props.riderID, this.props.budgetParticipation);
        }
    }
    render(){
        let buttonText
        let className
        if(this.props.selected==='unselected'){
            buttonText = <FontAwesomeIcon icon={faPlus} />
            className = 'button_standard small blue'
        }else if(this.props.selected==='selected'){
            buttonText = <FontAwesomeIcon icon={faTimes} />
            className = 'button_standard small red'
        }else if(this.props.selected==='unselectable'){
            buttonText = <FontAwesomeIcon icon={faPlus} />
            className = 'button_standard small gray disableds'
        }
        return(
            <button className={className} onClick={() => this.addRemoveRider(this.props.riderID, this.props.budgetParticipation)}>{buttonText}</button>
        )
    }
}

class Riderrow extends Component{
    render(){
        return(
            <tr className='riderRow'>
                <td className={this.props.selected}>
                  <div>
                    <div>
                      {this.props.name}
                    </div>
                    <div className='text-gray-500 mt-2'>
                      {this.props.team}
                    </div>
                  </div>
                  </td>
                <td className={this.props.selected}></td>
                <td className={this.props.selected}>{this.props.price.toLocaleString('nl', {useGrouping:true})}</td>
                <td><Selectionbutton selected={this.props.selected} addRemoveRider={this.props.addRemoveRider} riderID={this.props.riderID} budgetParticipation={this.props.budgetParticipation}/></td>
            </tr>
        )
    }
}

class Riderselectiontable extends Component{
    render(){
        const selectionIDs = this.props.selectionIDs;
        const selectionLength = selectionIDs.length;
        const rows = this.props.riders.map(({name,team,price,rider_participation_id})=>{
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
            if(((this.props.budget<price + 500000*(19-selectionLength) || selectionLength>=20 || teamCount >= 4) && selected!=='selected') || (price>750000 && this.props.budgetParticipation)){
                return <Riderrow name={name} team={team} price={price} selected='unselectable' key={rider_participation_id} riderID={rider_participation_id} budgetParticipation={this.props.budgetParticipation} addRemoveRider={this.props.addRemoveRider}/>
            }else{
                return <Riderrow name={name} team={team} price={price} selected={selected} key={rider_participation_id} riderID={rider_participation_id} budgetParticipation={this.props.budgetParticipation} addRemoveRider={this.props.addRemoveRider}/>
            }
        })
        return(
            <table className="teamselection-table">
                <thead>
                    <tr>
                        <th>Rider</th>
                        <th>Specialty</th>
                        <th>Price</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {this.props.riders.length == 0?
                      <tr>
                      <td colSpan="4">
                        <div className="text-gray-400 text-center text-2xl">No rider found, try a different search?</div>
                      </td>
                      </tr>
                      :
                      <></> 
                    }
                    {rows}
                </tbody>
            </table>
        )
    }
}

export default Riderselectiontable