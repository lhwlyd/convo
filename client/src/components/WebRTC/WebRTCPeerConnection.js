import React from "react";
import openSocket from "socket.io-client";
const freeice = require("freeice");
const quickconnect = require("rtc-quickconnect");
var Peer = require("simple-peer");
var wrtc = require("wrtc");

window.room = prompt("Enter room name:");

let socket = openSocket("http://localhost:8080");

let isInitiator = false;

if (window.room !== "") {
  console.log("Message from client: Asking to join room " + window.room);
  socket.emit("create or join", window.room);
}

socket.on("created", function(room, clientId) {
  isInitiator = true;
});

socket.on("full", function(room) {
  console.log("Message from client: Room " + room + " is full :^(");
});

socket.on("ipaddr", function(ipaddr) {
  console.log("Message from client: Server IP address is " + ipaddr);
});

socket.on("joined", function(room, clientId) {
  isInitiator = false;
});

socket.on("log", function(array) {
  console.log.apply(console, array);
});

// initialise a configuration for one stun server
const qcOpts = {
  room: "icetest",
  iceServers: freeice()
};

export default class WebRTCPeerConnection extends React.Component {
  state = {
    startDisabled: false,
    callDisabled: true,
    hangUpDisabled: true,
    servers: null,
    pc1: null,
    pc2: null,
    localStream: null,
    peer1: null,
    peer2: null,
    localPeerConnection: null,
    remotePeerConnection: null
  };

  localVideoRef = React.createRef();
  remoteVideoRef = React.createRef();

