import { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faPlus } from "@fortawesome/free-solid-svg-icons";

class Selectionbutton extends Component {
    addRemoveRider = () => {
        if (this.props.selected === 'unselected') {
            this.props.addRemoveRider('addRider', this.props.riderID, this.props.budgetParticipation);
        } else if (this.props.selected === 'selected') {
            this.props.addRemoveRider('removeRider', this.props.riderID, this.props.budgetParticipation);
        }
    }

    getHoverText = (selectable) => {
        var reason = selectable.substring(13);
        var texts = {
            "teamComplete": "Jouw team is compleet",
            "maxFourPerTeam": "Je mag max 4 renners per team hebben",
            "notEnoughMoney": "Je heb genoeg geld meer"
        }
        return texts[reason];
    }

    render() {
        let buttonText
        let className
        let hoverText
        if (this.props.selected === 'unselected') {
            buttonText = <FontAwesomeIcon icon={faPlus} />
            className = 'button_standard small blue'
        } else if (this.props.selected === 'selected') {
            buttonText = <FontAwesomeIcon icon={faTimes} />
            className = 'button_standard small red'
        } else if (this.props.selected.startsWith('unselectable')) {
            hoverText = this.getHoverText(this.props.selected);
            buttonText = <FontAwesomeIcon icon={faPlus} />
            className = 'button_standard small gray disabled'
        }
        return (
            <button className={className} title={hoverText} onClick={() => this.addRemoveRider(this.props.riderID, this.props.budgetParticipation)}>{buttonText}</button>
        )
    }
}

class Riderrow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showInfo: false
        }
    }

    formatRiderSpecialty() {
        var specialty = '';
        var specialtyValue = '';
        var specialtiesTable = [];
        var specialtiesScoreTable = [];
        var highestValue = 0;
        for (const [key, value] of Object.entries(this.props.specialty)) {
            if (value != 0) {
                specialtiesTable.push(<div className='w-24 h-6 mb-2 pt-2'>{key}</div>);
                specialtiesScoreTable.push(<div className='w-24 h-6 mb-2'><span className="text-xl text-yellow-400">{'★'.repeat(value)}</span></div>);
                if (value > highestValue || (key == 'GC' && value * 1.5 > highestValue) || (key == 'Sprint' && value >= highestValue) || key == this.props.skillFilter) {
                    specialty = key;
                    specialtyValue = '★'.repeat(value);
                    highestValue = value;
                    if (key == 'GC') { highestValue = value * 1.5 }
                    if (key == this.props.skillFilter) { highestValue = value + 10 }
                }
            }
        }
        return { specialtiesTable, specialtiesScoreTable, specialty, specialtyValue }
    }

    render() {
        const specialty = this.formatRiderSpecialty();
        return (
            <>
                <tr className='riderRow'>
                    <td className={this.props.selected} onClick={() => this.setState({ showInfo: !this.state.showInfo })}>
                        <div>
                            <div>
                                {this.props.name}
                            </div>
                            <div className='text-gray-500 mt-2'>
                                {this.props.team}
                            </div>
                        </div>
                    </td>
                    <td className={this.props.selected} onClick={() => this.setState({ showInfo: !this.state.showInfo })}><div>{specialty.specialty}<br /><span className="text-xl text-yellow-400">{specialty.specialtyValue}</span></div></td>
                    <td className={this.props.selected} onClick={() => this.setState({ showInfo: !this.state.showInfo })}>{this.props.price.toLocaleString('nl', { useGrouping: true })}</td>
                    <td className={this.props.selected}><Selectionbutton selected={this.props.selected} addRemoveRider={this.props.addRemoveRider} riderID={this.props.riderID} budgetParticipation={this.props.budgetParticipation} /></td>
                </tr>
                {this.state.showInfo ?
                    <tr className=''>
                        <td colSpan='4' className="bg-blue-100">
                            <div className="flex flex-row pl-8">
                                <div>{specialty.specialtiesTable}</div><div>{specialty.specialtiesScoreTable}</div>
                            </div>
                        </td>
                    </tr>
                    : <></>
                }
            </>
        )
    }
}

class Riderselectiontable extends Component {
    render() {
        const selectionIDs = this.props.selectionIDs;
        const selectionLength = selectionIDs.length;
        let forbiddenTeams = {}
        for (var teamName of this.props.selectionTeams) {
            if (!(teamName in forbiddenTeams)) forbiddenTeams[teamName] = 0;
            forbiddenTeams[teamName] += 1;
        }
        forbiddenTeams = Object.fromEntries(Object.entries(forbiddenTeams).filter(([_, value]) => value >= 4));
        const rows = this.props.riders.map(({ name, team, price, rider_participation_id, gc, climb, sprint, punch, tt }) => {
            var selected = 'unselected';
            if (selectionIDs.includes(rider_participation_id)) {
                selected = 'selected';
            } else if (selectionLength >= 20) {
                selected = 'unselectable teamComplete';
            } else if (team in forbiddenTeams) {
                selected = 'unselectable maxFourPerTeam';
            } else if ((this.props.budget < price + 500000 * (19 - selectionLength))) {
                selected = 'unselectable notEnoughMoney';
            }
            return <Riderrow
                name={name}
                team={team}
                price={price}
                selected={selected}
                specialty={{ 'GC': gc, 'Climb': climb, 'Sprint': sprint, 'Punch': punch, 'Time Trial': tt }}
                skillFilter={this.props.skillFilter}
                key={rider_participation_id}
                riderID={rider_participation_id}
                budgetParticipation={this.props.budgetParticipation}
                addRemoveRider={this.props.addRemoveRider}
            />
        })
        return (
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
                    {this.props.riders.length == 0 ?
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