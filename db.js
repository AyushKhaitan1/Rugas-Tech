import fs from 'fs';
import path from 'path';

const DB_DIR = path.resolve('./data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure DB directory and file exist
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ users: [], queues: [], tokens: [] }, null, 2),
      'utf8'
    );
  }
}

// Low-level helper to read data
function readData() {
  initDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading database file, returning empty structure:', error);
    return { users: [], queues: [], tokens: [] };
  }
}

// Low-level helper to write data atomically
function writeData(data) {
  initDb();
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, DB_FILE);
}

// Database controller
export const db = {
  // --- USERS ---
  getUsers() {
    return readData().users;
  },

  addUser(user) {
    const data = readData();
    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...user,
    };
    data.users.push(newUser);
    writeData(data);
    return newUser;
  },

  findUserByUsername(username) {
    const users = this.getUsers();
    return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  },

  // --- QUEUES ---
  getQueues() {
    return readData().queues;
  },

  getQueuesByManager(managerId) {
    return this.getQueues().filter((q) => q.managerId === managerId);
  },

  createQueue(name, managerId) {
    const data = readData();
    const newQueue = {
      id: 'q_' + Math.random().toString(36).substr(2, 9),
      name,
      managerId,
      createdAt: new Date().toISOString(),
    };
    data.queues.push(newQueue);
    writeData(data);
    return newQueue;
  },

  getQueueById(id) {
    return this.getQueues().find((q) => q.id === id);
  },

  deleteQueue(queueId) {
    const data = readData();
    data.queues = data.queues.filter((q) => q.id !== queueId);
    // Also remove or cancel all tokens associated with this queue
    data.tokens = data.tokens.filter((t) => t.queueId !== queueId);
    writeData(data);
  },

  // --- TOKENS ---
  getTokens() {
    return readData().tokens;
  },

  getTokensByQueue(queueId) {
    return this.getTokens().filter((t) => t.queueId === queueId);
  },

  createToken(queueId, personName, notes = '') {
    const data = readData();
    
    // Find matching tokens in the same queue to calculate token number
    const queueTokens = data.tokens.filter((t) => t.queueId === queueId);
    
    // Generate simple token number (incremental, starting at 101 per queue)
    const lastTokenNum = queueTokens.reduce((max, t) => {
      const num = parseInt(t.tokenNumber.split('-')[1]);
      return num > max ? num : max;
    }, 100);
    const newTokenNum = lastTokenNum + 1;
    const tokenNumber = `Q-${newTokenNum}`;

    // Get max position of currently waiting tokens in the queue
    const waitingTokens = queueTokens.filter((t) => t.status === 'waiting');
    const maxPosition = waitingTokens.reduce((max, t) => (t.position > max ? t.position : max), 0);

    const newToken = {
      id: 'tkn_' + Math.random().toString(36).substr(2, 9),
      queueId,
      tokenNumber,
      personName,
      notes,
      status: 'waiting', // waiting, serving, completed, cancelled
      position: maxPosition + 1,
      createdAt: new Date().toISOString(),
      servedAt: null,
      endedAt: null,
    };

    data.tokens.push(newToken);
    writeData(data);
    return newToken;
  },

  getTokenById(id) {
    return this.getTokens().find((t) => t.id === id);
  },

  updateToken(id, updates) {
    const data = readData();
    const tokenIndex = data.tokens.findIndex((t) => t.id === id);
    if (tokenIndex === -1) return null;

    const oldToken = data.tokens[tokenIndex];
    const updatedToken = {
      ...oldToken,
      ...updates,
    };

    // Auto calculate serving/completion timestamps if status changes
    if (updates.status && updates.status !== oldToken.status) {
      if (updates.status === 'serving') {
        updatedToken.servedAt = new Date().toISOString();
        // Clear waiting position once served
        updatedToken.position = 0;
      } else if (updates.status === 'completed' || updates.status === 'cancelled') {
        updatedToken.endedAt = new Date().toISOString();
        updatedToken.position = 0;
      }
    }

    data.tokens[tokenIndex] = updatedToken;
    writeData(data);
    return updatedToken;
  },

  moveToken(tokenId, direction) {
    const data = readData();
    const token = data.tokens.find((t) => t.id === tokenId);
    if (!token || token.status !== 'waiting') return null;

    // Get all waiting tokens for this queue, sorted by position
    const queueTokens = data.tokens
      .filter((t) => t.queueId === token.queueId && t.status === 'waiting')
      .sort((a, b) => a.position - b.position);

    const index = queueTokens.findIndex((t) => t.id === tokenId);
    if (index === -1) return null;

    let swapIndex = -1;
    if (direction === 'up' && index > 0) {
      swapIndex = index - 1;
    } else if (direction === 'down' && index < queueTokens.length - 1) {
      swapIndex = index + 1;
    }

    if (swapIndex !== -1) {
      const targetToken = queueTokens[swapIndex];
      // Swap positions in database
      const tokenInDb = data.tokens.find((t) => t.id === token.id);
      const targetInDb = data.tokens.find((t) => t.id === targetToken.id);
      
      const tempPos = tokenInDb.position;
      tokenInDb.position = targetInDb.position;
      targetInDb.position = tempPos;

      writeData(data);
      return { token: tokenInDb, target: targetInDb };
    }

    return null;
  },
};
