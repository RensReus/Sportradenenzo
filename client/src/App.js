import React, { Component } from 'react';
import { Route, Redirect } from 'react-router-dom';
import './index.css';
import axios from 'axios';

import Navbar from './components/navbar';

import Home from './components/home';
import Profile from './components/profile';
import Teamselection from './components/teamselection';
import Admin from './components/admin'

class App extends Component {
  constructor(props){
    super(props);
    this.state = ({isLoggedIn: false});
  }
  componentDidMount() {

  }
  render(){
    //Kijk of de gebruiker is ingelogd bij elke update van de pagina
    axios.post('api/isloggedin', {withCredentials: true}) //to: authentication.js
    .then((res) => {
      if(this.state.isLoggedIn !== res.data){ //Als er verandering is moet de state worden aangepast
        this.setState({isLoggedIn: res.data}); //true of false
      }
      if(!this.state.isLoggedIn && this.props.history.location.pathname !== '/'){ //Als er niet is ingelogd en de gebruiker is niet op de loginpagina -> redirect
        this.props.history.replace('/');
      }
    })
    .catch(function (error) {
        throw error
    });
    return(
      <div className="content">
        <div className="backgroundImage"></div>
        <Navbar isLoggedIn={this.state.isLoggedIn} />
        <div className="pageContainer">
          <Route exact path="/" render={() => (
            this.state.isLoggedIn ? (<Redirect to="/teamselection"/>) : (<Home history={this.props.history}/>)
          )}/>
          <Route path="/profile" component={Profile} history={this.props.history}/>
          <Route path="/teamselection" component={Teamselection} history={this.props.history}/>
          <Route path="/admin" component={Admin} history={this.props.history}/>
        </div>
      </div>
    );
  }
}

export default App;