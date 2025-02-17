let peerConnection;
let localStream;
let remoteStream;
let signalingServer;
let receiverId;
let senderId;
let config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// Initialize WebSocket connection
initWebSocket();

function initWebSocket() {
  signalingServer = new WebSocket("ws://localhost:8080"); // Replace with your WebSocket server URL
  console.log("WebSocket connection attempt...");

  signalingServer.onopen = () => {
    console.log("WebSocket connected");
  };

  signalingServer.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  signalingServer.onclose = () => {
    console.log("WebSocket disconnected");
  };

  signalingServer.onmessage = (message) => {
    console.log(
      "Message received from WebSocket signaling server:",
      message.data
    );
    const data = JSON.parse(message.data);
    handleSignalMessage(data);
  };
}

function sendSignal(message) {
  if (signalingServer && signalingServer.readyState === WebSocket.OPEN) {
    console.log("Sending signaling message:", message);
    signalingServer.send(JSON.stringify(message));
  } else {
    console.error(
      "WebSocket is not open. Ready state is:",
      signalingServer.readyState
    );
  }
}

function handleSignalMessage(message) {
  console.log("Handling signaling message:", message);

  if (message.type === "offer") {
    console.log("Received offer");
    handleOffer(message.offer, message.senderId);
  } else if (message.type === "answer") {
    console.log("Received answer");
    handleAnswer(message.answer);
  } else if (message.type === "ice-candidate") {
    console.log("Received ICE candidate");
    handleIceCandidate(message.candidate);
  }
}

async function handleOffer(offer, sender) {
  try {
    senderId = sender;
    receiverId = offer.receiverId;

    // Create peer connection on offer reception
    peerConnection = new RTCPeerConnection(config);

    // Add incoming ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: "ice-candidate",
          candidate: event.candidate,
          senderId: receiverId,
          receiverId: senderId,
        });
      }
    };

    // Set the remote description (offer)
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Create an answer and set it as local description
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send the answer back to the caller
    sendSignal({
      type: "answer",
      answer: answer,
      receiverId: senderId,
      senderId: receiverId,
    });

    // Handle incoming media streams
    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      document.getElementById("remoteVideo").srcObject = remoteStream;
    };
  } catch (error) {
    console.error("Error handling offer:", error);
  }
}

async function handleAnswer(answer) {
  try {
    // Set the remote description (answer)
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
  } catch (error) {
    console.error("Error handling answer:", error);
  }
}

function handleIceCandidate(candidate) {
  if (peerConnection) {
    // Add the ICE candidate to the peer connection
    peerConnection
      .addIceCandidate(new RTCIceCandidate(candidate))
      .then(() => {
        console.log("ICE candidate added successfully");
      })
      .catch((error) => {
        console.error("Error adding ICE candidate:", error);
      });
  } else {
    console.log("Error: No peer connection found for ICE candidate.");
  }
}

async function startCall(isVideo, senderId, receiverId) {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: isVideo,
      audio: true,
    });

    document.getElementById("localVideo").srcObject = localStream;
    peerConnection = new RTCPeerConnection();

    localStream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: "ice-candidate",
          candidate: event.candidate,
          senderId: senderId,
          receiverId: receiverId,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      document.getElementById("remoteVideo").srcObject = remoteStream;
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("perr", peerConnection);
    // console.log()

    sendSignal({
      type: "offer",
      offer: offer,
      receiverId: receiverId,
      senderId: senderId,
    });
  } catch (error) {
    console.error("Error starting call:", error);
  }
}

// Function to end the call
function endCall() {
  console.log("Ending call...");
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }

  document.getElementById("remoteVideo").srcObject = null;
  document.getElementById("localVideo").srcObject = null;
  console.log("Call ended");
}
s