import React, { Component } from "react";
import threeEntryPoint from "./threeEntryPoint";
export default class ThreeContainer extends Component {
  componentDidMount() {
    threeEntryPoint(this.threeRootElement, this.props.auth);
  }
  render() {
    return <div ref={element => (this.threeRootElement = element)} />;
  }
}
