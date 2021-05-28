import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FlagIcon from '../flagIcon'
import './index.css';

class Headers extends Component {
  render() {
    var data = this.props.data;
    var displayCols = this.props.displayCols;
    var coltype = this.props.coltype;
    var colNames = this.props.colNames;
    const headers = []
    if (data.length > 0) {
      const properties = Object.keys(data[0])
      properties.forEach(function (property) {
        if (property !== "rowClassName" && !property.endsWith("_link") && (displayCols == null || displayCols[property])) {
          var headerText = property;
          if (property === 'country') headerText = '';
          if (colNames != null && colNames[property] != null) {
            headerText = colNames[property];
          }
          if (coltype != null && coltype[property] != null) {
            headers.push(<th className="sortable" key={property} onClick={() => { this.props.onSort(property) }}>{headerText}</th>)
          } else {
            headers.push(<th key={property}>{headerText}</th>)
          }
        }
      }, this)
    }
    return (
      <thead>
        <tr key="headers">
          {headers}
        </tr>
      </thead>
    )
  }
}

class Rows extends Component {
  render() {
    var data = this.props.data;
    var displayCols = this.props.displayCols;
    var rows = [];
    var row = [];
    for (var i = 0; i < data.length; i++) {
      var className = "";
      var link = "";
      for (var property in data[i]) {
        if (displayCols != null && !displayCols[property]) continue;
        if (property.endsWith("_link")) {//if link store for next column
          link = data[i][property];
          continue;
        }
        var tdContent = data[i][property];
        if (link !== "") {//if stored link use to build this column
          tdContent = <Link className="tableLink" to={link}>{tdContent}</Link>
          link = "";//reset link
        }
        if (property === "rowClassName") {
          className = data[i][property];
        } else if (property === "country") {
          row.push(<td key={i + "flag"}><FlagIcon code={tdContent} /></td>);
        } else {
          var tdClassname = property;
          if (tdClassname === ' ') tdClassname = 'rank'
          if (tdClassname === '  ' && tdContent !== undefined && tdContent.length) tdClassname = 'change' + tdContent[0];
          if (typeof tdContent === "number") tdContent = tdContent.toLocaleString('nl', { useGrouping: true });
          row.push(<td key={i + property} className={tdClassname}>{tdContent}</td>);
        }
      }
      rows.push(<tr className={className} key={i}>{row}</tr>)
      row = []
    }
    return (
      <tbody>
        {rows}
      </tbody>
    )
  }
}
class Table extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      data: [],//required the rest of the parameter are optional
      coltype: [], // only the name/type of the sortable colums need to be provided unsortable column is the default
      displayCols: null, // only the hidden cols need to be passed as an argument
      desc: [],
      classNames: '',
      scrollShow: [],
    });
    this.onSort = this.onSort.bind(this);
    this.scrollClick = this.scrollClick.bind(this);
    this.buildColSelector = this.buildColSelector.bind(this);
  }
  componentDidMount() {
    this.initialSetState();
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) { // compares properties before and after update
      this.initialSetState();
    }
  }

  initialSetState() {
    this.buildColSelector();
    this.setState({
      data: this.props.data,
      classNames: this.props.classNames,
    })
    var scrollShow = this.state.scrollShow;
    if (this.props.maxRows < this.props.data.length) { //if more rows than allowed spread over multiple tabs
      var scrollCount = Math.ceil(this.props.data.length / this.props.maxRows);
      for (var i = 0; i < scrollCount; i++) {
        scrollShow[i] = !i ? 'table' : 'none'
      }
    }
    if (this.props.coltype != null) {
      this.setState({
        coltype: JSON.parse(JSON.stringify(this.props.coltype)),// de double JSON is omdat deze anders verwijzen naar hetzelfde object dit is een soort copy
        desc: JSON.parse(JSON.stringify(this.props.coltype)),// string default sort asc, numbers sort default desc
        scrollShow,
      })
    }
  }

  buildColSelector() {
    var displayCols = null;
    if (this.props.hiddenCols != null) {
      displayCols = {};
      const columns = Object.keys(this.props.data[0])
      columns.forEach(function (column) {
        if (column !== "rowClassName" && !column.endsWith("_link")) {
          if (this.props.hiddenCols.includes(column)) {
            displayCols[column] = false;
          } else {
            displayCols[column] = true;
          }
        }
      }, this)
    }

    this.setState({
      displayCols
    })
  }

  toggleColumn(columnName) {
    var displayCols = this.state.displayCols;
    displayCols[columnName] = !displayCols[columnName];
    this.setState({
      displayCols
    })
  }

  onSort(sortKey) {
    var data = this.state.data;
    var coltype = this.state.coltype;
    var desc = this.state.desc;
    if (coltype[sortKey] && desc[sortKey]) {// number & desc
      data.sort((b, a) => {
        if (!b[sortKey]) {
          return 1;
        } else if (!a[sortKey]) {
          return - 1;
        } else {
          return parseFloat(a[sortKey]) - parseFloat(b[sortKey]);
        }
      })
    }
    if (coltype[sortKey] && !desc[sortKey]) {// number & asc
      data.sort((a, b) => {
        if (!b[sortKey]) {
          return 1;
        } else if (!a[sortKey]) {
          return - 1;
        } else {
          return parseFloat(a[sortKey]) - parseFloat(b[sortKey]);
        }
      })
    }
    if (!coltype[sortKey] && desc[sortKey]) {// string & desc
      data.sort((b, a) => a[sortKey].localeCompare(b[sortKey]))
    }
    if (!coltype[sortKey] && !desc[sortKey]) {// string & asc
      data.sort((a, b) => a[sortKey].localeCompare(b[sortKey]))
    }
    desc[sortKey] = !desc[sortKey];

    this.setState({
      data,
      desc
    })
  }

  scrollClick(i, step) {
    var scrollShow = this.state.scrollShow;
    var curr = scrollShow.indexOf('table');
    if (i < 0) {// i<0 betekent prev of next
      if (curr + step >= 0 && curr + step < scrollShow.length) { // not out of bounds
        i = curr + step;
      } else {
        return
      }
    }
    scrollShow[curr] = 'none';
    scrollShow[i] = 'table';
    this.setState({ scrollShow: scrollShow });
  }


  render() {
    var tables = [];
    var scrollButtons = "";
    var scrollCount = 1;
    var columnSelector = "";
    if (this.state.displayCols != null) {
      var checkboxes = [];
      for (var name in this.state.displayCols) {
        var newBox = <div className="toggleDiv">
          <input type="checkbox" id={name} name={name} checked={this.state.displayCols[name]} onClick={(e) => this.toggleColumn(e.target.name)} />
          <label className="toggleColLabel" for={name}>{name}</label>
        </div>
        checkboxes.push(newBox)
      }
      columnSelector = <div className="toggleColumsDiv"> {checkboxes} </div>
    }
    if (this.props.maxRows < this.state.data.length) { //if more rows than allows spread over multiple tabs
      scrollCount = Math.ceil(this.state.data.length / this.props.maxRows);
      var buttons = [];
      buttons.push(<button className="scrollButton" key="prev" onClick={this.scrollClick.bind(this, -1, -1)}>prev</button>)

      for (var i = 0; i < scrollCount; i++) {//build tabs
        var classNames = "scrollButton " + this.state.scrollShow[i];
        buttons.push(<button className={classNames} key={i} onClick={this.scrollClick.bind(this, i, 0)} >{i + 1}</button>)
        var begin = this.props.maxRows * i;
        var end = Math.min(this.props.maxRows * (i + 1), this.state.data.length)
        tables.push(<table key={i} className={this.state.classNames} style={{ display: this.state.scrollShow[i] }}>
          <caption>{this.props.title}</caption>
          <Headers data={this.state.data} colNames={this.props.colNames} coltype={this.state.coltype} onSort={this.onSort} />
          <Rows data={this.state.data.slice(begin, end)} />
        </table>)

      }
      buttons.push(<button className="scrollButton" key="next" onClick={this.scrollClick.bind(this, -1, 1)}>next</button>)

      scrollButtons = <div className="btn-group">
        {buttons}
      </div>
    } else {
      tables = <table className={this.state.classNames} style={{ display: 'table' }}>
        <caption>{this.props.title}</caption>
        <Headers data={this.state.data} colNames={this.props.colNames} coltype={this.state.coltype} onSort={this.onSort} displayCols={this.state.displayCols} />
        <Rows data={this.state.data} displayCols={this.state.displayCols} />
      </table>
    }
    return (
      <div className="tableContainer">
        {scrollButtons}
        {columnSelector}
        {tables}
      </div>

    )
  }

}

export default Table