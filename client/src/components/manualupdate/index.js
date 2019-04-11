import React, { Component } from 'react';
import axios from 'axios';
import './index.css';



class manualupdate extends Component {
    constructor(props) {
        super(props);
        this.getStartlistKlassiek = this.getStartlistKlassiek.bind(this);
        this.getResultsKlassiek = this.getResultsKlassiek.bind(this);
        this.getStartlist = this.getStartlist.bind(this);
        this.getResults = this.getResults.bind(this);

        this.changeGSKText = this.changeGSKText.bind(this);
        this.changeGRKText = this.changeGRKText.bind(this);
        this.changeGRText = this.changeGRText.bind(this);

        this.handleChangeYear = this.handleChangeYear.bind(this);
        this.handleChangeName = this.handleChangeName.bind(this);

        this.state = {
            gskStage: "",
            gskStatus: "",
            grkStage: "",
            grkstatus: "",
            grStage: "",
            grstatus: "",
            gsStatus: "",
            year: "2019",
            raceName: "giro"
        }
    }

    //button click handlers
    getStartlistKlassiek(e) {
        e.preventDefault();
        this.setState({gskStage: "In Progress",gskStatus: "inprogress" })
        var stage = Number(this.state.gskStage);
        if (Number.isInteger(stage)) {
            stage = parseInt(stage);
            if (stage > 0 && stage < 15) {
                console.log("stage:", stage);
                axios.post('/api/getstartlistklassiek', { year: 2019, stage: stage })
                    .then((res) => {
                        this.setState({ 
                            gskStage: "",
                            gskStatus: res.data
                        })
                    })
            } else {
                console.log("not in range", stage)
            }
        } else {
            console.log("not an int:", stage)
        }
    }

    getResultsKlassiek(e) {
        e.preventDefault();
        this.setState({grkStage: "In Progress",grkStatus: "inprogress" })
        var stage = Number(this.state.grkStage);
        if (Number.isInteger(stage)) {
            stage = parseInt(stage);
            if (stage > 0 && stage < 15) {
                console.log("stage:", stage);
                axios.post('/api/getresultsklassiek', { year: 2019, stage: stage })
                    .then((res) => {
                        this.setState({ grkStage: res.data })
                        this.setState({ 
                            grkStage: "",
                            grkStatus: res.data
                        })
                    })
            } else {
                console.log("not in range", stage)
            }
        } else {
            console.log("not an int:", stage)
        }
    }

    getStartlist() {
        axios.post('/api/getstartlist', { raceName: this.state.raceName, year: 2019})
        .then((res) => {
            this.setState({ grStage: res.data })            
        })
    }

    getResults(e) {
        e.preventDefault();
        var stage = Number(this.state.grStage);
        if (Number.isInteger(stage)) {
            stage = parseInt(stage);
            if (stage > 0 && stage < 22) {
                console.log("stage:", stage);
                axios.post('/api/getresults', { raceName: this.state.raceName, year: this.state.year, stage: stage })
                    .then((res) => {
                        this.setState({ grStage: res.data })
                    })
            } else {
                console.log("not in range", stage)
            }
        } else {
            console.log("not an int:", stage)
        }
    }

    //textfield value handlers
    changeGSKText(event) {
        this.setState({
            gskStage: event.target.value
        });
    }

    changeGRKText(event) {
        this.setState({
            grkStage: event.target.value
        });
    }

    changeGRText(event) {
        this.setState({
            grStage: event.target.value
        });
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
                <div className="iets">
                    <div className="title">Klassieker</div>
                    <div className="row">

                        <div>year</div>
                        <select value={this.state.year} onChange={this.handleChangeYear}>
                            <option value="2019">2019</option>
                            <option value="2020">2020</option>
                        </select>
                    </div>

                    <form className="row" action="" onSubmit={this.getStartlistKlassiek}>
                        <div className="discription">Get Startlist </div>
                        <input className={this.state.gskStatus} id="gsk" ref="gsk" placeholder="Stage #" value={this.state.gskStage} onChange={this.changeGSKText} />
                        <button>Submit</button>
                    </form>

                    <form className="row" action="" onSubmit={this.getResultsKlassiek}>
                        <div className="discription">Get Results incl. userscores </div>
                        <input className={this.state.grkStatus} id="grk" ref="grk" placeholder="Stage #" value={this.state.grkStage} onChange={this.changeGRKText} />
                        <button>Submit</button>
                    </form>
                </div>
                <div className="iets">
                    <div className="title">Grote Ronde</div>
                    <div className="grMainRow">
                        <div>year</div>
                        <select value={this.state.year} onChange={this.handleChangeYear}>
                            <option value="2019">2019</option>
                        </select>

                        <div>Name</div>
                        <select value={this.state.raceName} onChange={this.handleChangeName}>
                            <option value="giro">Giro</option>
                            <option value="tour">Tour</option>
                            <option value="vuelta">Vuelta</option>
                        </select>
                    </div>

                    <div className="row">
                        <button onClick={this.getStartlist}>Get Startlist</button>
                    </div>

                    <form className="row" action="" onSubmit={this.getResultsKlassiek}>
                        <div className="discription">Get Results incl. userscores </div>
                        <input className="inputfield" id="gk" ref="gk" placeholder="Stage #" value={this.state.grStage} onChange={this.changeGRText} />
                        <button>Submit</button>
                    </form>
                </div>

            </div>
        )
    }
}

export default manualupdate