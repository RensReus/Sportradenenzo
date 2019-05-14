import React, { Component } from 'react';
import axios from 'axios';


var CanvasJS = require('./canvasjs.min');
CanvasJS = CanvasJS.Chart ? CanvasJS : window.CanvasJS;

class CanvasJSChart extends Component {
	static _cjsContainerId = 0
	constructor(props) {
		super(props);
		this.options = props.options ? props.options : {};
		this.containerProps = props.containerProps ? props.containerProps : { width: "100%", position: "relative" };
		this.containerProps.height = props.containerProps && props.containerProps.height ? props.containerProps.height : this.options.height ? this.options.height + "px" : "400px";
		this.chartContainerId = "canvasjs-react-chart-container-" + CanvasJSChart._cjsContainerId++;
	}
	componentDidMount() {
		//Create Chart and Render		
		this.chart = new CanvasJS.Chart(this.chartContainerId, this.options);
		this.chart.render();

		if (this.props.onRef)
			this.props.onRef(this.chart);
	}
	shouldComponentUpdate(nextProps, nextState) {
		//Check if Chart-options has changed and determine if component has to be updated
		return !(nextProps.options === this.options);
	}
	componentDidUpdate() {
		//Update Chart Options & Render
		this.chart.options = this.props.options;
		this.chart.render();
	}
	componentWillUnmount() {
		//Destroy chart and remove reference
		this.chart.destroy();
		if (this.props.onRef)
			this.props.onRef(undefined);
	}
	render() {
		//return React.createElement('div', { id: this.chartContainerId, style: this.containerProps });		
		return <div id={this.chartContainerId} style={this.containerProps} />
	}
}

class TypeSelector extends Component {
	render() {
		return (
			<div>
				<div>ChartType</div>
				<select value={this.props.chartType} onChange={this.props.handleChange}>
					<option value="stackedArea100">Relatief</option>
					<option value="stackedArea">Absoluut</option>
					<option value="line">Absoluut per renner</option>
				</select>
			</div>
		);
	}
}


class ThemeSelector extends Component {
	render() {
		return (
			<div>
				<div>Theme</div>
				<select value={this.props.theme} onChange={this.props.changeTheme}>
					<option value="light1">light1</option>
					<option value="light2">light2</option>
					<option value="dark1">dark1</option>
					<option value="dark2">dark2</option>
				</select>
			</div>
		);
	}
}


class charts extends Component {
	constructor(props) {
		super(props);
		this.state = {
			options: {},
			chartname: this.props.match.params.chartname,
			chartType: "",
			chartTypeOptions: [],
			data: [],
			theme: "dark1"
		};
		this.handleChange = this.handleChange.bind(this);
		this.changeTheme = this.changeTheme.bind(this);
	}

	componentDidMount() {
		switch (this.state.chartname) {
			case "userscores":
				this.userscores();
				this.setState({ chartType: "line" })
				break;
			case "userrank":
				this.userranking();
				this.setState({chartType: "line"})
				break;
			case "riderpercentage":
				this.riderpercentage()
				this.setState({ chartType: "stackedColumn" })
				break;
			case "riderpercentagetotal":
				this.riderpercentagetotal()
				this.setState({ chartType: "stackedArea" })
				break;
			default:
				this.userscores();
		}

	}

	userscores() {
		axios.post('/api/chartuserstagescores', { race_id: 5, poule_id: 0, budgetparticipation:false, token: localStorage.getItem('authToken') })
			.then((res) => {
				if (res) {
					this.setState({ data: res.data })
					this.buildUserscores()
				}
			})
	}
	
	buildUserscores() {
		var data = this.state.data;
		for (var i in data) {
			data[i].type = this.state.chartType
		}
		var options = {
			title: {
				text: "Scores"
			},
			subtitles: [{
				text: "Totaal score na iedere etappe"
			}],
			axisX: {
				interval: 1,
				title: "Stage"
			},
			axisY: {
				title: "Points"
			},
			toolTip: {
				shared: true
			},
			data: data
		}
		this.setState({ options: options })
	}
	
	userranking(){
		axios.post('/api/chartuserranking', { race_id: 5, poule_id: 0,budgetparticipation:false, token: localStorage.getItem('authToken') })
			.then((res) => {
				if (res) {
					this.setState({ data: res.data })
					this.buildUserranking()
				}
			})
	}

	buildUserranking(){
		var data = this.state.data;
		for (var i in data) {
			data[i].type = this.state.chartType
		}
		var options = {
			title: {
				text: "Ranking"
			},
			subtitles: [{
				text: "Positie na iedere etappe"
			}],
			axisX: {
				interval: 1,
				title: "Stage"
			},
			axisY: {
				title: "Rank",
			},
			toolTip: {
				shared: true
			},
			data: data
		}
		this.setState({ options: options })
	}

	riderpercentage() {
		axios.post('/api/chartriderpercentage', { race_id: 5, poule_id: 0, token: localStorage.getItem('authToken'), budgetparticipation:false })
			.then((res) => {
				if (res) {
					this.setState({ data: res.data })
					this.buildRiderpercentage()
				}
			})
	}

	buildRiderpercentage() {
		var data = this.state.data;
		for (var i in data) {
			data[i].type = this.state.chartType
		}
		var options = {
			title: {
				text: "Scores per etappe"
			},
			subtitles: [{
				text: "Punten per renner"
			}],
			axisX: {
				title: "Stage",
				interval: 1
			},
			axisY: {
				title: "Points"
			},
			toolTip: {
				content: "{name}: {y} ",
			},
			data: data
		}
		this.setState({ options: options })
	}

	riderpercentagetotal() {
		axios.post('/api/chartriderpercentagetotal', { race_id: 5, poule_id: 0, token: localStorage.getItem('authToken'), budgetparticipation:false })
			.then((res) => {
				if (res) {
					this.setState({ data: res.data })
					this.buildRiderpercentagetotal(this.state.chartType)
				}
			})
	}

	buildRiderpercentagetotal(value) {
		var data = this.state.data;
		for (var i in data) {
			data[i].type = value
		}
		var options = {
			title: {
				text: "Totaal Scores"
			},
			subtitles: [{
				text: "Punten per renner"
			}],
			axisX: {
				title: "Stage",
				interval: 1
			},
			axisY: {
				title: "Points"
			},
			toolTip: {
				content: "{name}: {y} "
			},
			data: data
		}
		this.setState({ options: options })
	}

	handleChange(event) {
		this.setState({ chartType: event.target.value });
		this.buildRiderpercentagetotal(event.target.value)
	}

	changeTheme(event) {
		console.log(event.target.value)
		this.setState({ theme: event.target.value });
	}

	render() {
		let typeSelector = "";
		if(this.state.chartname === "riderpercentagetotal"){
			typeSelector = <TypeSelector handleChange={this.handleChange} chartType={this.state.chartType} />
		}
		var options = this.state.options;
		options.theme = this.state.theme;
		return (
			<div className="overzichtContainer">
				{typeSelector}
				<ThemeSelector changeTheme = {this.changeTheme} theme={this.state.theme}/>
				<CanvasJSChart options={options} />
			</div>
		);
	}
}


export default charts;                              