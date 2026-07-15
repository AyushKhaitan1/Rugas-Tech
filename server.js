import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'rugas_queue_manager_secret_key_9988';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from Vite build in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
    }
    req.user = decoded;
    next();
  });
}

// --- AUTHENTICATION API ---

// Register Manager
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: 'Username must be at least 3 chars, and password at least 6 chars' });
    }

    const existingUser = db.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = db.addUser({
      username,
      passwordHash,
    });

    // Create JWT Token
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: newUser.id, username: newUser.username },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login Manager
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Verify session/Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});


// --- QUEUE MANAGEMENT API ---

// Get all queues managed by logged-in manager
app.get('/api/queues', authenticateToken, (req, res) => {
  try {
    const managerId = req.user.id;
    const queues = db.getQueuesByManager(managerId);
    
    // Enrich queues with token counts
    const allTokens = db.getTokens();
    const enrichedQueues = queues.map((q) => {
      const qTokens = allTokens.filter((t) => t.queueId === q.id);
      return {
        ...q,
        waitingCount: qTokens.filter((t) => t.status === 'waiting').length,
        servingCount: qTokens.filter((t) => t.status === 'serving').length,
        completedCount: qTokens.filter((t) => t.status === 'completed').length,
        cancelledCount: qTokens.filter((t) => t.status === 'cancelled').length,
      };
    });

    res.json(enrichedQueues);
  } catch (error) {
    console.error('Get queues error:', error);
    res.status(500).json({ error: 'Internal server error fetching queues' });
  }
});

// Create a new queue
app.post('/api/queues', authenticateToken, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Queue name is required' });
    }

    const managerId = req.user.id;
    const newQueue = db.createQueue(name.trim(), managerId);
    res.status(201).json(newQueue);
  } catch (error) {
    console.error('Create queue error:', error);
    res.status(500).json({ error: 'Internal server error creating queue' });
  }
});

// Get a specific queue details and its tokens
app.get('/api/queues/:id', authenticateToken, (req, res) => {
  try {
    const queueId = req.params.id;
    const queue = db.getQueueById(queueId);

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    // Security check: Only the manager who owns this queue can view it
    if (queue.managerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this queue' });
    }

    const tokens = db.getTokensByQueue(queueId);
    
    // Sort tokens:
    // - Waiting tokens sorted by position ASC
    // - Serving tokens sorted by servedAt DESC
    // - Completed/Cancelled sorted by endedAt DESC
    const waiting = tokens.filter((t) => t.status === 'waiting').sort((a, b) => a.position - b.position);
    const serving = tokens.filter((t) => t.status === 'serving').sort((a, b) => new Date(b.servedAt) - new Date(a.servedAt));
    const history = tokens
      .filter((t) => t.status === 'completed' || t.status === 'cancelled')
      .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt));

    res.json({
      ...queue,
      tokens: {
        waiting,
        serving,
        history,
      },
    });
  } catch (error) {
    console.error('Get queue detail error:', error);
    res.status(500).json({ error: 'Internal server error fetching queue details' });
  }
});

