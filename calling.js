let peerConnection;
let localStream;
let remoteStream;
let signalingServer;
let receiverId;
let senderId;
let isCaller = false;
let config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

initWebSocket();

function initWebSocket() {
  signalingServer = new WebSocket("ws://localhost:8080"); 

  signalingServer.onopen = () => {
    console.log("[WebSocket] Connection established.");
  };

  signalingServer.onerror = (error) => {
    console.error("[WebSocket] Error:", error);
  };

  signalingServer.onclose = () => {
    console.log("[WebSocket] Connection closed.");
  };

  signalingServer.onmessage = (message) => {
    console.log("[WebSocket] Message received:", message.data);
    const data = JSON.parse(message.data);
    handleSignalMessage(data);
  };
}

function sendSignal(message) {
  if (signalingServer && signalingServer.readyState === WebSocket.OPEN) {
    console.log("[Signaling] Sending message:", message);
    signalingServer.send(JSON.stringify(message));
  } else {
    console.error(
      "[Signaling] WebSocket is not open. Ready state:",
      signalingServer.readyState
    );
  }
}

function handleSignalMessage(message) {
  console.log("[Signaling] Handling message:", message);

  switch (message.type) {
    case "offer":
      console.log("[Signaling] Received offer from:", message.senderId);
      handleOffer(message.offer, message.senderId, message.isVideo);
      break;

    case "answer":
      console.log("[Signaling] Received answer from:", message.senderId);
      handleAnswer(message.answer);
      break;

    case "ice-candidate":
      console.log("[Signaling] Received ICE candidate from:", message.senderId);
      handleIceCandidate(message.candidate);
      break;

    case "call-rejected":
      console.log("[Signaling] Call rejected by:", message.senderId);
      handleCallRejected(message);
      break;

    default:
      console.warn("[Signaling] Unknown message type:", message.type);
  }
}