  start = () => {
    this.setState({
      startDisabled: true
    });
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true
      })
      .then(this.gotStream)
      .catch(e => console.log(e));
  };

  gotStream = stream => {
    this.localVideoRef.current.srcObject = stream;
    let peer1 = new Peer({ initiator: true, wrtc: wrtc, stream: stream });
    let peer2 = new Peer({ wrtc: wrtc });
    peer2.scope = this;
    peer1.on("signal", function(data) {
      peer2.signal(data);
    });

    peer2.on("signal", function(data) {
      peer1.signal(data);
    });

    peer2.on("stream", function(stream) {
      // got remote video stream, now let's show it in a video tag
      console.log("peer2 got stream!");
      peer2.scope.remoteVideoRef.current.srcObject = stream;
    });

    this.setState({
      callDisabled: false,
      localStream: stream,
      peer1,
      peer2
    });
  };

  gotRemoteStream = stream => {
    console.log("got remote stream", stream);
    //this.remoteVideoRef.current.srcObject = stream.streams[0];
  };

  call = () => {
    this.setState({
      callDisabled: true,
      hangUpDisabled: false
    });
    let { localStream } = this.state;

    let servers = null,
      pc1 = new RTCPeerConnection(servers),
      pc2 = new RTCPeerConnection(servers),
      localPeerConnection = new RTCPeerConnection(servers);

    pc1.onicecandidate = e => this.onIceCandidate(pc1, e);
    pc1.oniceconnectionstatechange = e => this.onIceStateChange(pc1, e);

    pc2.onicecandidate = e => this.onIceCandidate(pc2, e);
    pc2.oniceconnectionstatechange = e => this.onIceStateChange(pc2, e);
    pc2.ontrack = this.gotRemoteStream;

    localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));

    pc1
      .createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
      })
      .then(this.onCreateOfferSuccess, error =>
        console.error("Failed to create session description", error.toString())
      );

    this.setState({
      servers,
      pc1,
      pc2,
      localStream
    });
  };

  onCreateOfferSuccess = desc => {
    let { pc1, pc2 } = this.state;

    pc1.setLocalDescription(desc).then(
      // sends this session description to Bob via their signaling channel.
      () => console.log("pc1 setLocalDescription complete createOffer"),
      error =>
        console.error(
          "pc1 Failed to set session description in createOffer",
          error.toString()
        )
    );

    pc2.setRemoteDescription(desc).then(
      () => {
        console.log("pc2 setRemoteDescription complete createOffer");
        pc2
          .createAnswer()
          .then(this.onCreateAnswerSuccess, error =>
            console.error(
              "pc2 Failed to set session description in createAnswer",
              error.toString()
            )
          );
      },
      error =>
        console.error(
          "pc2 Failed to set session description in createOffer",
          error.toString()
        )
    );
  };

  onCreateAnswerSuccess = desc => {
    let { pc1, pc2 } = this.state;

    pc1
      .setRemoteDescription(desc)
      .then(
        () => console.log("pc1 setRemoteDescription complete createAnswer"),
        error =>
          console.error(
            "pc1 Failed to set session description in onCreateAnswer",
            error.toString()
          )
      );

    console.log(pc1);

    pc2
      .setLocalDescription(desc)
      .then(
        () => console.log("pc2 setLocalDescription complete createAnswer"),
        error =>
          console.error(
            "pc2 Failed to set session description in onCreateAnswer",
            error.toString()
          )
      );
  };

  onIceStateChange = (pc, e) => {
    //console.log("on ice state change:", pc, e);
  };

  onIceCandidate = (pc, event) => {
    let { pc1, pc2 } = this.state;

    const peerConnection = event.target;
    const iceCandidate = event.candidate;

    if (iceCandidate) {
      const newIceCandidate = new RTCIceCandidate(iceCandidate);

      let otherPc = pc === pc1 ? pc2 : pc1;
      otherPc
        .addIceCandidate(newIceCandidate)
        .then(
          () => this.handleConnectionSuccess(peerConnection),
          error =>
            console.error("failed to add ICE Candidate", error.toString())
        );
    }
  };

  handleConnectionSuccess(peerConnection) {
    console.log("Connection success!", peerConnection);
  }

  hangUp = () => {
    let { pc1, pc2 } = this.state;

    pc1.close();
    pc2.close();

    this.setState({
      pc1: null,
      pc2: null,
      hangUpDisabled: true,
      callDisabled: false
    });
  };

  // Logs offer creation and sets peer connection session descriptions.
  createdOffer = description => {
    const { remotePeerConnection, localPeerConnection } = this.state;

    localPeerConnection
      .setLocalDescription(description)
      .then(() => {
        setLocalDescriptionSuccess(localPeerConnection);
      })
      .catch(setSessionDescriptionError);

    remotePeerConnection
      .setRemoteDescription(description)
      .then(() => {
        setRemoteDescriptionSuccess(remotePeerConnection);
      })
      .catch(setSessionDescriptionError);

    remotePeerConnection
      .createAnswer()
      .then(createdAnswer)
      .catch(setSessionDescriptionError);
  };

  // Logs answer to offer creation and sets peer connection session descriptions.
  createdAnswer = description => {
    const { remotePeerConnection, localPeerConnection } = this.state;
    remotePeerConnection
      .setLocalDescription(description)
      .then(() => {
        setLocalDescriptionSuccess(remotePeerConnection);
      })
      .catch(setSessionDescriptionError);

    localPeerConnection
      .setRemoteDescription(description)
      .then(() => {
        setRemoteDescriptionSuccess(localPeerConnection);
      })
      .catch(setSessionDescriptionError);
  };

  render() {
    const { startDisabled, callDisabled, hangUpDisabled } = this.state;

    return (
      <div>
        <video
          ref={this.localVideoRef}
          autoPlay
          muted
          style={{ width: "240px", height: "180px" }}
        />
        <video
          ref={this.remoteVideoRef}
          autoPlay
          style={{ width: "240px", height: "180px" }}
        />

        <div>
          <button onClick={this.start} disabled={startDisabled}>
            Start
          </button>
          <button onClick={this.call} disabled={callDisabled}>
            Call
          </button>
          <button onClick={this.hangUp} disabled={hangUpDisabled}>
            Hang Up
          </button>
        </div>
      </div>
    );
  }
}
