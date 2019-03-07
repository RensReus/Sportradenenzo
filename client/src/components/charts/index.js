import React, { Component } from 'react';
import axios from 'axios';


var CanvasJS = require('./canvasjs.min');
CanvasJS = CanvasJS.Chart ? CanvasJS : window.CanvasJS;

class CanvasJSChart extends Component {
	static _cjsContainerId = 0
	constructor(props) {		
		super(props);		
		this.options = props.options ? props.options : {};		
		this.containerProps = props.containerProps ? props.containerProps : {width: "100%", position: "relative"};
		this.containerProps.height = props.containerProps && props.containerProps.height ? props.containerProps.height : this.options.height ? this.options.height + "px" : "400px";
		this.chartContainerId = "canvasjs-react-chart-container-" + CanvasJSChart._cjsContainerId++;
	}	
	componentDidMount() {
		//Create Chart and Render		
		this.chart = new CanvasJS.Chart(this.chartContainerId, this.options);
		this.chart.render();
		
		if(this.props.onRef)
			this.props.onRef(this.chart);
	}	
    shouldComponentUpdate(nextProps, nextState){
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
		if(this.props.onRef)
			this.props.onRef(undefined);
	}		
	render() {		
		//return React.createElement('div', { id: this.chartContainerId, style: this.containerProps });		
		return <div id = {this.chartContainerId} style = {this.containerProps}/>		
	}	
}


class charts extends Component {
	constructor(props) {
		super(props);
		this.state = ({options: {}});
	  }

	componentWillMount() {
		this.setState({
			options: {
				theme: "light2",
				title: {
					text: "Comparison of Exchange Rates - 2017"
				},
				subtitles: [{
					text: "GBP & USD to INR"
				}],
				axisY: {
					includeZero: false,
					prefix: "₹"
				},
				toolTip: {
					shared: true
				},
				data: [
				{
					type: "candlestick",
					name: "GBP",
					showInLegend: true,
					xValueFormatString: "YYYY",
					yValueFormatString: "₹#,##0.##",
					dataPoints: [
						{ x: new Date("2017-01-01"), y: [36.61, 38.45, 36.19, 36.82] },
						{ x: new Date("2017-02-01"), y: [36.82, 36.95, 34.84, 36.20] },
						{ x: new Date("2017-03-01"), y: [35.85, 36.30, 34.66, 36.07] },
						{ x: new Date("2017-04-01"), y: [36.19, 37.50, 35.21, 36.15] },
						{ x: new Date("2017-05-01"), y: [36.11, 37.17, 35.02, 36.11] },
						{ x: new Date("2017-06-01"), y: [36.12, 36.57, 33.34, 33.74] },
						{ x: new Date("2017-07-01"), y: [33.51, 35.86, 33.23, 35.47] },
						{ x: new Date("2017-08-01"), y: [35.66, 36.70, 34.38, 35.07] },
						{ x: new Date("2017-09-01"), y: [35.24, 38.15, 34.93, 38.08] },
						{ x: new Date("2017-10-01"), y: [38.12, 45.80, 38.08, 45.49] },
						{ x: new Date("2017-11-01"), y: [45.97, 47.30, 43.77, 44.84] },
						{ x: new Date("2017-12-01"), y: [44.73, 47.64, 42.67, 46.16] }
					]
				},
				{
					type: "splineArea",
					name: "USD",
					showInLegend: true,
					xValueFormatString: "MMM YYYY",
					yValueFormatString: "₹#,##0.##",
					dataPoints: [
						{ x: new Date("2017- 01- 01"), y: 67.515},
						{ x: new Date("2017- 02- 01"), y: 66.725},
						{ x: new Date("2017- 03- 01"), y: 64.86},
						{ x: new Date("2017- 04- 01"), y: 64.29},
						{ x: new Date("2017- 05- 01"), y: 64.51},
						{ x: new Date("2017- 06- 01"), y: 64.62},
						{ x: new Date("2017- 07- 01"), y: 64.2},
						{ x: new Date("2017- 08- 01"), y: 63.935},
						{ x: new Date("2017- 09- 01"), y: 65.31},
						{ x: new Date("2017- 10- 01"), y: 86.007},
						{ x: new Date("2017- 11- 01"), y: 87.233},
						{ x: new Date("2017- 12- 01"), y: 86.276}
					]
				}
				]
			}
		})
	}	

	componentDidMount(){
		axios.post('/api/chartuserstagescores', { race_id: 4, poule_id: 0 })
      .then((res) => {
        if (res) {
          this.setState({options:res.data
          })
        }
      })
	}

	render() {
		
		  
	 return (
		<div className="overzichtContainer">
			<CanvasJSChart options = {this.state.options}
            // onRef = {ref => this.chart = ref}
        />
      	</div>
	  );
	}
  }


export default charts;                              