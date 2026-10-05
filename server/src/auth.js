import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'moviesparty-super-secret-key-2026';

// In-memory user database for lightweight high-performance auth
const usersDb = new Map();

/**
 * Generate JWT token for authenticated users or guests
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Register a new user
 */
export function registerUser(email, password, name) {
  if (!email || !password || !name) {
    throw new Error('Email, password, and name are required');
  }
  const normalizedEmail = email.toLowerCase().trim();
  if (usersDb.has(normalizedEmail)) {
    throw new Error('User already exists');
  }

  const user = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email: normalizedEmail,
    name: name.trim(),
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    verified: true,
    passwordHash: Buffer.from(password).toString('base64'), // Lightweight encoding for demo
    createdAt: new Date().toISOString()
  };

  usersDb.set(normalizedEmail, user);

  const token = generateToken({ id: user.id, email: user.email, name: user.name, verified: true });
  return { user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, verified: true }, token };
}

/**
 * Login existing user
 */
export function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const normalizedEmail = email.toLowerCase().trim();
  const user = usersDb.get(normalizedEmail);
  if (!user || user.passwordHash !== Buffer.from(password).toString('base64')) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken({ id: user.id, email: user.email, name: user.name, verified: true });
  return { user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, verified: true }, token };
}

/**
 * Create a Guest account with instant JWT token
 */
export function createGuestUser(customName) {
  const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
  const name = customName ? customName.trim() : `Guest_${guestId.substring(6, 10)}`;
  const user = {
    id: guestId,
    name: name,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
    verified: false,
    isGuest: true
  };

  const token = generateToken({ id: user.id, name: user.name, verified: false, isGuest: true });
  return { user, token };
}
