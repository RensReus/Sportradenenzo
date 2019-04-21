import React, { Component } from 'react';
import './index.css';



class Headers extends Component {
    render() {
        var data = this.props.data;
        var coltype = this.props.coltype;
        var colNames = this.props.colNames;
        const headers = []
        if (data.length > 0) {
            const properties = Object.keys(data[0])
            properties.forEach(function (property) {
                if (property != "rowClassName") {

                    var headerText = property;
                    if (colNames != null && colNames[property] != null) {
                        headerText = colNames[property];
                    }
                    if (coltype != null && coltype[property] != null) {
                        headers.push(<th className="sortable" onClick={() => { this.props.onSort(property) }}>{headerText}</th>)
                    } else {
                        headers.push(<th>{headerText}</th>)
                    }
                }
            }, this)
        }
        return (
            <thead>
                <tr>
                    {headers}
                </tr>
            </thead>
        )
    }
}

class Rows extends Component {
    render() {
        var data = this.props.data;
        var rows = [];
        var row = [];
        for (var i = 0; i < data.length; i++) {
            var className = "";
            for (var property in data[i]) {
                if (property != "rowClassName") {
                    row.push(<td>{data[i][property]}</td>);
                } else {
                    className = data[i][property];
                }
            }

            rows.push(<tr className={className}>{row}</tr>)


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
            title: '',
            colNames: [], // if not provided colNames will be taken from the data
            coltype: [], // only the name/type of the sortable colums need to be provided unsortable column is the default
            desc: [],
            displayCol: [], // colums to display default is all and not changable table
            classNames: '',
        });
        this.onSort = this.onSort.bind(this);
    }

    componentDidUpdate(prevProps) {

        if (this.props !== prevProps) {
            this.setState({
                data: this.props.data,
                title: this.props.title,
                colNames: this.props.colNames,
                displayCol: this.props.displayCol,
                classNames: this.props.classNames
            })
            if (this.props.coltype != null) {
                this.setState({
                    coltype: JSON.parse(JSON.stringify(this.props.coltype)),// de double JSON is omdat deze anders verwijzen naar hetzelfde object dit is een soort copy
                    desc: JSON.parse(JSON.stringify(this.props.coltype))// string default sort asc, numbers sort default desc
                })
            }
        }
    }

    onSort(sortKey) {
        var data = this.state.data;
        var coltype = this.state.coltype;
        var desc = this.state.desc;
        if (coltype[sortKey] && desc[sortKey]) {// number & desc
            data.sort((a, b) => parseFloat(a[sortKey]) < parseFloat(b[sortKey]))
        }
        if (coltype[sortKey] && !desc[sortKey]) {// number & asc
            data.sort((b, a) => parseFloat(a[sortKey]) < parseFloat(b[sortKey]))
        }
        if (!coltype[sortKey] && desc[sortKey]) {// string & desc
            data.sort((b, a) => a[sortKey].localeCompare(b[sortKey]))
        }
        if (!coltype[sortKey] && !desc[sortKey]) {// string & asc
            data.sort((a, b) => a[sortKey].localeCompare(b[sortKey]))
        }
        desc[sortKey] = !desc[sortKey];

        this.setState({
            data: data,
            desc: desc
        })
    }

    render() {
        console.log("title", this.state.data)
        return (
            <table className={this.state.classNames}>
                <caption>{this.state.title}</caption>
                <Headers data={this.state.data} colNames={this.state.colNames} coltype={this.state.coltype} onSort={this.onSort} />
                <Rows data={this.state.data} />
            </table>

        )
    }

}

export default Table