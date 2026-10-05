import { roomManager } from './roomManager.js';
import { verifyToken } from './auth.js';

export function setupSocketHandler(io) {
  // Middleware for socket auth
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        socket.userData = decoded;
      }
    }
    // Allow guest connection even if no token provided
    if (!socket.userData) {
      const guestId = 'guest_' + socket.id.substring(0, 6);
      socket.userData = {
        id: guestId,
        name: socket.handshake.auth?.name || `Guest_${guestId.substring(6)}`,
        verified: false,
        isGuest: true
      };
    }
    next();
  });

  io.on('connection', (socket) => {
    // -------------------------------------------------------------
    // ROOM MANAGEMENT EVENTS
    // -------------------------------------------------------------

    // 1. Create Room
    socket.on('room:create', ({ targetUrl, password, controlMode }, callback) => {
      try {
        const room = roomManager.createRoom({
          hostId: socket.userData.id,
          hostName: socket.userData.name,
          hostAvatar: socket.userData.avatar,
          targetUrl,
          password,
          controlMode
        });

        // Join host to room
        const { member } = roomManager.joinRoom(room.roomId, {
          socketId: socket.id,
          userId: socket.userData.id,
          name: socket.userData.name,
          avatar: socket.userData.avatar,
          verified: socket.userData.verified,
          password
        });

        socket.join(room.roomId);
        socket.currentRoomId = room.roomId;

        const snapshot = roomManager.getRoomSnapshot(room.roomId);
        if (typeof callback === 'function') {
          callback({ success: true, room: snapshot, member });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // 2. Join Room (via Share Link or Room ID + Password)
    socket.on('room:join', ({ roomId, password }, callback) => {
      try {
        const { room, member } = roomManager.joinRoom(roomId, {
          socketId: socket.id,
          userId: socket.userData.id,
          name: socket.userData.name,
          avatar: socket.userData.avatar,
          verified: socket.userData.verified,
          password
        });

        socket.join(room.roomId);
        socket.currentRoomId = room.roomId;

        const snapshot = roomManager.getRoomSnapshot(room.roomId);

        // Notify other room members
        socket.to(room.roomId).emit('room:member-joined', {
          member,
          members: snapshot.members
        });

        if (typeof callback === 'function') {
          callback({ success: true, room: snapshot, member });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // 3. Search / Query Room Info (Check if room exists & if password required)
    socket.on('room:query', ({ roomId }, callback) => {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room not found' });
        return;
      }

      if (typeof callback === 'function') {
        callback({
          success: true,
          roomInfo: {
            roomId: room.roomId,
            targetUrl: room.targetUrl,
            hasPassword: !!room.password,
            memberCount: room.members.size,
            controlMode: room.controlMode
          }
        });
      }
    });

    // -------------------------------------------------------------
    // REAL-TIME VIDEO PLAYBACK SYNC HANDLERS
    // -------------------------------------------------------------

    // Sync Play
    socket.on('sync:play', ({ currentTime }, callback) => {
      const roomId = socket.currentRoomId;
      if (!roomId) return;

      try {
        const result = roomManager.updatePlayback(roomId, {
          isPlaying: true,
          currentTime,
          updatedBySocketId: socket.id
        });

        if (result) {
          // Broadcast play event to all room members
          io.to(roomId).emit('sync:play', {
            currentTime,
            sender: result.sender.name,
            timestamp: Date.now()
          });

          if (typeof callback === 'function') callback({ success: true });
        }
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // Sync Pause
    socket.on('sync:pause', ({ currentTime }, callback) => {
      const roomId = socket.currentRoomId;
      if (!roomId) return;

      try {
        const result = roomManager.updatePlayback(roomId, {
          isPlaying: false,
          currentTime,
          updatedBySocketId: socket.id
        });

        if (result) {
          // Broadcast pause event to all room members
          io.to(roomId).emit('sync:pause', {
            currentTime,
            sender: result.sender.name,
            timestamp: Date.now()
          });

          if (typeof callback === 'function') callback({ success: true });
        }
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // Sync Seek
    socket.on('sync:seek', ({ currentTime }, callback) => {
      const roomId = socket.currentRoomId;
      if (!roomId) return;

      try {
        const room = roomManager.getRoom(roomId);
        const result = roomManager.updatePlayback(roomId, {
          isPlaying: room ? room.playbackState.isPlaying : false,
          currentTime,
          updatedBySocketId: socket.id
        });

        if (result) {
          io.to(roomId).emit('sync:seek', {
            currentTime,
            sender: result.sender.name,
            timestamp: Date.now()
          });

          if (typeof callback === 'function') callback({ success: true });
        }
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // Sync Speed (Playback rate)
    socket.on('sync:speed', ({ playbackRate }, callback) => {
      const roomId = socket.currentRoomId;
      if (!roomId) return;

      try {
        const room = roomManager.getRoom(roomId);
        const result = roomManager.updatePlayback(roomId, {
          isPlaying: room ? room.playbackState.isPlaying : false,
          currentTime: room ? room.playbackState.currentTime : 0,
          playbackRate,
          updatedBySocketId: socket.id
        });

        if (result) {
          io.to(roomId).emit('sync:speed', {
            playbackRate,
            sender: result.sender.name
          });

          if (typeof callback === 'function') callback({ success: true });
        }
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // Request Live Sync Heartbeat snapshot
    socket.on('sync:heartbeat', (callback) => {
      const roomId = socket.currentRoomId;
      if (!roomId) return;
      const snapshot = roomManager.getRoomSnapshot(roomId);
      if (typeof callback === 'function') {
        callback(snapshot ? snapshot.playbackState : null);
      }
    });

    // -------------------------------------------------------------
    // CHAT & EMOJI REACTION EVENTS
    // -------------------------------------------------------------

    socket.on('chat:send', ({ text }, callback) => {
      const roomId = socket.currentRoomId;
      if (!roomId || !text) return;

      const msg = roomManager.addChatMessage(roomId, {
        sender: socket.userData.name,
        userId: socket.userData.id,
        text,
        isSystem: false
      });

      if (msg) {
        io.to(roomId).emit('chat:message', msg);
        if (typeof callback === 'function') callback({ success: true, message: msg });
      }
    });

    socket.on('emoji:send', ({ emoji }) => {
      const roomId = socket.currentRoomId;
      if (!roomId || !emoji) return;

      io.to(roomId).emit('emoji:reaction', {
        id: Math.random().toString(36).substring(2, 9),
        sender: socket.userData.name,
        emoji
      });
    });

    // -------------------------------------------------------------
    // WEBRTC AUDIO & VIDEO CALL SIGNALING
    // -------------------------------------------------------------

    // Media Toggle (Cam/Mic)
    socket.on('media:toggle', ({ camOn, micOn }) => {
      const res = roomManager.updateMediaState(socket.id, { camOn, micOn });
      if (res) {
        socket.to(res.roomId).emit('media:state-changed', {
          socketId: socket.id,
          camOn: res.member.camOn,
          micOn: res.member.micOn
        });
      }
    });

    // Relay WebRTC Offer
    socket.on('webrtc:offer', ({ targetSocketId, offer }) => {
      socket.to(targetSocketId).emit('webrtc:offer', {
        fromSocketId: socket.id,
        senderName: socket.userData.name,
        offer
      });
    });

    // Relay WebRTC Answer
    socket.on('webrtc:answer', ({ targetSocketId, answer }) => {
      socket.to(targetSocketId).emit('webrtc:answer', {
        fromSocketId: socket.id,
        answer
      });
    });

    // Relay WebRTC ICE Candidate
    socket.on('webrtc:ice-candidate', ({ targetSocketId, candidate }) => {
      socket.to(targetSocketId).emit('webrtc:ice-candidate', {
        fromSocketId: socket.id,
        candidate
      });
    });

    // -------------------------------------------------------------
    // DISCONNECT HANDLER
    // -------------------------------------------------------------

    socket.on('disconnect', () => {
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        io.to(result.roomId).emit('room:member-left', {
          member: result.member,
          members: result.remainingMembers
        });
      }
    });
  });
}
