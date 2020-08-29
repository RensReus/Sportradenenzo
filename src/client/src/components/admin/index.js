import React, { Component } from 'react';
import './index.css';
import axios from 'axios';
import ManualUpdate from './manualupdate'
import ImportExport from './importExport'
import Table from '../shared/table'
import LoadingDiv from '../shared/loadingDiv'
// var getCaretCoordinates = require('textarea-caret');

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
        for (i = 0; i < Math.min(output.length, 200); i++) {
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
      varRows: [],
      showTab: ['block', 'none', 'none', 'none'],
      DBinfoTables: [],
      autoCompleteSuggestions: [],
      autoCompleteActive: false,
      currentSuggestions: '',
      selectedSuggestion: 0,
      popUpTop: 0,
      popUpLeft: 0,
      cursorPos: 0,
      errorData: [],
      loadingDBinfo: false,
    });
    this.submitQuery = this.submitQuery.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.keyPress = this.keyPress.bind(this);
    this.showTab = this.showTab.bind(this);
    this.getDBinfo = this.getDBinfo.bind(this);
    this.setSuggestions = this.setSuggestions.bind(this);
  }

  componentDidMount() {
    this.input.focus();
    document.title = "Admin";
    this.setSuggestions();
    switch (this.props.match.params.subpage) {
      case "sqlinterface": this.showTab(0); break;
      case "dbinfo": this.showTab(1); break;
      case "manualupdate": this.showTab(2); break;
      case "importexport": this.showTab(3); break;
      default: this.showTab(0);
    }
  }


  submitQuery = (e) => {
    e.preventDefault();
    var varObject = {};
    var variables = this.refs.extraVars.value.split("var ");
    for (var i in variables) {
      if (variables[i].length) {
        var equalsPos = variables[i].indexOf('=');
        var varName = variables[i].substring(0, equalsPos - 1);
        var varContent = variables[i].substring(equalsPos + 3, variables[i].lastIndexOf('`'))
        varObject[varName] = varContent;
      }
    }
    console.log(variables)
    var query = this.state.value;
    i = 0;
    while (query.indexOf('$') + 1) {
      i++;
      var start = query.indexOf('$');
      var end = query.indexOf('}') + 1;
      var toreplace = query.substring(start, end);
      varName = toreplace.substring(2, toreplace.length - 1)
      query = query.replace(toreplace, varObject[varName])
      if (i > 200) break;
    }
    axios.post('/api/admin/query', { query })
      .then((res) => {
        var errorData = '';
        if (res.data.errorBool) {
          var errorRow = { ' ': 'Error:', "  ": res.data.error }
          var hintRow = { ' ': 'Hint:', "  ": res.data.data.hint }
          errorData = [errorRow, hintRow];
          this.setState({ errorData })
        }
        this.setState({
          errorData,
          output: res.data.data
        })
      })
  }
  handleChange(e) {
    var deletion = false
    if (e.target.value.length < this.state.value.length) {
      deletion = true
    }
    this.setState({ value: e.target.value }, () => {
      // var caret = getCaretCoordinates(document.activeElement, document.activeElement.selectionEnd);
      var cursorPos = document.activeElement.selectionStart;
      // popUpTop: caret.top + caret.height, popUpLeft:caret.left,
      this.setState({cursorPos})
      var startindex = -1;
      for (var i = cursorPos - 1; i > -1; i--) {
        if ([' ', '\n', '\t', '(', ')', '"', '{', '}', '.', ','].includes(this.state.value.charAt(i))) {
          startindex = i;
          break;
        }
      }
      var lastTyped = this.state.value[cursorPos - 1];
      if (!deletion) {
        if (['(', '{'].includes(lastTyped)) {
          this.insertClosing(cursorPos, lastTyped);
        }
      }
      var currWord = this.state.value.substring(startindex + 1, cursorPos);
      if (currWord.length > 0) {// minstens 1 char
        var sug = this.state.autoCompleteSuggestions;
        var currentSuggestions = sug.filter(function (word) {
          var regex = ''
          for (var i = 0; i < currWord.length; i++) {
            regex += '[' + currWord.charAt(i) + ']\\w*'
          }
          return word.search(new RegExp(regex, 'i')) !== -1
        })
        currentSuggestions.sort(function (a, b) {
          for (var i = 0; i < currWord.length; i++) {
            var aEq = a.toLowerCase().charAt(i) === currWord.toLowerCase().charAt(i)
            var bEq = b.toLowerCase().charAt(i) === currWord.toLowerCase().charAt(i)
            if (aEq && !bEq) return -1;
            if (!aEq && bEq) return 1;
          }
          return a.length - b.length;
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
      this.setState({ autoCompleteActive: false })
    } else {
      //disable autosuggest popup keys
      var disableKeyCodes = [37, 39, 27, 32, 8];//left, right, esc, space, backspace
      var i = this.state.selectedSuggestion;
      var len = this.state.currentSuggestions.length;
      if (this.state.autoCompleteActive) {//popupzichtbaar
        if (e.keyCode === 9 || e.keyCode === 10 || e.keyCode === 13) {
          e.preventDefault();
          this.insertSuggestion(i)
        }
        if (e.keyCode === 38) {//up
          e.preventDefault();
          this.setState({ selectedSuggestion: (i - 1 + len) % len })
        }
        if (e.keyCode === 40) {//down
          e.preventDefault();
          this.setState({ selectedSuggestion: (i + 1) % len })
        }
        if (disableKeyCodes.includes(e.keyCode)) {
          this.setState({ autoCompleteActive: false })
        }
      }
      var cursorPos = document.activeElement.selectionStart;
      this.setState({ cursorPos })
    }
  }

  insertSuggestion(selection) {
    var cursorPos = this.state.cursorPos;
    var startindex = -1;
    for (var i = cursorPos - 1; i > -1; i--) {
      if ([' ', '\n', '\t', '(', ')', '"', '{', '}', '.', ','].includes(this.state.value.charAt(i))) {
        startindex = i;
        break;
      }
    }
    var toInsert = this.state.currentSuggestions[selection] + " ";
    var newValue = this.state.value.substring(0, startindex + 1) + toInsert + this.state.value.substring(cursorPos)
    this.setSuggestions();
    this.setState({
      value: newValue,
      currentSuggestions: [],
      selectedSuggestion: 0,
      autoCompleteActive: false,
    }, () => {
      document.activeElement.setSelectionRange(startindex + toInsert.length + 1, startindex + toInsert.length + 1)
    })
  }

  insertClosing(cursorPos, bracket) {
    var toInsert = '';
    switch (bracket) {
      case '{': toInsert = '}'
        break;
      case '(': toInsert = ')'
        break;
      default:
        break;
    }
    var newValue = this.state.value.substring(0, cursorPos) + toInsert + this.state.value.substring(cursorPos)
    this.setState({
      value: newValue,
    }, () => {
      document.activeElement.setSelectionRange(cursorPos, cursorPos)
    })
  }

  showTab(i) {
    switch (i) {
      case 0: this.props.history.push('/admin-sqlinterface'); break;
      case 1: this.props.history.push('/admin-dbinfo'); this.getDBinfo(); break;
      case 2: this.props.history.push('/admin-manualupdate'); break;
      case 3: this.props.history.push('/admin-importexport'); break;
      default: this.props.history.push('/admin-sqlinterface'); break;
    }
    var showTab = this.state.showTab;
    var curr = showTab.indexOf('block');
    showTab[curr] = 'none';
    showTab[i] = 'block';
    this.setState({ showTab: showTab });
  }

  getDBinfo() {
    this.setState({
      loadingDBinfo: true
    })
    axios.post('/api/admin/getdbinfo')
      .then((res) => {
        var DBinfoTables = []
        for (var i in res.data.tables) {
          DBinfoTables.push(<div className="tableDiv" key={res.data.titles[i]} ><Table data={res.data.tables[i].rows} title={res.data.titles[i]} /></div>)
        }
        this.setState({
          DBinfoTables,
          loadingDBinfo: false,
        })
      })
  }

  setSuggestions() {
    //Table names
    var suggestions = ['account', 'race', 'stage', 'account_participation', 'rider', 'rider_participation', 'team_selection_rider', 'stage_selection', 'stage_selection_rider', 'results_points']
    //Table IDs
    suggestions = suggestions.concat(['account_id', 'race_id', 'stage_id', 'account_participation_id', 'rider_id', 'rider_participation_id', 'stage_selection_id'])
    // SQL COMMANDS
    var list = `AND, ANY, AVG, ARRAY_AGG, BETWEEN, COUNT, CASE, DISTINCT, DESC, DELETE, FROM, GROUP BY, HAVING, INNER JOIN, INSERT INTO, IS NULL, JOIN, LIMIT, MAX, MIN, NOT, SELECT, SUM, USING, UNION, UPDATE, VALUES, WHERE, AS, ADD, ADD CONSTRAINT, ALTER, ALTER COLUMN, ALTER TABLE, ALL, ASC, BACKUP DATABASE, CHECK, COLUMN, CONSTRAINT, CREATE, CREATE DATABASE, CREATE INDEX, CREATE OR REPLACE VIEW, CREATE TABLE, CREATE PROCEDURE, CREATE UNIQUE INDEX, CREATE VIEW, DATABASE, DEFAULT, DROP, DROP COLUMN, DROP CONSTRAINT, DROP DATABASE, DROP DEFAULT, DROP INDEX, DROP TABLE, DROP VIEW, EXEC, EXISTS, FOREIGN KEY, FULL OUTER JOIN, IN, INDEX, INSERT INTO SELECT, IS NOT NULL, LEFT JOIN, LIKE, NOT NULL, OR, ORDER BY, OUTER JOIN, PRIMARY KEY, PROCEDURE, RIGHT JOIN, ROWNUM, SELECT DISTINCT, SELECT INTO, SELECT TOP, SET, TABLE, TOP, TRUNCATE TABLE, UNION ALL, UNIQUE, VIEW`;
    suggestions = suggestions.concat(list.split(', '))
    //Table column names
    suggestions = suggestions.concat(['budgetparticipation', 'finished', 'finalscore', 'pcs_id', 'stagenr', 'starttime', 'complete', 'username', 'email', 'admin', 'price', 'dnf', 'team', 'stagescore', 'totalscore', 'kopman_id', 'stagepos', 'gcpos', 'pointspos', 'kompos', 'yocpos', 'stagescore', 'gcscore', 'pointsscore', 'komscore', 'yocscore', 'teamscore', 'stageresult', 'gcresult', 'pointsresult', 'komresult', 'yocresult', 'firstname', 'lastname', 'initials', 'country'])
    // Extra
    suggestions = suggestions.concat(['false', 'true'])

    this.setState({ autoCompleteSuggestions: suggestions })
  }

  handleClick(e) {
    this.insertSuggestion(e.target.title)
    this.input.focus();
  }

  render() {
    var buttons = [];
    buttons.push(<button className={"klassementButton " + this.state.showTab[0]} key="DBinterface" onClick={this.showTab.bind(this, 0)}>DB interface</button>)
    buttons.push(<button className={"klassementButton " + this.state.showTab[1]} key="DBinfo" onClick={this.showTab.bind(this, 1)}>DB Info</button>)
    buttons.push(<button className={"klassementButton " + this.state.showTab[2]} key="manualupdate" onClick={this.showTab.bind(this, 2)}>Manual Update</button>)
    buttons.push(<button className={"klassementButton " + this.state.showTab[3]} key="imexport" onClick={this.showTab.bind(this, 3)}>Import/Export</button>)
    var popupDivs = []
    var popUpStyle = { top: this.state.popUpTop, left: this.state.popUpLeft, display: this.state.autoCompleteActive ? 'block' : 'none' }
    for (var i in this.state.currentSuggestions) {
      if (i === this.state.selectedSuggestion.toString()) {
        popupDivs.push(<div key={i} className="suggestion selectedSuggestion" title={i} onClick={(e) => { this.handleClick(e) }}>{this.state.currentSuggestions[i]}</div>)
      } else {
        popupDivs.push(<div key={i} className="suggestion " title={i} onClick={(e) => { this.handleClick(e) }}>{this.state.currentSuggestions[i]}</div>)
      }
    }
    var suggestionsPopUp = <div id="sugPopUp" style={popUpStyle}>{popupDivs}</div>
    return (
      <div className="adminpageContainer" onClick={() => { this.setState({ autoCompleteActive: false }) }}>
        <div style={{ display: 'flex' }}>
          {buttons}
        </div>
        <div style={{ display: this.state.showTab[0] }}>
          <form action="" onSubmit={this.submitQuery} id="queryform">
            <div style={{ position: 'relative' }}>
              <textarea ref="extraVars" className="queryInputBox" rows="5" cols="130" onKeyDown={this.keyPress}></textarea></div>

            <div style={{ position: 'relative' }}>
              <textarea className="queryInputBox" rows="20" cols="130" value={this.state.value} onChange={(e) => { this.handleChange(e) }} onKeyDown={this.keyPress} ref={(input) => { this.input = input; }} />
              {suggestionsPopUp}
            </div>
            <input type="submit" value="submit" />
          </form>
          <Table data={this.state.errorData} />
          <Outputtable output={this.state.output} />
        </div>
        <div style={{ display: this.state.showTab[1], position: 'relative' }}>
          {this.state.DBinfoTables}
          <LoadingDiv loading={this.state.loadingDBinfo} />
        </div>
        <div style={{ display: this.state.showTab[2] }}>
          <ManualUpdate />
        </div>
        <div style={{ display: this.state.showTab[3] }}>
          <ImportExport />
        </div>
      </div>
    )
  }
}

export default Admin