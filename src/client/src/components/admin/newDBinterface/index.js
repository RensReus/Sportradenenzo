import React, { Component } from 'react';
import axios from 'axios';



class NewDB extends Component {
  constructor(props) {
    super(props);
    this.copytonewdb = this.copytonewdb.bind(this);
    this.changecopytext = this.changecopytext.bind(this);
    document.title = "newdb";
    this.state = {
      copytext: ''
    }
  }

  changecopytext(event) {
    this.setState({
      copytext: event.target.value
    });
  }


  copytonewdb(e) {
    e.preventDefault();
    axios.post('/api/admin/copytonewdb', { tableName: this.state.copytext })
      .then((res) => {
        console.log('insert results',res.data)
      })
  }

  render() {
    return (
      <form className="row" action="" onSubmit={this.copytonewdb}>
        <div className="discription">copy </div>
        <input className={"inputfield "} id="gr" ref="gr" placeholder="tablename" value={this.state.copytext} onChange={this.changecopytext} />
        <button>Submit</button>
      </form>
    )
  }
}

export default NewDB