import React, { Component } from 'react';
import axios from 'axios';



class import_export extends Component {
    constructor(props) {
        super(props);
        this.handleChangeYear = this.handleChangeYear.bind(this);
        this.handleChangeName = this.handleChangeName.bind(this);
        this.exportData = this.exportData.bind(this);
        this.importData = this.importData.bind(this);
        document.title = "Import/Export";
        this.state = {
            year: "2019",
            raceName: "tour"
        }
    }

    importData(){
        axios.post('/api/import', { raceName: this.state.raceName, year: this.state.year, token: localStorage.getItem('authToken')})
        .then((res) => {
            console.log("Import processed")
        })
    }

    exportData(){
        axios.post('/api/export', { raceName: this.state.raceName, year: this.state.year, token: localStorage.getItem('authToken')})
        .then((res) => {
            console.log("export processed")
        })
    }
    
    //dropdown select handlers
    handleChangeYear(event) {
        this.setState({ year: event.target.value });
    }

    handleChangeName(event) {
        this.setState({ raceName: event.target.value });
    }
    render() {
        return (
            <div className="mainContainer">
                <div className="raceType">
                    <div className="grMainRow">

                        <div>year</div>
                        <select value={this.state.year} onChange={this.handleChangeYear}>
                            <option value="2018">2018</option>
                            <option value="2019">2019</option>
                            <option value="2020">2020</option>
                        </select>
                        
                        <div>Name</div>
                        <select value={this.state.raceName} onChange={this.handleChangeName}>
                            <option value="giro">Giro</option>
                            <option value="tour">Tour</option>
                            <option value="vuelta">Vuelta</option>
                            <option value="classics">Klassieker</option>
                        </select>
                    </div>

                    <button onClick = {this.importData}>Import Data</button>
                    <button onClick = {this.exportData}>Export/Delete Data</button>
                </div>

            </div>
        )
    }
}

export default import_export