import React, { Component } from 'react';
import { Route, Redirect } from 'react-router-dom';
import './index.css';
import axios from 'axios';

import { PrivateRoute, AdminRoute } from './PrivateRoute'

import Navbar from './components/navbar';

import LogInSignUp from './components/LogInSignUp';
import Home from './components/home';
import Stage from './components/stage'
import Teamselection from './components/teamselection';
import Admin from './components/admin';
import Overzicht from './components/overzicht';
import Charts from './components/charts';
import Rider from './components/rider';
import Rulesandpoints from './components/rulesandpoints';
import Profile from './components/profile'

//Import de standaard css stukken
import './components/css/buttons.css'
import './components/css/colours.css'
import './components/css/fonts.css'
import './components/css/tables.css'

const jwtDecode = require('jwt-decode');

axios.interceptors.request.use( 
  reqConfig => {    
    reqConfig.headers.authorization = localStorage.getItem('authtoken');
    return reqConfig;
}, (error) => {
  switch (error.response.status) {
       case 400:
            console.log('Bad request');
            break;
       default:
  }
return Promise.reject(error);
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      loading: true,
      isLoggedIn: false,
      redirect: '/',
      isAdmin: false,
      racename: '',
      year: ''
    });
    this.setRace = this.setRace.bind(this);

  }

  componentDidMount() {
    axios.post('/api/getinitialdata')
      .then(res => {
        this.setState({ redirect: res.data.redirect, racename: res.data.racename, year: res.data.year})
      })
    this.authenticate()
  }

  componentDidUpdate() {
    this.authenticate()
  }

  authenticate() {
    if (localStorage.getItem('authToken')) {
      var token = localStorage.getItem('authToken')
      var decoded = jwtDecode(token)
      if (Date.now() / 1000 - decoded.exp > 0) {//token expired
        localStorage.removeItem('authToken');
        this.props.history.push('/')
        this.setState({
          isLoggedIn: false,
          isAdmin: false
        })
      } else if (!this.state.isLoggedIn) { //Token bestaat, state moet ingelogd zijn
        this.setState({
          isLoggedIn: true,
          isAdmin: decoded.admin
        })
      }
    } else {
      if (this.state.isLoggedIn) { //Token bestaat niet, state moet uitgelogd en adminloos zijn
        this.setState({
          isLoggedIn: false,
          isAdmin: false
        }, () => {
          //Redirect als uitgelogd en niet op de main pagina
          if (this.props.history.location.pathname !== '/') {
            this.setState({
              redirect: this.props.history.location.pathname // voor redirect na inloggen
            })
            this.props.history.replace('/')
          }
        })
      }
    }
  }

  setRace(racename){
    if(this.state.racename !== racename){
      this.setState({
        racename,
      })
    }
  }

  render() {
    return (
      // de switch en redirect zorgen ervoor dat 404 errors niet meer voorkomen 
      //maar maken admin en manual update onbereikbaar wss vanwege de admin check
      <div className="content">
        <div className="backgroundImage"></div>
        <Navbar isLoggedIn={this.state.isLoggedIn} isAdmin={this.state.isAdmin} history={this.props.history} racename={this.state.racename}/>
        <div className="pageContainer">
          <Route exact path="/" render={() => (
            this.state.isLoggedIn ? (<Redirect to={this.state.redirect} />) : (<LogInSignUp history={this.props.history} Signup = {false} />)
          )} />
           <Route exact path="/signup" render={() => (
            this.state.isLoggedIn ? (<Redirect to={this.state.redirect} />) : (<LogInSignUp history={this.props.history} Signup = {true} />)
          )} />
          <PrivateRoute path="/home" component={Home} history={this.props.history} />
          <PrivateRoute exact path="/stage/:stagenumber" component={Stage} history={this.props.history} racename={this.state.racename} year={this.state.year}/>
          <PrivateRoute path="/teamselection" component={Teamselection} history={this.props.history} redirect={this.state.redirect} racename={this.state.racename} year={this.state.year}/>
          <AdminRoute path="/admin-:subpage" component={Admin} history={this.props.history} />
          <PrivateRoute path="/rulesandpoints" component={Rulesandpoints} history={this.props.history} />
          <PrivateRoute path="/overzicht/:selection" component={Overzicht} history={this.props.history} racename={this.state.racename} year={this.state.year} redirect={this.state.redirect}/>
          <PrivateRoute path="/profile/:account_id" component={Profile} history={this.props.history} />
          <PrivateRoute path="/rider/:rider_participation_id" component={Rider} history={this.props.history} /> {/* TODO per rider_id en dan verschillende participations tonen */}
          <PrivateRoute path="/charts/:chartname" component={Charts} history={this.props.history} racename={this.state.racename} year={this.state.year}/>
          
          {/* alle paginas voor vorige races */}
          <PrivateRoute exact path="/:racename-:year/stage/:stagenumber" component={Stage} history={this.props.history} setRace={this.setRace} />
          <PrivateRoute path="/:racename-:year/overzicht/:selection" component={Overzicht} history={this.props.history} setRace={this.setRace} />
          <PrivateRoute path="/:racename-:year/charts/:chartname" component={Charts} history={this.props.history} setRace={this.setRace} />
        </div>
      </div>
    );
  }
}

export default App;