import React, { Component } from 'react';
import './index.css';
import axios from 'axios';
import { equal } from 'assert';

class Outputtable extends Component {
    constructor(props) {
        super(props);
        this.switchTabs = this.switchTabs.bind(this);
    }
    switchTabs(tabNR) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");

        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(tabNR).style.display = "block";
        document.getElementById("button" + tabNR).className += " active";
    }

    render() {
        const responseTotal = this.props.output;
        var queryCount = 1;
        var error = false;
        if (Array.isArray(responseTotal)) {
            queryCount = responseTotal.length;
        } else if (responseTotal.name) {//error
            error = true;
        }
        var tabHeaders = [];
        var tables = [];
        for (var tabNR = 0; tabNR < queryCount; tabNR++) {
            var response = '';
            var output = '';
            var commandType = '';
            if (queryCount > 1) {
                response = responseTotal[tabNR];
            } else {
                response = responseTotal;
            }
            commandType = response.command;
            output = response.rows;
            if (error) { output = [] }
            const header = []
            var row = []
            const rows = []
            const switchArg = tabNR;
            var headerClass = "tablinks"
            var tabStyle = {};
            if (tabNR === 0) {
                headerClass += " active"
                tabStyle = { display: 'block' }
            }
            tabHeaders.push(<button className={headerClass} id={"button" + tabNR} onClick={() => { this.switchTabs(switchArg) }}>{tabNR + ": " + commandType}</button>)
            var extraHeader = []
            var extraRow = []

            const properties = Object.keys(response)
            for (var i in properties) {
                extraHeader.push(<th>{properties[i]}</th>)
            }

            var extraRowEl = [];
            for (var property in response) {
                var text = String(response[property]).substring(0, 20);
                if (property === 'fields' || property === 'rows') {
                    text = response[property].length;
                }
                extraRowEl.push(<td>{text}</td>);
            }
            extraRow.push(<tr>{extraRowEl}</tr>);

            if (output.length > 0) {
                const properties = Object.keys(output[0])
                properties.forEach(function (property) {
                    header.push(<th>{property}</th>)
                })
                for (i = 0; i < output.length; i++) {
                    for (property in output[i]) {
                        row.push(<td>{output[i][property] == null ? "null" : output[i][property].toString()}</td>);
                    }
                    rows.push(<tr>{row}</tr>)
                    row = []
                }
            }

            tables.push(
                <div id={tabNR} className="tabcontent" style={tabStyle}>
                    <table>
                        <thead>
                            <tr>
                                {extraHeader}
                            </tr>
                        </thead>
                        <tbody>
                            {extraRow}
                        </tbody>
                    </table>
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
                </div>
            )

        }



        return (
            <div className="outputTableContainer">
                <div className="tab">
                    {tabHeaders}
                </div>
                {tables}
            </div>


        )
    }
}

class Admin extends Component {
    constructor(props) {
        super(props);
        this.state = ({
            output: [],
            value: '',
            submitted: false,
            varRows: [],
        });
        this.submitQuery = this.submitQuery.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.testButton = this.testButton.bind(this);
        this.keyPress = this.keyPress.bind(this);
    }
    submitQuery = (e) => {
        e.preventDefault();
        var varObject = {};
        var variables = this.refs.extraVars.value.split("var ");
        console.log(variables)
        for (var i in variables){
            if(variables[i].length){
                var equalsPos = variables[i].indexOf('=');
                var varName = variables[i].substring(0,equalsPos - 1);
                var varContent = variables[i].substring(equalsPos +3 , variables[i].lastIndexOf('`'))
                console.log(varName, " = ", varContent)
                varObject[varName] = varContent;
            }
        }
        console.log(varObject)
        var query = this.state.value;
        var i = 0;
        while (query.indexOf('$')+1) {
            i++;
            console.log("while loop", query)
            var start = query.indexOf('$');
            var end = query.indexOf('}') + 1;
            console.log('start',start,'end',end)
            var toreplace = query.substring(start, end);
            console.log("toreplace",toreplace)
            var varName = toreplace.substring(2, toreplace.length - 1)
            query = query.replace(toreplace, varObject[varName])
            if(i>200) break;
        }
        console.log(query)
        axios.post('/api/admin', { token: localStorage.getItem('authToken'), query })
            .then((res) => {
                console.log(res.data.data)
                this.setState({ output: res.data.data, submitted: true })
            })
    }
    handleChange(e) {
        this.setState({ value: e.target.value });
    }
    testButton(e) {
        this.setState({ value: e.target.value })
    }

    keyPress(e) {
        if ((e.keyCode === 10 || e.keyCode === 13) && e.ctrlKey) {
            this.submitQuery(e);
        }
    }



    componentDidMount() {
        this.input.focus();
        document.title = "Admin";
    }

    render() {

        return (
            <div className="adminpageContainer">
                <div>
                    <form action="" onSubmit={this.submitQuery} id="queryform">
                    <div><textarea ref="extraVars" className="queryInputBox" rows="5" cols="140" onKeyDown={this.keyPress}></textarea></div>
                        <textarea className="queryInputBox" rows="20" cols="140" value={this.state.value} onChange={this.handleChange} onKeyDown={this.keyPress} ref={(input) => { this.input = input; }} />
                        <input type="submit" value="submit" />
                    </form>
                    <button onClick={this.testButton} value='SELECT * FROM account' className="queryButton">Get all accounts</button>
                    <button onClick={this.testButton} value="SELECT race_id FROM race WHERE name = '' AND year = ''" className="queryButton">Get race ID</button>

                    <Outputtable output={this.state.output} />

                </div>
            </div>
        )
    }
}

export default Admin