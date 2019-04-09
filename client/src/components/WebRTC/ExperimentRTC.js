import React from "react";
import openSocket from "socket.io-client";
const freeice = require("freeice");
const quickconnect = require("rtc-quickconnect");
var Peer = require("simple-peer");
var wrtc = require("wrtc");

let pc;
let socket;
let localStream;
let remoteStreams = [];
var isChannelReady = false;
var isStarted = false;
let isInitiator = false;

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

var pcConfig = {
  iceServers: freeice()
};

// Define helper functions.

// Gets the name of a certain peer connection.
function getPeerName(peerConnection) {
  return peerConnection;
}

function sendMessage(message) {
  console.log("Client sending message: ", message);
  socket.emit("message", message);
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
      hangUpDisabled: true
    };

    window.room = prompt("Enter room name:");

    socket = openSocket("http://localhost:8080");

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

    // This client receives a message
    socket.on("message", message => {
      console.log("Client received message:", message);
      if (message === "got user media") {
        this.maybeStart();
      } else if (message.type === "offer") {
        if (!isInitiator && !isStarted) {
          this.maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        this.doAnswer();
      } else if (message.type === "answer" && isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === "candidate" && isStarted) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
      } else if (message === "bye" && isStarted) {
        this.handleRemoteHangup();
      }
    });
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
    console.log("Adding local stream.");
    this.localVideoRef.current.srcObject = stream;
    // Add local stream to connection and create offer to connect.
    localStream = stream;

    // MaybeStart() gets called.
    sendMessage("got user media");

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

  maybeStart = () => {
    console.log(
      ">>>>>>> maybeStart() ",
      "isStarted is:",
      isStarted,
      localStream,
      "isChannelReady is:",
      isChannelReady
    );
    if (!isStarted && typeof localStream !== "undefined" && isChannelReady) {
      console.log(">>>>>> creating peer connection");
      this.createPeerConnection();
      pc.addStream(localStream);
      isStarted = true;
      console.log("isInitiator", isInitiator);
      if (isInitiator) {
        this.doCall();
      }
    }
  };

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
    console.log(">>>>>>>>>>>>>Starting Call >>>>>>");
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

    // Hardcoding this
    isChannelReady = true;
    sendMessage("got user media");
    if (isInitiator) {
      this.maybeStart();
    }
  };

  createPeerConnection = () => {
    try {
      pc = new RTCPeerConnection(null);
      pc.onicecandidate = this.handleIceCandidate;
      pc.onaddstream = this.handleRemoteStreamAdded;
      pc.onremovestream = this.handleRemoteStreamRemoved;
      console.log("Created RTCPeerConnnection");
    } catch (e) {
      console.log("Failed to create PeerConnection, exception: " + e.message);
      alert("Cannot create RTCPeerConnection object.");
      return;
    }
  };

  /* There will be multiple candidates */
  handleIceCandidate = event => {
    console.log("icecandidate event: ", event);
    // addIceCandidate() gets called
    if (event.candidate) {
      sendMessage({
        type: "candidate",
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log("End of candidates.");
    }
  };

  handleCreateOfferError = event => {
    console.log("createOffer() error: ", event);
  };

  doCall = () => {
    console.log("Sending offer to peer");
    pc.createOffer(this.setLocalAndSendMessage, this.handleCreateOfferError);
  };

  doAnswer = () => {
    console.log("Sending answer to peer.");
    pc.createAnswer().then(
      this.setLocalAndSendMessage,
      this.onCreateSessionDescriptionError
    );
  };

  setLocalAndSendMessage = sessionDescription => {
    pc.setLocalDescription(sessionDescription);
    sendMessage(sessionDescription);
  };

  onCreateSessionDescriptionError = error => {
    trace("Failed to create session description: " + error.toString());
  };

  handleRemoteStreamAdded = event => {
    console.log("Remote stream added.");
    remoteStreams.add(event.stream);
    //this.remoteVideoRef.current.srcObject = event.stream;
  };

  handleRemoteStreamRemoved = event => {
    console.log(event.stream);
    console.log("Remote stream removed. Event: ", event);
    this.remoteStreams = this.remoteStreams.filter(
      stream => stream !== event.stream
    );
  };

  hangup = () => {
    console.log("Hanging up.");
    this.stop();
    sendMessage("bye");
  };

  handleRemoteHangup = () => {
    console.log("Session terminated.");
    this.stop();
    isInitiator = false;
  };

  stop = () => {
    isStarted = false;
    pc.close();
    pc = null;
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
        {this.remoteStreams.forEach(stream => {
          <video
            srcObject={stream}
            autoPlay
            style={{ width: "240px", height: "180px" }}
          />;
        })}

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
