import test from 'node:test';
import assert from 'node:assert/strict';
import { io as Client } from 'socket.io-client';
import { app, server, io } from '../src/index.js';

let serverUrl;
let serverPort;

test.before((t, done) => {
  if (server.listening) {
    serverPort = server.address().port;
    serverUrl = `http://localhost:${serverPort}`;
    done();
  } else {
    server.listen(0, () => {
      serverPort = server.address().port;
      serverUrl = `http://localhost:${serverPort}`;
      done();
    });
  }
});

test.after((t, done) => {
  io.close();
  server.close(() => {
    done();
    process.exit(0);
  });
});

test('REST API: Health Check Endpoint', async () => {
  const res = await fetch(`${serverUrl}/api/health`);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'Moviesparty Sync Engine');
});

test('REST API: Guest Auth & User Registration', async () => {
  // Guest auth
  const guestRes = await fetch(`${serverUrl}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'SpeedyViewer' })
  });
  const guestData = await guestRes.json();
  assert.equal(guestRes.status, 200);
  assert.equal(guestData.success, true);
  assert.ok(guestData.token);
  assert.equal(guestData.user.name, 'SpeedyViewer');

  // Register user
  const regRes = await fetch(`${serverUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'host@moviesparty.com', password: 'secretpassword123', name: 'HostUser' })
  });
  const regData = await regRes.json();
  assert.equal(regRes.status, 201);
  assert.equal(regData.success, true);
  assert.ok(regData.token);
  assert.equal(regData.user.email, 'host@moviesparty.com');

  // Login user
  const loginRes = await fetch(`${serverUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'host@moviesparty.com', password: 'secretpassword123' })
  });
  const loginData = await loginRes.json();
  assert.equal(loginRes.status, 200);
  assert.equal(loginData.success, true);
  assert.ok(loginData.token);
});

test('Socket.io: Room Creation & Password Protection', async () => {
  const hostClient = Client(serverUrl, { auth: { name: 'HostAlex' } });

  await new Promise((resolve) => hostClient.on('connect', resolve));

  // Create room with password
  const createRes = await new Promise((resolve) => {
    hostClient.emit('room:create', {
      targetUrl: 'https://netmirror.app/watch?id=movie123',
      password: 'mypassword',
      controlMode: 'anyone'
    }, resolve);
  });

  assert.equal(createRes.success, true);
  assert.ok(createRes.room.roomId.startsWith('PARTY-'));
  assert.equal(createRes.room.hasPassword, true);
  assert.equal(createRes.member.isHost, true);

  const roomId = createRes.room.roomId;

  // Friend attempts join with WRONG password
  const friendWrongPass = Client(serverUrl, { auth: { name: 'FriendWrong' } });
  await new Promise((resolve) => friendWrongPass.on('connect', resolve));

  const wrongJoinRes = await new Promise((resolve) => {
    friendWrongPass.emit('room:join', { roomId, password: 'wrong' }, resolve);
  });
  assert.equal(wrongJoinRes.success, false);
  assert.equal(wrongJoinRes.error, 'Invalid room password');
  friendWrongPass.close();

  // Friend joins with CORRECT password
  const friendClient = Client(serverUrl, { auth: { name: 'FriendBob' } });
  await new Promise((resolve) => friendClient.on('connect', resolve));

  const correctJoinRes = await new Promise((resolve) => {
    friendClient.emit('room:join', { roomId, password: 'mypassword' }, resolve);
  });

  assert.equal(correctJoinRes.success, true);
  assert.equal(correctJoinRes.member.name, 'FriendBob');
  assert.equal(correctJoinRes.room.members.length, 2);

  hostClient.close();
  friendClient.close();
});

test('Socket.io: Playback Synchronization (Play, Pause, Seek)', async () => {
  const hostClient = Client(serverUrl, { auth: { name: 'MovieHost' } });
  const friendClient = Client(serverUrl, { auth: { name: 'MovieFriend' } });

  await Promise.all([
    new Promise((resolve) => hostClient.on('connect', resolve)),
    new Promise((resolve) => friendClient.on('connect', resolve))
  ]);

  // Create room
  const createRes = await new Promise((resolve) => {
    hostClient.emit('room:create', { targetUrl: 'https://youtube.com/watch?v=123' }, resolve);
  });
  const roomId = createRes.room.roomId;

  // Join friend
  await new Promise((resolve) => {
    friendClient.emit('room:join', { roomId }, resolve);
  });

  // Friend listens for Play event emitted by Host
  const playPromise = new Promise((resolve) => {
    friendClient.on('sync:play', (data) => resolve(data));
  });

  // Host sends sync:play
  hostClient.emit('sync:play', { currentTime: 145.5 });

  const playData = await playPromise;
  assert.equal(playData.currentTime, 145.5);
  assert.equal(playData.sender, 'MovieHost');

  // Host listens for Pause event emitted by Friend (anyone can pause)
  const pausePromise = new Promise((resolve) => {
    hostClient.on('sync:pause', (data) => resolve(data));
  });

  // Friend sends sync:pause
  friendClient.emit('sync:pause', { currentTime: 180.2 });

  const pauseData = await pausePromise;
  assert.equal(pauseData.currentTime, 180.2);
  assert.equal(pauseData.sender, 'MovieFriend');

  hostClient.close();
  friendClient.close();
});

test('Socket.io: Chat Messaging & WebRTC Signaling Relay', async () => {
  const clientA = Client(serverUrl, { auth: { name: 'UserA' } });
  const clientB = Client(serverUrl, { auth: { name: 'UserB' } });

  await Promise.all([
    new Promise((resolve) => clientA.on('connect', resolve)),
    new Promise((resolve) => clientB.on('connect', resolve))
  ]);

  const createRes = await new Promise((resolve) => {
    clientA.emit('room:create', { targetUrl: 'https://netflix.com/watch/99' }, resolve);
  });
  const roomId = createRes.room.roomId;

  const joinRes = await new Promise((resolve) => {
    clientB.emit('room:join', { roomId }, resolve);
  });
  const clientBSocketId = joinRes.member.socketId;

  // Chat message test
  const chatPromise = new Promise((resolve) => {
    clientB.on('chat:message', (data) => resolve(data));
  });

  clientA.emit('chat:send', { text: 'Hey bro, popcorn ready!' });
  const chatMsg = await chatPromise;
  assert.equal(chatMsg.text, 'Hey bro, popcorn ready!');
  assert.equal(chatMsg.sender, 'UserA');

  // WebRTC offer signal relay test
  const offerPromise = new Promise((resolve) => {
    clientB.on('webrtc:offer', (data) => resolve(data));
  });

  clientA.emit('webrtc:offer', {
    targetSocketId: clientBSocketId,
    offer: { type: 'offer', sdp: 'dummy-sdp-data' }
  });

  const offerData = await offerPromise;
  assert.equal(offerData.offer.sdp, 'dummy-sdp-data');
  assert.equal(offerData.senderName, 'UserA');

  clientA.close();
  clientB.close();
});
