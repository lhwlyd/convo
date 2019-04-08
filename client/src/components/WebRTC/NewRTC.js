import React from "react";
import openSocket from "socket.io-client";
const freeice = require("freeice");
const quickconnect = require("rtc-quickconnect");
var Peer = require("simple-peer");
var wrtc = require("wrtc");

let socket;
let localPeerConnection;
let remotePeerConnection;
let localStream, remoteStream;

// Set up to exchange only video.
const offerOptions = {
  offerToReceiveVideo: 1,
  offerToReceiveAudio: 1
};

// Define initial start time of the call (defined as connection between peers).
let startTime = null;

// initialise a configuration for one stun server
const qcOpts = {
  room: "icetest",
  iceServers: freeice()
};

// Define helper functions.

// Gets the "other" peer connection.
function getOtherPeer(peerConnection) {
  return peerConnection === localPeerConnection
    ? remotePeerConnection
    : localPeerConnection;
}

// Gets the name of a certain peer connection.
function getPeerName(peerConnection) {
  return peerConnection === localPeerConnection
    ? "localPeerConnection"
    : "remotePeerConnection";
}

// Logs an action (text) and the time when it happened on the console.
function trace(text) {
  text = text.trim();
  const now = (window.performance.now() / 1000).toFixed(3);

  console.log(now, text);
}

