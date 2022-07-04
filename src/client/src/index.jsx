import { createRoot } from "react-dom/client";
import App from "./App";
import { Router } from 'react-router-dom';
import "./index.css";
import * as serviceWorker from './serviceWorker';
import store from './store'
import { Provider } from 'react-redux'

const createHistory = require("history").createBrowserHistory;
const history = createHistory();
const root = createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <Router history={history}>
      <App history={history} />
    </Router>
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();