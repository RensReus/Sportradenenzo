import React, { Component } from 'react';
import './index.css';
import axios from 'axios';

class Outputtable extends Component{
    render(){
        const output = this.props.output
        const header = []
        var row = []
        const rows = []
        if(output.length>0){
            const properties = Object.keys(output[0])
            properties.forEach(function(property){
                header.push(<th>{property}</th>)
            })
            for(var i=0;i<output.length;i++){
                for (var property in output[i]) {
                    row.push(<td>{output[i][property]}</td>);
                }
                rows.push(<tr>{row}</tr>)
                row = []
            }
        }
        return(
            <table className="outputTable">
                <thead>
                    <tr>
                        {header}
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        )
    }
}

class Admin extends Component{
    constructor(props){
        super(props);
        this.state = ({output: [],value: ''});
        this.submitQuery = this.submitQuery.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.testButton = this.testButton.bind(this);
    }
    submitQuery = (e) => {
        e.preventDefault();
        axios.post('/api/admin',{query : this.state.value})
        .then((res)=>{
            this.setState({output:res.data.data})
        })
    }
    handleChange(e){
        this.setState({value: e.target.value});
    }
    testButton(e){
        this.setState({value: e.target.value})
    }
    render(){
        
        return(
            <div className="adminpageContainer">
                <div>
                    <form action="" onSubmit={this.submitQuery} id="queryform">
                        <textarea className="queryInputBox" rows="20" cols="80" value={this.state.value} onChange={this.handleChange}/>
                        <input type="submit" value="submit" />
                    </form>
                    <button onClick={this.testButton} value='SELECT * FROM account' className="queryButton">Get all accounts</button>
                    <button onClick={this.testButton} value="SELECT race_id FROM race WHERE name = '' AND year = ''" className="queryButton">Get race ID</button>
                    <button onClick={this.testButton} value="SELECT rider.firstname || ' ' || rider.lastname as name, price, team, rider_participation_id FROM rider_participation INNER JOIN rider using(rider_id) WHERE race_id = ${race_id}" className="queryButton">Get all riders</button>
                    <div className="outputTableContainer">
                        <Outputtable output={this.state.output}/>
                    </div>
                </div>
            </div>
        )
    }   
}   

export default Admin