export default class WebRTCPeerConnection extends React.Component {
  constructor() {
    super();

    this.state = {
      startDisabled: false,
      callDisabled: true,
      hangUpDisabled: true,
      servers: null
    };

    window.room = prompt("Enter room name:");

    socket = openSocket("http://localhost:8080");

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

    // socket.on("message", function(message) {
    //   console.log("Client received message:", message);
    //   if (message === "got user media") {
    //     maybeStart();
    //   } else if (message.type === "offer") {
    //     if (!isInitiator && !isStarted) {
    //       maybeStart();
    //     }
    //     pc.setRemoteDescription(new RTCSessionDescription(message));
    //     doAnswer();
    //   } else if (message.type === "answer" && isStarted) {
    //     pc.setRemoteDescription(new RTCSessionDescription(message));
    //   } else if (message.type === "candidate" && isStarted) {
    //     var candidate = new RTCIceCandidate({
    //       sdpMLineIndex: message.label,
    //       candidate: message.candidate
    //     });
    //     pc.addIceCandidate(candidate);
    //   } else if (message === "bye" && isStarted) {
    //     handleRemoteHangup();
    //   }
    // });
  }

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
      .then(this.gotLocalStream)
      .catch(e => console.log(e));
  };

  gotLocalStream = stream => {
    this.localVideoRef.current.srcObject = stream;
    // Add local stream to connection and create offer to connect.
    localStream = stream;
    trace("Received local stream.");

    //let peer = new Peer({ initiator: true, wrtc: wrtc, stream: stream });
    // peer.on("signal", function(data) {
    //   peer2.signal(data);
    // });

    this.setState({
      callDisabled: false
    });
  };

  // Handles error by logging a message to the console.
  handleLocalMediaStreamError(error) {
    trace(`navigator.getUserMedia error: ${error.toString()}.`);
  }

  // Handles remote MediaStream success by adding it as the remoteVideo src.
  gotRemoteMediaStream = event => {
    const mediaStream = event.stream;
    this.remoteVideoRef.current.srcObject = mediaStream;
    remoteStream = mediaStream;
    trace("Remote peer connection received remote stream.");
  };

  handleConnection = event => {
    const peerConnection = event.target;
    const iceCandidate = event.candidate;

    if (iceCandidate) {
      const newIceCandidate = new RTCIceCandidate(iceCandidate);
      const otherPeer = getOtherPeer(peerConnection);

      otherPeer
        .addIceCandidate(newIceCandidate)
        .then(() => {
          this.handleConnectionSuccess(peerConnection);
        })
        .catch(error => {
          this.handleConnectionFailure(peerConnection, error);
        });
    }
  };

  // Logs that the connection succeeded.
  handleConnectionSuccess(peerConnection) {
    trace(`${getPeerName(peerConnection)} addIceCandidate success.`);
  }

  // Logs that the connection failed.
  handleConnectionFailure(peerConnection, error) {
    trace(
      `${getPeerName(peerConnection)} failed to add ICE Candidate:\n` +
        `${error.toString()}.`
    );
  }

  // Logs changes to the connection state.
  handleConnectionChange(event) {
    const peerConnection = event.target;
    console.log("ICE state change event: ", event);
    let scope = this;
    trace(
      `${getPeerName(peerConnection)} ICE state: ` +
        `${peerConnection.iceConnectionState}.`
    );
  }

  // Logs error when setting session description fails.
  setSessionDescriptionError(error) {
    trace(`Failed to create session description: ${error.toString()}.`);
  }

  // Logs success when setting session description.
  setDescriptionSuccess(peerConnection, functionName) {
    const peerName = getPeerName(peerConnection);
    trace(`${peerName} ${functionName} complete.`);
  }

  // Logs success when localDescription is set.
  setLocalDescriptionSuccess(peerConnection) {
    this.setDescriptionSuccess(peerConnection, "setLocalDescription");
  }

  // Logs success when remoteDescription is set.
  setRemoteDescriptionSuccess(peerConnection) {
    this.setDescriptionSuccess(peerConnection, "setRemoteDescription");
  }

  call = () => {
    trace("Starting call.");
    startTime = window.performance.now();
    // Get local media stream tracks.
    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();
    if (videoTracks.length > 0) {
      trace(`Using video device: ${videoTracks[0].label}.`);
    }
    if (audioTracks.length > 0) {
      trace(`Using audio device: ${audioTracks[0].label}.`);
    }

    //TODO servers?
    // Create peer connections and add behavior.
    localPeerConnection = new RTCPeerConnection(this.servers);
    trace("Created local peer connection object localPeerConnection.");

    localPeerConnection.addEventListener("icecandidate", this.handleConnection);
    localPeerConnection.addEventListener(
      "iceconnectionstatechange",
      this.handleConnectionChange
    );

    remotePeerConnection = new RTCPeerConnection(qcOpts.iceServers);
    trace("Created remote peer connection object remotePeerConnection.");

    remotePeerConnection.addEventListener(
      "icecandidate",
      this.handleConnection
    );
    remotePeerConnection.addEventListener(
      "iceconnectionstatechange",
      this.handleConnectionChange
    );
    remotePeerConnection.addEventListener(
      "addstream",
      this.gotRemoteMediaStream
    );

    localPeerConnection.addStream(localStream);
    trace("Added local stream to localPeerConnection.");

    trace("localPeerConnection createOffer start.");
    localPeerConnection
      .createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
      })
      .then(this.createdOffer)
      .catch(this.setSessionDescriptionError);
  };

  // Logs offer creation and sets peer connection session descriptions.
  createdOffer = description => {
    trace(`Offer from localPeerConnection:\n${description.sdp}`);

    trace("localPeerConnection setLocalDescription start.");
    localPeerConnection
      .setLocalDescription(description)
      .then(() => {
        this.setLocalDescriptionSuccess(localPeerConnection);
      })
      .catch(this.setSessionDescriptionError);

    trace("remotePeerConnection setRemoteDescription start.");
    remotePeerConnection
      .setRemoteDescription(description)
      .then(() => {
        this.setRemoteDescriptionSuccess(remotePeerConnection);
      })
      .catch(this.setSessionDescriptionError);

    trace("remotePeerConnection createAnswer start.");
    remotePeerConnection
      .createAnswer()
      .then(this.createdAnswer)
      .catch(this.setSessionDescriptionError);
  };

  // Logs answer to offer creation and sets peer connection session descriptions.
  createdAnswer = description => {
    trace(`Answer from remotePeerConnection:\n${description.sdp}.`);

    trace("remotePeerConnection setLocalDescription start.");
    remotePeerConnection
      .setLocalDescription(description)
      .then(() => {
        this.setLocalDescriptionSuccess(remotePeerConnection);
      })
      .catch(this.setSessionDescriptionError);

    trace("localPeerConnection setRemoteDescription start.");
    localPeerConnection
      .setRemoteDescription(description)
      .then(() => {
        this.setRemoteDescriptionSuccess(localPeerConnection);
      })
      .catch(this.setSessionDescriptionError);
  };

  hangUp = () => {
    localPeerConnection.close();
    remotePeerConnection.close();
    localPeerConnection = null;
    remotePeerConnection = null;
    trace("Ending call.");
    this.setState({
      hangUpDisabled: true,
      callDisabled: false
    });
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
