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
                if (property !== "rowClassName") {

                    var headerText = property;
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
        var rows = [];
        var row = [];
        for (var i = 0; i < data.length; i++) {
            var className = "";
            for (var property in data[i]) {
                if (property !== "rowClassName") {
                    row.push(<td key={i + property} >{data[i][property]}</td>);
                } else {
                    className = data[i][property];
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
            maxRows: Number.MAX_SAFE_INTEGER,
            title: '',
            colNames: [], // if not provided colNames will be taken from the data
            coltype: [], // only the name/type of the sortable colums need to be provided unsortable column is the default
            desc: [],
            displayCol: [], // colums to display default is all and not changable table
            classNames: '',
            scrollTabs: '',
            scrollShow: [],
        });
        this.onSort = this.onSort.bind(this);
        this.scrollClick = this.scrollClick.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (this.props !== prevProps) { // compares properties before and after update
            this.setState({
                data: this.props.data,
                title: this.props.title,
                colNames: this.props.colNames,
                displayCol: this.props.displayCol,
                classNames: this.props.classNames,
                maxRows: this.props.maxRows,
            })
            if(this.props.maxRows < this.props.data.length){ //if more rows than allows spread over multiple tabs
                var scrollCount = Math.ceil(this.props.data.length/this.props.maxRows);
                for(var i = 0; i < scrollCount; i++){
                    this.state.scrollShow[i]= !i ? 'block' : 'none'
                }
            }
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

    scrollClick(i,step){
        var scrollShow = this.state.scrollShow;
        var curr = scrollShow.indexOf('block');
        if(i<0){// i<0 betekent prev of next
            if(curr + step >= 0 && curr + step < scrollShow.length){ // not out of bounds
                i = curr + step;
            }else{
                return
            }
        }
        scrollShow[curr] = 'none';
        scrollShow[i] = 'block';
        this.setState({scrollShow: scrollShow});
    }


    render() { 
        var tables = []; 
        // var extraTabs = ""
        // if(this.state.title === 'Uitslag'){// checkt of er meerdere tabbladen zijn moet nog afgemaakt worden
        //     extraTabs = <div className="btn-group">
        //                     <button id="klassementknop0" className="klassementbutton selected" onClick="">Dag</button>
        //                     <button id="klassementknop1" className="klassementbutton" onClick="">AK</button>
        //                 </div>
        // }
        var scrollButtons = "";
        var scrollCount = 1;
        
        if(this.state.maxRows < this.state.data.length){ //if more rows than allows spread over multiple tabs
            scrollCount = Math.ceil(this.state.data.length/this.state.maxRows);
            var buttons = [];
            buttons.push(<button className="scrollButton" key="prev" onClick={this.scrollClick.bind(this,-1,-1)}>prev</button>)
            
            for(var i = 0; i < scrollCount; i++){//build tabs
                buttons.push(<button className="scrollButton" key={i} onClick={this.scrollClick.bind(this,i,0)} >{i+1}</button>)
                var begin = 20*i;
                var end = Math.min(20*(i+1),this.state.data.length)
                tables.push( <table key={i} className={this.state.classNames} style={{display: this.state.scrollShow[i] }}>
                            <caption>{this.state.title}</caption>
                            <Headers data={this.state.data} colNames={this.state.colNames} coltype={this.state.coltype} onSort={this.onSort} />
                            <Rows data={this.state.data.slice(begin,end)} />
                        </table>)

            }
            buttons.push(<button className="scrollButton" key="next" onClick={this.scrollClick.bind(this,-1,1)}>next</button>)

            scrollButtons = <div className="btn-group">
                                {buttons}
                            </div>
        }else{
           tables = <table className={this.state.classNames} style={{display: 'block'}}>
                    <caption>{this.state.title}</caption>
                    <Headers data={this.state.data} colNames={this.state.colNames} coltype={this.state.coltype} onSort={this.onSort} />
                    <Rows data={this.state.data} />
                </table>
        }
        return (
            <div>
                {/* {extraTabs} */}
                {scrollButtons}
                {tables}
            </div>

        )
    }

}

export default Table