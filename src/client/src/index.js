import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { Router } from 'react-router-dom';
import "./index.css";
import * as serviceWorker from './serviceWorker';

import createHistory from 'history/createBrowserHistory';
const history = createHistory();

ReactDOM.render(
  (
    <Router history={history}>
      <App history={history}/>
    </Router>
  ),
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();