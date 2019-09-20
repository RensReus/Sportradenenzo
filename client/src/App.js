import React, { Component } from 'react';
import { Route, Redirect } from 'react-router-dom';
import './index.css';
import axios from 'axios';

import { ReactRoute, AdminRoute } from './PrivateRoute'

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
        this.setState({ redirect: res.data.redirect, racename: res.data.racename, year: res.data.year })
      })
    //Start de response interceptor
    createAxiosResponseInterceptor();
    //Bind de huidige this voor gebruik in de interceptors
    const self = this;
    //De request interceptor voegt aan elke response naar de server de authtoken toe aan de request header
    axios.interceptors.request.use(
      reqConfig => {
        console.log(reqConfig)
        if (localStorage.getItem('authToken')) {
          //Voeg token toe aan de req headers
          reqConfig.headers.authorization = localStorage.getItem('authToken');
        } else {
          reqConfig.headers.authorization = null;
        }
        console.log(reqConfig.url)
        return reqConfig;
      }, (error) => {
        switch (error.response.status) {
          case 400:
            console.log('Bad request');
            break;
          default:
            console.log("Reqerror")
            console.log(error)
            break;
        }
        return Promise.reject(error);
      }
    );
    //Maak een function van de response interceptor zodat deze uitgeschakeld kan worden      
    function createAxiosResponseInterceptor() {
      const interceptor = axios.interceptors.response.use(
        response => {
          console.log(response)
          if (response.headers.authorization) { //Als geen token maar geen 401, dan server side uitzondering, verder niks mee doen
            var decoded = jwtDecode(response.headers.authorization)
            if (!self.state.isLoggedIn) {
              self.setState({
                isLoggedIn: true,
                isAdmin: decoded.admin
              });
            }
          }
          return response
        }, (error) => {
          switch (error.response.status) {
            case 401: //Geen token gevonden
              console.log('Not authorized');
              if (self.state.isLoggedIn) {
                self.setState({
                  isLoggedIn: false,
                  isAdmin: false
                })
                //Redirect als uitgelogd en niet op de main pagina
                if (self.props.history.location.pathname !== '/') {
                  self.setState({
                    redirect: self.props.history.location.pathname // voor redirect na inloggen
                  })
                  self.props.history.replace('/')
                }
              }
              break;
            case 498: //Refresh token aangemaakt, stuur request opnieuw
              return new Promise((resolve) => {
                //Eject de interceptor voor de retry om loop te voorkomen
                axios.interceptors.response.eject(interceptor);
                //Sla de teruggestuurde token op in de local storage
                localStorage.setItem('authToken', error.response.headers.authorization)
                //Voeg de token toe aan de headers
                error.config.headers.authorization = error.response.headers.authorization;
                //Retry de request
                axios(error.config).then(resolve);
                //Reinstate interceptor
                createAxiosResponseInterceptor();
              })
            default:
              console.log("Unknown response error")
              console.log(error)
              break;
          }
          return Promise.reject(error);
        }
      );
    }
  }

  setRace(racename) {
    if (this.state.racename !== racename) {
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
        <Navbar isLoggedIn={this.state.isLoggedIn} isAdmin={this.state.isAdmin} history={this.props.history} racename={this.state.racename} />
        <div className="pageContainer">
          <Route exact path="/" render={() => (
            this.state.isLoggedIn ? (<Redirect to={this.state.redirect} />) : (<LogInSignUp history={this.props.history} Signup={false} />)
          )} />
          <Route exact path="/signup" render={() => (
            this.state.isLoggedIn ? (<Redirect to={this.state.redirect} />) : (<LogInSignUp history={this.props.history} Signup={true} />)
          )} />
          <ReactRoute path="/home" component={Home} history={this.props.history} />
          <ReactRoute exact path="/stage/:stagenumber" component={Stage} history={this.props.history} racename={this.state.racename} year={this.state.year} />
          <ReactRoute path="/teamselection" component={Teamselection} history={this.props.history} redirect={this.state.redirect} racename={this.state.racename} year={this.state.year} />
          <AdminRoute path="/admin-:subpage" component={Admin} history={this.props.history} />
          <ReactRoute path="/rulesandpoints" component={Rulesandpoints} history={this.props.history} />
          <ReactRoute path="/overzicht/:selection" component={Overzicht} history={this.props.history} racename={this.state.racename} year={this.state.year} redirect={this.state.redirect} />
          <ReactRoute path="/profile/:account_id" component={Profile} history={this.props.history} />
          <ReactRoute path="/rider/:rider_participation_id" component={Rider} history={this.props.history} /> {/* TODO per rider_id en dan verschillende participations tonen, pas als vorige races in de DB staan */}
          <ReactRoute path="/charts/:chartname" component={Charts} history={this.props.history} racename={this.state.racename} year={this.state.year} />

          {/* alle paginas voor vorige races */}
          <ReactRoute exact path="/:racename-:year/stage/:stagenumber" component={Stage} history={this.props.history} setRace={this.setRace} />
          <ReactRoute path="/:racename-:year/overzicht/:selection" component={Overzicht} history={this.props.history} setRace={this.setRace} />
          <ReactRoute path="/:racename-:year/charts/:chartname" component={Charts} history={this.props.history} setRace={this.setRace} />
        </div>
      </div>
    );
  }
}

export default App;