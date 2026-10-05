/**
 * Room Manager: In-Memory Production State Store for Watch Party Rooms
 */
class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  /**
   * Helper to generate human-readable uppercase 6-character room IDs (e.g. PARTY-8921)
   */
  generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PARTY-${code}`;
  }

  /**
   * Create a new Watch Party Room
   */
  createRoom({ hostId, hostName, hostAvatar, targetUrl, password = null, controlMode = 'anyone' }) {
    let roomId = this.generateRoomId();
    while (this.rooms.has(roomId)) {
      roomId = this.generateRoomId();
    }

    const room = {
      roomId,
      hostId,
      targetUrl: targetUrl || '',
      password: password ? password.trim() : null,
      controlMode: controlMode || 'anyone', // Default 'anyone' as requested
      createdAt: new Date().toISOString(),
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        playbackRate: 1,
        lastUpdated: Date.now()
      },
      members: new Map(), // socketId -> member object
      chatHistory: []
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Get room by ID
   */
  getRoom(roomId) {
    if (!roomId) return null;
    return this.rooms.get(roomId.toUpperCase().trim()) || null;
  }

  /**
   * Join user to room
   */
  joinRoom(roomId, { socketId, userId, name, avatar, verified = false, password = null }) {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.password && room.password !== password) {
      throw new Error('Invalid room password');
    }

    const isHost = room.members.size === 0 || room.hostId === userId;
    if (isHost && !room.hostId) {
      room.hostId = userId;
    }

    const member = {
      socketId,
      userId,
      name: name || 'Anonymous',
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      verified: !!verified,
      isHost,
      camOn: false,
      micOn: false,
      joinedAt: new Date().toISOString()
    };

    room.members.set(socketId, member);

    // System chat notification
    this.addChatMessage(room.roomId, {
      sender: 'System',
      text: `${member.name} joined the party! 🎉`,
      isSystem: true
    });

    return { room, member };
  }

  /**
   * Remove member from room by socketId
   */
  leaveRoom(socketId) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.members.has(socketId)) {
        const member = room.members.get(socketId);
        room.members.delete(socketId);

        // System chat notification
        this.addChatMessage(roomId, {
          sender: 'System',
          text: `${member.name} left the party.`,
          isSystem: true
        });

        // Reassign host if host left and members remain
        if (member.isHost && room.members.size > 0) {
          const nextSocketId = room.members.keys().next().value;
          const nextHost = room.members.get(nextSocketId);
          nextHost.isHost = true;
          room.hostId = nextHost.userId;

          this.addChatMessage(roomId, {
            sender: 'System',
            text: `👑 ${nextHost.name} is now the host!`,
            isSystem: true
          });
        }

        // Clean up empty room after 10 minutes if inactive
        if (room.members.size === 0) {
          setTimeout(() => {
            const currentRoom = this.rooms.get(roomId);
            if (currentRoom && currentRoom.members.size === 0) {
              this.rooms.delete(roomId);
            }
          }, 10 * 60 * 1000);
        }

        return { roomId, member, remainingMembers: Array.from(room.members.values()) };
      }
    }
    return null;
  }

  /**
   * Update video playback state (Play, Pause, Seek, Rate)
   */
  updatePlayback(roomId, { isPlaying, currentTime, playbackRate = 1, updatedBySocketId }) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const senderMember = room.members.get(updatedBySocketId);
    if (!senderMember) return null;

    // Check host-only permission if enabled
    if (room.controlMode === 'host_only' && !senderMember.isHost) {
      throw new Error('Only the host can control playback in this room');
    }

    room.playbackState = {
      isPlaying: !!isPlaying,
      currentTime: typeof currentTime === 'number' ? currentTime : room.playbackState.currentTime,
      playbackRate: typeof playbackRate === 'number' ? playbackRate : 1,
      lastUpdated: Date.now()
    };

    return { room, sender: senderMember };
  }

  /**
   * Update WebRTC Cam / Mic status for a member
   */
  updateMediaState(socketId, { camOn, micOn }) {
    for (const room of this.rooms.values()) {
      if (room.members.has(socketId)) {
        const member = room.members.get(socketId);
        if (typeof camOn === 'boolean') member.camOn = camOn;
        if (typeof micOn === 'boolean') member.micOn = micOn;
        return { roomId: room.roomId, member };
      }
    }
    return null;
  }

  /**
   * Add chat message to room history
   */
  addChatMessage(roomId, { sender, text, isSystem = false, userId = null }) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const msg = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      sender,
      userId,
      text: text ? text.trim() : '',
      timestamp: new Date().toISOString(),
      isSystem: !!isSystem
    };

    room.chatHistory.push(msg);
    if (room.chatHistory.length > 200) {
      room.chatHistory.shift(); // keep last 200 messages
    }
    return msg;
  }

  /**
   * Get formatted room snapshot for clients
   */
  getRoomSnapshot(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    // Calculate current live time if playing
    let liveCurrentTime = room.playbackState.currentTime;
    if (room.playbackState.isPlaying) {
      const elapsedSeconds = (Date.now() - room.playbackState.lastUpdated) / 1000;
      liveCurrentTime += elapsedSeconds * room.playbackState.playbackRate;
    }

    return {
      roomId: room.roomId,
      hostId: room.hostId,
      targetUrl: room.targetUrl,
      hasPassword: !!room.password,
      controlMode: room.controlMode,
      playbackState: {
        ...room.playbackState,
        liveCurrentTime
      },
      members: Array.from(room.members.values()),
      chatHistory: room.chatHistory
    };
  }
}

export const roomManager = new RoomManager();
