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
    this.endRaceActions = this.endRaceActions.bind(this);
    this.copyTeamIfSelectionEmpty = this.copyTeamIfSelectionEmpty.bind(this);

    this.changeGSKText = this.changeGSKText.bind(this);
    this.changeGRKText = this.changeGRKText.bind(this);
    this.changeGRText = this.changeGRText.bind(this);
    this.changeGRTextCopy = this.changeGRTextCopy.bind(this);

    this.handleChangeYear = this.handleChangeYear.bind(this);
    this.handleChangeName = this.handleChangeName.bind(this);
    document.title = "Manuel Update";
    this.state = {
      gskStage: "",
      gskStatus: "",
      grkStage: "",
      grkstatus: "",
      grStage: "",
      grstatus: "",
      gsStatus: "",
      year: "2021",
      raceName: "vuelta"
    }
  }

  //button click handlers
  getStartlistKlassiek(e) {
    e.preventDefault();
    this.setState({ gskStage: "In Progress", gskStatus: "inprogress" })
    axios.post('/api/getstartlistklassiek', { year: 2019, stage: this.state.gskStage })
      .then((res) => {
        this.setState({
          gskStage: "",
          gskStatus: res.data
        })
      })
  }

  getResultsKlassiek(e) {
    e.preventDefault();
    this.setState({ grkStage: "In Progress", grkStatus: "inprogress" })
    axios.post('/api/getresultsklassiek', { year: 2019, stage: this.state.grkStage })
      .then((res) => {
        this.setState({ grkStage: res.data })
        this.setState({
          grkStage: "",
          grkStatus: res.data
        })
      })
  }

  getStartlist() {
    axios.post('/api/getstartlist', { raceName: this.state.raceName, year: this.state.year })
      .then((res) => {
        this.setState({ grStage: res.data })
      })
  }

  getResults(e) {
    e.preventDefault();
    this.setState({ grStage: "In Progress", grstatus: "inprogress" })
    axios({
      method: 'post',
      url: '/api/getresults',
      data: { raceName: this.state.raceName, year: this.state.year, stage: this.state.grStage },
      responseType: 'stream'
    })
      .then((res) => {
        console.log(res.data)
        this.setState({ grStage: res.data })
      })
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

  changeGRTextCopy(event) {
    this.setState({
      grStageCopy: event.target.value
    });
  }

  //dropdown select handlers
  handleChangeYear(event) {
    this.setState({ year: event.target.value });
  }

  handleChangeName(event) {
    this.setState({ raceName: event.target.value });
  }

  endRaceActions() {
    axios.post('/api/endRaceActions', { raceName: this.state.raceName, year: this.state.year })
      .then((res) => {
        this.setState({ grStage: res.data })
      })
  }

  copyTeamIfSelectionEmpty(e) {
    e.preventDefault();
    var stage = Number(this.state.grStageCopy);
    axios.post('/api/copyTeamIfSelectionEmpty', { raceName: this.state.raceName, year: this.state.year, stage })
      .then((res) => {
        this.setState({ grStageCopy: res.data })
      })
  }

  render() {
    return (
      <div className="mainContainer">
        <div className="raceType">
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
        <div className="raceType">
          <div className="title">Grote Ronde</div>
          <div className="grMainRow">
            <div>year</div>
            <select value={this.state.year} onChange={this.handleChangeYear}>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
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

          <form className="row" action="" onSubmit={this.getResults}>
            <div className="discription">Get Results incl. userscores </div>
            <input className={"inputfield " + this.state.grStatus} id="gr" ref="gr" placeholder="Stage #" value={this.state.grStage} onChange={this.changeGRText} />
            <button>Submit</button>
          </form>

          <form className="row" action="" onSubmit={this.copyTeamIfSelectionEmpty}>
            <div className="discription">Opstelling vergeten Copy. </div>
            <input className={"inputfield "} id="gr" ref="gr" placeholder="Stage #" value={this.state.grStageCopy} onChange={this.changeGRTextCopy} />
            <button>Submit</button>
          </form>

          <div className="row">
            <button onClick={this.endRaceActions}>Race Finished/ Copy Scores</button>
          </div>

        </div>

      </div>
    )
  }
}

export default manualupdate