// Show modal when offer is received
function showOfferModal(senderId, isVideo) {
  console.log("[UI] Showing offer modal for:", senderId);
  const modal = document.getElementById("offerModal");
  const backdrop = document.getElementById("modalBackdrop");
  const callType = isVideo ? "video" : "audio";

  // Update modal content
  document.getElementById("senderName").innerText = senderId;
  document.getElementById("callType").innerText = callType;

  // Show modal and backdrop
  modal.classList.add("show");
  backdrop.classList.add("show");
  modal.style.display = "block";

  // Handle accept button
  document.getElementById("acceptButton").onclick = () => {
    console.log("[UI] Call accepted by user.");
    modal.classList.remove("show");
    backdrop.classList.remove("show");
    modal.style.display = "none";
    startCallOnAccept(isVideo, senderId, receiverId)
  };

  document.getElementById("declineButton").onclick = () => {
    console.log("[UI] Call declined by user.");
    modal.classList.remove("show");
    backdrop.classList.remove("show");
    modal.style.display = "none";

    sendSignal({
      type: "call-rejected",
      senderId: senderId,
      receiverId: receiverId,
    });
  };
}
async function startCallOnAccept(isVideo, senderId, receiverId) {
  try {
    console.log(`[Call] Starting ${isVideo ? "video" : "audio"} call to:`, receiverId);
    
    // Show "Calling..." message while setting up the call
    document.getElementById("callingMessage").style.display = "block";

    localStream = await navigator.mediaDevices.getUserMedia({
      video: isVideo,  
      audio: true,
    });
    console.log("[Call] Local media stream acquired.");
    if(isVideo){
        show(receiverId,0);
    }else{
        show(receiverId,1);
    }

    const localVideoElement = document.getElementById("localVideo");
    const remoteVideoElement = document.getElementById("remoteVideo");

    if (isVideo && localVideoElement) {
      localVideoElement.srcObject = localStream;
      console.log("[Call] Local video stream attached.");
    } else if (!isVideo && localVideoElement) {
      localVideoElement.srcObject = null;
    }

    peerConnection = new RTCPeerConnection(config);
    console.log("[Call] Peer connection created.");

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
      console.log(`[Call] Added local track: ${track.kind}`);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[Call] New ICE candidate generated.");
        sendSignal({
          type: "ice-candidate",
          candidate: event.candidate,
          senderId: senderId,
          receiverId: receiverId,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log("[Call] Remote stream received.");
      remoteStream = event.streams[0];

      if (isVideo && remoteVideoElement) {
        remoteVideoElement.srcObject = remoteStream;
      } else if (!isVideo) {
        const remoteAudioElement = document.createElement("audio");
        remoteAudioElement.id = "remoteAudio";
        remoteAudioElement.autoplay = true;
        document.body.appendChild(remoteAudioElement);
        document.getElementById("remoteAudio").srcObject = remoteStream;
      }
    };

    const offer = await peerConnection.createOffer();
    console.log("[Call] Offer created.");
    await peerConnection.setLocalDescription(offer);
    console.log("[Call] Local description set.");

    sendSignal({
      type: "offer",
      offer: offer,
      receiverId: receiverId,
      senderId: senderId,
      isVideo: isVideo,  
    });
    console.log("[Call] Offer sent to signaling server.");
  } catch (error) {
    console.error("[Call] Error starting call:", error);
  }
}
async function handleOffer(offer, sender, isVideo) {
  try {
    console.log("[Call] Handling offer from:", sender);
    senderId = sender;
    receiverId = offer.receiverId;

    // Show the modal with the incoming offer
    showOfferModal(senderId, isVideo);
  } catch (error) {
    console.error("[Call] Error handling offer:", error);
  }
}


async function handleAnswer(answer) {
  try {
    console.log("[Call] Handling answer.");
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
    console.log("[Call] Remote description set successfully.");
  } catch (error) {
    console.error("[Call] Error handling answer:", error);
  }
}
function handleIceCandidate(candidate) {
  if (peerConnection) {
    console.log("[Call] Handling ICE candidate.");
    peerConnection
      .addIceCandidate(new RTCIceCandidate(candidate))
      .then(() => {
        console.log("[Call] ICE candidate added successfully.");
      })
      .catch((error) => {
        console.error("[Call] Error adding ICE candidate:", error);
      });
  } else {
    console.error("[Call] No peer connection found for ICE candidate.");
  }
}

// Handle call rejection
function handleCallRejected(message) {
  console.log(`[Call] Call from ${message.senderId} was rejected.`);
  alert("The call was rejected.");
}
async function startCall(isVideo, senderId, receiverId) {
  try {
    console.log(`[Call] Starting ${isVideo ? "video" : "audio"} call to:`, receiverId);
    localStream = await navigator.mediaDevices.getUserMedia({
      video: isVideo,  
      audio: true,
    });
    console.log("[Call] Local media stream acquired.");

    
    const localVideoElement = document.getElementById("localVideo");
    if (isVideo && localVideoElement) {
      localVideoElement.srcObject = localStream;
      console.log("[Call] Local video stream attached.");
    } else if (!isVideo && localVideoElement) {
      localVideoElement.srcObject = null;
    }

    peerConnection = new RTCPeerConnection(config);
    console.log("[Call] Peer connection created.");

    
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
      console.log(`[Call] Added local track: ${track.kind}`);
    });

   
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[Call] New ICE candidate generated.");
        sendSignal({
          type: "ice-candidate",
          candidate: event.candidate,
          senderId: senderId,
          receiverId: receiverId,
        });
      }
    };

   
    peerConnection.ontrack = (event) => {
      console.log("[Call] Remote stream received.");
      remoteStream = event.streams[0];

      const remoteVideoElement = document.getElementById("remoteVideo");
      const remoteAudioElement = document.getElementById("remoteAudio");

      if (isVideo && remoteVideoElement) {
        remoteVideoElement.srcObject = remoteStream;
      } else if (!isVideo) {
      
        if (!remoteAudioElement) {
          const audioElement = document.createElement("audio");
          audioElement.id = "remoteAudio";
          audioElement.autoplay = true;
          document.body.appendChild(audioElement);
        }
        document.getElementById("remoteAudio").srcObject = remoteStream;
      }
    };

    
    const offer = await peerConnection.createOffer();
    console.log("[Call] Offer created.");
    await peerConnection.setLocalDescription(offer);
    console.log("[Call] Local description set.");

    sendSignal({
      type: "offer",
      offer: offer,
      receiverId: receiverId,
      senderId: senderId,
      isVideo: isVideo,  
    });
    console.log("[Call] Offer sent to signaling server.");
  } catch (error) {
    console.error("[Call] Error starting call:", error);
  }
}

function endCall() {
  console.log("[Call] Ending call...");
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    console.log("[Call] Peer connection closed.");
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    console.log("[Call] Local media tracks stopped.");
  }

  document.getElementById("remoteVideo").srcObject = null;
  document.getElementById("localVideo").srcObject = null;
  const remoteAudio = document.getElementById("remoteAudio");
  if (remoteAudio) {
    remoteAudio.srcObject = null;
    remoteAudio.remove();
    console.log("[Call] Remote audio stream cleared.");
  }
  console.log("[Call] Call ended.");
}

function toggleAudio() {
  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length > 0) {
    audioTracks[0].enabled = !audioTracks[0].enabled;
    console.log(
      `[Call] Audio toggled: ${audioTracks[0].enabled ? "Unmuted" : "Muted"}`
    );
    document.getElementById("audioToggleBtn").innerText = audioTracks[0].enabled
      ? "Mute"
      : "Unmute";
  }
}

function toggleVideo() {
  const videoTracks = localStream.getVideoTracks();
  if (videoTracks.length > 0) {
    videoTracks[0].enabled = !videoTracks[0].enabled;
    console.log(
      `[Call] Video toggled: ${videoTracks[0].enabled ? "On" : "Off"}`
    );
    document.getElementById("videoToggleBtn").innerText = videoTracks[0].enabled
      ? "Video Off"
      : "Video On";
  }
}
