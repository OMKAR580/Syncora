/**
 * Syncora WebRTC Audio & Video Call Manager
 * Provides 100% Free Peer-to-Peer Voice & Video Calls with Google STUN Servers
 */

export const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCManager {
  constructor(socket, currentSocketId) {
    this.socket = socket;
    this.currentSocketId = currentSocketId;
    this.peerConnections = new Map(); // socketId -> RTCPeerConnection
    this.localStream = null;
    this.isCamOn = false;
    this.isMicOn = false;
  }

  /**
   * Request local audio/video media stream
   */
  async startLocalStream(enableVideo = true, enableAudio = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: enableVideo ? { width: 320, height: 240, frameRate: 15 } : false,
        audio: enableAudio
      });
      this.isCamOn = enableVideo;
      this.isMicOn = enableAudio;
      return this.localStream;
    } catch (err) {
      console.warn('⚠️ Syncora WebRTC: Could not capture local camera/microphone:', err.message);
      return null;
    }
  }

  /**
   * Toggle Microphone Mute / Unmute
   */
  toggleMic() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMicOn = audioTrack.enabled;
      return this.isMicOn;
    }
    return false;
  }

  /**
   * Toggle Camera On / Off
   */
  toggleCam() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isCamOn = videoTrack.enabled;
      return this.isCamOn;
    }
    return false;
  }

  /**
   * Create Peer Connection to a room member
   */
  createPeerConnection(targetSocketId, onRemoteStream) {
    if (this.peerConnections.has(targetSocketId)) {
      return this.peerConnections.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(STUN_SERVERS);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('webrtc:ice-candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Remote Stream handler
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0] && typeof onRemoteStream === 'function') {
        onRemoteStream(targetSocketId, event.streams[0]);
      }
    };

    this.peerConnections.set(targetSocketId, pc);
    return pc;
  }

  /**
   * Initiate Call Offer to target member
   */
  async createOffer(targetSocketId, onRemoteStream) {
    const pc = this.createPeerConnection(targetSocketId, onRemoteStream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (this.socket) {
      this.socket.emit('webrtc:offer', { targetSocketId, offer });
    }
  }

  /**
   * Handle incoming Call Offer
   */
  async handleOffer(fromSocketId, offer, onRemoteStream) {
    const pc = this.createPeerConnection(fromSocketId, onRemoteStream);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (this.socket) {
      this.socket.emit('webrtc:answer', { targetSocketId: fromSocketId, answer });
    }
  }

  /**
   * Handle incoming Call Answer
   */
  async handleAnswer(fromSocketId, answer) {
    const pc = this.peerConnections.get(fromSocketId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  /**
   * Handle incoming ICE Candidate
   */
  async handleIceCandidate(fromSocketId, candidate) {
    const pc = this.peerConnections.get(fromSocketId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  /**
   * Close connection for leaving member
   */
  closeConnection(targetSocketId) {
    const pc = this.peerConnections.get(targetSocketId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(targetSocketId);
    }
  }
}