// Delete a queue
app.delete('/api/queues/:id', authenticateToken, (req, res) => {
  try {
    const queueId = req.params.id;
    const queue = db.getQueueById(queueId);

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    if (queue.managerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.deleteQueue(queueId);
    res.json({ message: 'Queue deleted successfully' });
  } catch (error) {
    console.error('Delete queue error:', error);
    res.status(500).json({ error: 'Internal server error deleting queue' });
  }
});


// --- TOKEN OPERATIONS ---

// Add a person (token) to the queue
app.post('/api/queues/:id/tokens', authenticateToken, (req, res) => {
  try {
    const queueId = req.params.id;
    const { personName, notes } = req.body;

    if (!personName || personName.trim() === '') {
      return res.status(400).json({ error: 'Person name is required' });
    }

    const queue = db.getQueueById(queueId);
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    if (queue.managerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newToken = db.createToken(queueId, personName.trim(), notes ? notes.trim() : '');
    res.status(201).json(newToken);
  } catch (error) {
    console.error('Add token error:', error);
    res.status(500).json({ error: 'Internal server error adding customer' });
  }
});

// Assign the token at the top of the queue for service
app.post('/api/tokens/:id/serve', authenticateToken, (req, res) => {
  try {
    const tokenId = req.params.id;
    const token = db.getTokenById(tokenId);

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const queue = db.getQueueById(token.queueId);
    if (queue.managerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Move token status to serving
    const updated = db.updateToken(tokenId, { status: 'serving' });
    res.json(updated);
  } catch (error) {
    console.error('Serve token error:', error);
    res.status(500).json({ error: 'Internal server error updating token' });
  }
});

// Mark serving customer as completed
app.post('/api/tokens/:id/complete', authenticateToken, (req, res) => {
  try {
    const tokenId = req.params.id;
    const token = db.getTokenById(tokenId);

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const queue = db.getQueueById(token.queueId);
    if (queue.managerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = db.updateToken(tokenId, { status: 'completed' });
    res.json(updated);
  } catch (error) {
    console.error('Complete token error:', error);
    res.status(500).json({ error: 'Internal server error completing service' });
  }
});

// Cancel a token
app.post('/api/tokens/:id/cancel', authenticateToken, (req, res) => {
  try {
    const tokenId = req.params.id;
    const token = db.getTokenById(tokenId);

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const queue = db.getQueueById(token.queueId);
    if (queue.managerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = db.updateToken(tokenId, { status: 'cancelled' });
    res.json(updated);
  } catch (error) {
    console.error('Cancel token error:', error);
    res.status(500).json({ error: 'Internal server error cancelling token' });
  }
});

// Reorder token: Move up or down
app.post('/api/tokens/:id/move', authenticateToken, (req, res) => {
  try {
    const tokenId = req.params.id;
    const { direction } = req.body; // 'up' or 'down'

    if (direction !== 'up' && direction !== 'down') {
      return res.status(400).json({ error: 'Invalid move direction, must be up or down' });
    }

    const token = db.getTokenById(tokenId);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const queue = db.getQueueById(token.queueId);
    if (queue.managerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = db.moveToken(tokenId, direction);
    if (!result) {
      return res.status(400).json({ error: 'Cannot move token in that direction (boundary reached or invalid status)' });
    }

    res.json({ message: 'Token reordered successfully', ...result });
  } catch (error) {
    console.error('Move token error:', error);
    res.status(500).json({ error: 'Internal server error reordering token' });
  }
});


// --- ANALYTICS DASHBOARD API ---

app.get('/api/analytics', authenticateToken, (req, res) => {
  try {
    const managerId = req.user.id;
    const queues = db.getQueuesByManager(managerId);
    const queueIds = queues.map((q) => q.id);

    const allTokens = db.getTokens().filter((t) => queueIds.includes(t.queueId));

    // Stats calculations
    const waitingTokens = allTokens.filter((t) => t.status === 'waiting');
    const servingTokens = allTokens.filter((t) => t.status === 'serving');
    const completedTokens = allTokens.filter((t) => t.status === 'completed');
    const cancelledTokens = allTokens.filter((t) => t.status === 'cancelled');

    // Average Wait Time (Created to Served)
    // Only count tokens that have been served (status: serving, completed, or cancelled with a servedAt)
    const servedTokensList = allTokens.filter((t) => t.servedAt);
    let avgWaitTimeSeconds = 0;
    if (servedTokensList.length > 0) {
      const totalWaitTimeMs = servedTokensList.reduce((sum, t) => {
        const waitMs = new Date(t.servedAt) - new Date(t.createdAt);
        return sum + Math.max(0, waitMs);
      }, 0);
      avgWaitTimeSeconds = Math.round(totalWaitTimeMs / servedTokensList.length / 1000);
    }

    // Cancellation rate
    const totalEnded = completedTokens.length + cancelledTokens.length;
    const cancellationRate = totalEnded > 0 ? Math.round((cancelledTokens.length / totalEnded) * 100) : 0;

    // Queue length trend (Grouped by date over past 7 days)
    const trendData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      // Find tokens created on or before this day, and either active or completed/cancelled on/after this day
      // For simplicity, we can count total tokens created on this day as volume, or count length
      const dayTokens = allTokens.filter((t) => t.createdAt.startsWith(dateStr));
      
      trendData.push({
        date: dateStr,
        displayDate: displayStr,
        created: dayTokens.length,
        served: dayTokens.filter((t) => t.servedAt).length,
        cancelled: dayTokens.filter((t) => t.status === 'cancelled').length,
      });
    }

    // Hourly Traffic Distribution (Busiest Hours, 0-23)
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      displayHour: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`,
      count: 0,
    }));

    allTokens.forEach((t) => {
      const date = new Date(t.createdAt);
      const hour = date.getHours();
      hourlyData[hour].count += 1;
    });

    // Busiest hour
    const busiest = hourlyData.reduce((max, h) => (h.count > max.count ? h : max), { hour: -1, count: 0 });

    res.json({
      summary: {
        activeQueues: queues.length,
        waitingCount: waitingTokens.length,
        servingCount: servingTokens.length,
        completedCount: completedTokens.length,
        cancelledCount: cancelledTokens.length,
        avgWaitTimeSeconds,
        cancellationRate,
        busiestHour: busiest.count > 0 ? busiest.displayHour : 'N/A',
      },
      queueTrends: trendData,
      hourlyDistribution: hourlyData.filter(h => h.count > 0 || (h.hour >= 9 && h.hour <= 18)), // show standard business hours at least
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error computing analytics' });
  }
});


// Catch-all route to serve Vite index.html in production
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).send('Vite build not found. Running in Development mode? Connect via Vite dev server.');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Queue Management Backend running on port ${PORT}`);
  console.log(`  Server Mode: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);
  console.log(`==================================================`);
});
