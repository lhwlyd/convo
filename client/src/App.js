// /client/App.js
import React, { Component } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import ThreeContainer from "./ThreeContainer";
import Navbar from "./components/layout/Navbar";
import Landing from "./components/layout/Landing";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";

import { Provider } from "react-redux";
import store from "./store";

class App extends Component {
  // here is our UI
  // it is easy to understand their functions when you
  // see them render into our screen
  render() {
    return (
      <Provider store={store}>
        <Router>
          <div className="App">
            <Navbar />
            <Route exact path="/" component={Landing} />
            <Route exact path="/register" component={Register} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/three" componenet={ThreeContainer} />
          </div>
        </Router>
      </Provider>
    );
  }
}

export default App;
