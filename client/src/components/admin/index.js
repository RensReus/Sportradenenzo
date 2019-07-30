import React, { Component } from 'react';
import './index.css';
import axios from 'axios';
import ManualUpdate from './manualupdate'
import Table from '../shared/table'
import { equal } from 'assert';
var getCaretCoordinates = require('textarea-caret');

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
            console.log("Tab",tabNR)
            console.log(output)
            if (error) { output = []}
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
            shownValue: '',
            submitted: false,
            varRows: [],
            showTab: ['block','none','none'],
            DBinfoTables: [],
            autoCompleteSuggestions: [],
            autoCompleteActive: false,
            currentSuggestions: '',
            selectedSuggestion: 0,
            popUpTop: 0,
            popUpLeft: 0,
            cursorPos: 0,
        });
        this.submitQuery = this.submitQuery.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.keyPress = this.keyPress.bind(this);
        this.showTab = this.showTab.bind(this);
        this.getDBinfo = this.getDBinfo.bind(this);
        this.setSuggestions = this.setSuggestions.bind(this);
    }
    submitQuery = (e) => {
        e.preventDefault();
        var varObject = {};
        var variables = this.refs.extraVars.value.split("var ");
        for (var i in variables){
            if(variables[i].length){
                var equalsPos = variables[i].indexOf('=');
                var varName = variables[i].substring(0,equalsPos - 1);
                var varContent = variables[i].substring(equalsPos +3 , variables[i].lastIndexOf('`'))
                varObject[varName] = varContent;
            }
        }
        var query = this.state.value;
        i = 0;
        while (query.indexOf('$')+1) {
            i++;
            var start = query.indexOf('$');
            var end = query.indexOf('}') + 1;
            var toreplace = query.substring(start, end);
            varName = toreplace.substring(2, toreplace.length - 1)
            query = query.replace(toreplace, varObject[varName])
            if(i>200) break;
        }
        axios.post('/api/admin', { token: localStorage.getItem('authToken'), query })
            .then((res) => {
                this.setState({ output: res.data.data, submitted: true })
            })
    }
    handleChange(e) {
        var deletion = false
        if(e.target.value.length < this.state.value.length){
            deletion = true
        }
        this.setState({ value: e.target.value },()=>{
            var caret = getCaretCoordinates(document.activeElement, document.activeElement.selectionEnd);
            var cursorPos = document.activeElement.selectionStart;
            this.setState({popUpTop: caret.top + caret.height, popUpLeft:caret.left, cursorPos})
            var startindex = Math.max(this.state.value.lastIndexOf(' ',cursorPos-1),this.state.value.lastIndexOf('\t',cursorPos-1),this.state.value.lastIndexOf('\n',cursorPos-1));
            console.log(startindex)
            var currWord = this.state.value.substring(startindex+1,cursorPos);
            console.log(currWord)
            if(currWord.length > 0){// minstens 1 char
                var sug = this.state.autoCompleteSuggestions;
                var currentSuggestions = sug.filter(function(word){
                    var regex = ''
                    for (var i = 0; i< currWord.length; i++) {
                        regex += '['+ currWord.charAt(i) + ']\\w*' 
                    }
                    return word.search(new RegExp(regex,'i')) !== -1
                })
                currentSuggestions.sort(function(a,b){
                    for (var i = 0; i< currWord.length; i++) {
                        var aEq = a.toLowerCase().charAt(i) === currWord.toLowerCase().charAt(i)
                        var bEq = b.toLowerCase().charAt(i) === currWord.toLowerCase().charAt(i)
                        if(!aEq && !bEq) return 0;
                        if(aEq && !bEq) return -1;
                        if(!aEq && bEq) return 1;
                    }
                    return 0;
                })
                this.setState({
                    currentSuggestions,
                    selectedSuggestion: 0,
                    autoCompleteActive: !deletion && currentSuggestions.length,
                })
            }
        })
    }

    keyPress(e) {
        if ((e.keyCode === 10 || e.keyCode === 13) && e.ctrlKey) { //ctrl + enter
            this.submitQuery(e);
        }
        //disable autosuggest popup keys
        var disableKeyCodes = [37,39,27,32,8];//left, right, esc, space, backspace
        var i = this.state.selectedSuggestion;
        var len = this.state.currentSuggestions.length;
        if(this.state.autoCompleteActive){//popupzichtbaar
            if (e.keyCode === 9 || e.keyCode === 10 || e.keyCode === 13){ 
                e.preventDefault();
                this.insertSuggestion(i)
            }
            if (e.keyCode === 38){//up
                e.preventDefault();
                this.setState({selectedSuggestion:(i-1+len)%len})
            }
            if (e.keyCode === 40){//down
                e.preventDefault();
                this.setState({selectedSuggestion:(i+1)%len})
            }
            if (disableKeyCodes.includes(e.keyCode)){
                this.setState({autoCompleteActive:false})
            }
        }
        var cursorPos = document.activeElement.selectionStart;
        this.setState({cursorPos})
    }

    insertSuggestion(i){
        var cursorPos = this.state.cursorPos;
        var startindex = Math.max(this.state.value.lastIndexOf(' ',cursorPos-1),this.state.value.lastIndexOf('\t',cursorPos-1),this.state.value.lastIndexOf('\n',cursorPos-1));
        var newValue = this.state.value.substring(0,startindex+1) + this.state.currentSuggestions[i] + this.state.value.substring(cursorPos)
        this.setState({
            value: newValue,
            currentSuggestions: [],
            selectedSuggestion: 0,
            autoCompleteActive: false,
        })
    }

    showTab(i) {
        if(i === 1){
            this.getDBinfo()
        }
        var showTab = this.state.showTab;
        var curr = showTab.indexOf('block');
        showTab[curr] = 'none';
        showTab[i] = 'block';
        this.setState({ showTab: showTab });
    }

    getDBinfo(){
        axios.post('/api/getdbinfo', { token: localStorage.getItem('authToken')})
            .then((res) => {
                var DBinfoTables = []
                for (var i in res.data.tables) {
                    DBinfoTables.push(<div className="tableDiv" ><Table data={res.data.tables[i].rows} title={res.data.titles[i]} /></div>)
                }
                this.setState({
                    DBinfoTables,
                })
            })
    }

    componentDidMount() {
        this.input.focus();
        document.title = "Admin";
        this.setSuggestions();
    }

    setSuggestions(){
        //Table names
        var suggestions = ['account','race','stage','account_participation','rider','rider_participation', 'team_selection_rider','stage_selection','stage_selection_rider','results_points']
        //Table IDs
        suggestions = suggestions.concat(['account_id','race_id','stage_id','account_participation_id','rider_id','rider_participation_id','stage_selection_id'])
        // SQL COMMANDS
        var list = `ADD, ADD CONSTRAINT, ALTER, ALTER COLUMN, ALTER TABLE, ALL, AND, ANY, AS, ASC, BACKUP DATABASE, BETWEEN, CASE, CHECK, COLUMN, CONSTRAINT, CREATE, CREATE DATABASE, CREATE INDEX, CREATE OR REPLACE VIEW, CREATE TABLE, CREATE PROCEDURE, CREATE UNIQUE INDEX, CREATE VIEW, DATABASE, DEFAULT, DELETE, DESC, DISTINCT, DROP, DROP COLUMN, DROP CONSTRAINT, DROP DATABASE, DROP DEFAULT, DROP INDEX, DROP TABLE, DROP VIEW, EXEC, EXISTS, FOREIGN KEY, FROM, FULL OUTER JOIN, GROUP BY, HAVING, IN, INDEX, INNER JOIN, INSERT INTO, INSERT INTO SELECT, IS NULL, IS NOT NULL, JOIN, LEFT JOIN, LIKE, LIMIT, NOT, NOT NULL, OR, ORDER BY, OUTER JOIN, PRIMARY KEY, PROCEDURE, RIGHT JOIN, ROWNUM, SELECT, SELECT DISTINCT, SELECT INTO, SELECT TOP, SET, TABLE, TOP, TRUNCATE TABLE, UNION, UNION ALL, UNIQUE, UPDATE, VALUES, VIEW, WHERE`
        suggestions = suggestions.concat(list.split(', ')) 
        suggestions.sort()
        this.setState({autoCompleteSuggestions: suggestions})
    }

    handleClick(e){
        this.insertSuggestion(e.target.title)
        this.input.focus();
    }

    render() {
        var buttons = [];
        buttons.push(<button className={"klassementButton " + this.state.showTab[0]} key="DBinterface" onClick={this.showTab.bind(this, 0)}>DB interface</button>)
        buttons.push(<button className={"klassementButton " + this.state.showTab[1]} key="DBinfo" onClick={this.showTab.bind(this, 1)}>DB Info</button>)
        buttons.push(<button className={"klassementButton " + this.state.showTab[2]} key="manualupdate" onClick={this.showTab.bind(this, 2)}>Manual Update</button>)
        var popupDivs = []
        var popUpStyle = {top: this.state.popUpTop, left:this.state.popUpLeft,display: this.state.autoCompleteActive ? 'block' : 'none'}
        for(var i in this.state.currentSuggestions){
            if(i == this.state.selectedSuggestion){
                popupDivs.push(<div key={i} className="suggestion selectedSuggestion" title={i} onClick={(e) => {this.handleClick(e)}}>{this.state.currentSuggestions[i]}</div>)
            }else{
                popupDivs.push(<div key={i} className="suggestion " title={i} onClick={(e) => {this.handleClick(e)}}>{this.state.currentSuggestions[i]}</div>)
            }
        }
        var suggestionsPopUp = <div id="sugPopUp" style={popUpStyle}>{popupDivs}</div> 
        return (
            <div className="adminpageContainer" onClick={()=>{this.setState({autoCompleteActive:false})}}>
                <div style={{ display: 'flex' }}>
                    {buttons}
                </div>
                <div style={{ display: this.state.showTab[0] }}>
                    <form action="" onSubmit={this.submitQuery} id="queryform">
                    <div style={{position:'relative'}}>
                        <textarea ref="extraVars" className="queryInputBox" rows="5" cols="140" onKeyDown={this.keyPress}></textarea></div>
                        
                        <div style={{position:'relative'}}>
                            <textarea className="queryInputBox" rows="20" cols="140" value={this.state.value} onChange={(e) => {this.handleChange(e)}} onKeyDown={this.keyPress} ref={(input) => { this.input = input; }} />
                            {suggestionsPopUp}
                            </div>
                        <input type="submit" value="submit" />
                    </form>
                    <Outputtable output={this.state.output} />
                </div>
                <div style={{ display: this.state.showTab[1]}}>
                    {this.state.DBinfoTables}
                </div>
                <div style={{ display: this.state.showTab[2]}}>
                    <ManualUpdate />
                </div>
            </div> 
        )
    }
}

export default Admin