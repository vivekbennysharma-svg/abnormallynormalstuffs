const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// GLOBAL MIDDLEWARE REGISTRY
app.use(cors());
app.use(express.json());

// Seed data to initialize the JSON database file if it's completely empty
const fallbackSeedData = [
  {
    id: 1717945000000,
    title: "the art of doing nothing — and why it matters",
    tag: "musings",
    emoji: "🌿",
    isArchived: false,
    excerpt: "We've been taught that productivity is the highest virtue. But what if purposeful rest is the actual deep work?",
    content: "We've been taught that productivity is the highest virtue. Hustle culture whispers that your worth is tied directly to your output.\n\n## the permission slip you didn't know you needed\n\nYou don't have to earn rest.",
    date: "June 9, 2026",
    likes: 14
  }
];

// ── INTERNAL FS STORAGE PIPE CONTROLLERS ────────────────────────────

// Read from JSON file safely
const parseDatabaseFile = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(fallbackSeedData, null, 2), 'utf8');
      return fallbackSeedData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (error) {
    console.error("Critical DB read file-fault:", error);
    return fallbackSeedData;
  }
};

// Write changes to JSON file cleanly
const writeDatabaseFile = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error("Critical DB write disk-fault:", error);
    return false;
  }
};

// ── ENDPOINTS / INTERFACE API ROUTES ───────────────────────────────

// API: Fetch all stored blog records
app.get('/api/posts', (req, res) => {
  try {
    const posts = parseDatabaseFile();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to access database storage context.' });
  }
});

// API: Commit creations/mutations/deletions down to disk
app.post('/api/posts', (req, res) => {
  try {
    const freshPayloadStack = req.body;
    
    // Safety check ensuring data integrity matches front-end expectations
    if (!Array.isArray(freshPayloadStack)) {
      return res.status(400).json({ error: 'Invalid payload configuration array structure.' });
    }
    
    const success = writeDatabaseFile(freshPayloadStack);
    if (!success) {
      return res.status(500).json({ error: 'Disk partition error occurred during save state.' });
    }
    
    res.json({ message: 'Database sync successfully flushed down to disk store.', count: freshPayloadStack.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal system fault processing request execution context.' });
  }
});

// OPTIONAL ACTIVE ROUTE FOR EXTENDING YOUR CONTACT FORM
// Allows tracking or terminal log trace visualization whenever visitors send an application message
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Cannot process an empty message dispatch payload.' });
    }
    
    // System diagnostics output stream print check 
    console.log(`\n📬 [New Contact Log Frame Received]:\nFrom: ${name || 'Anonymous'} (${email || 'No email left'})\nMessage: "${message}"\n`);
    
    // Note: If you ever want your machine to send out a automated text directly via code, 
    // you would drop a library extension like "nodemailer" inside here.
    
    res.json({ status: "success", info: "Contact notification successfully processed by the backend log frame." });
  } catch (error) {
    res.status(500).json({ error: 'Error processing messaging dispatcher components.' });
  }
});

// GLOBAL SYSTEM BOOT ROUTINES
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 BLOG BACKEND LIVE: http://localhost:${PORT}`);
  console.log(`📁 CONNECTED FILE STORAGE BASELINE: ${DB_FILE}`);
  console.log(`===================================================`);
});