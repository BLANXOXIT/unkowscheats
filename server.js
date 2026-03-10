// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // npm i node-fetch@2
const bodyParser = require('body-parser');

const USERS_FILE = path.join(__dirname, 'users.json');
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN'; // set this securely

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve index.html from public/

// Simple users DB helpers
function loadUsers(){
  if(!fs.existsSync(USERS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(USERS_FILE)); } catch(e){ return {}; }
}
function saveUsers(u){ fs.writeFileSync(USERS_FILE, JSON.stringify(u, null, 2)); }

// Demo authentication: accept any username/password
app.post('/login', (req, res) => {
  const { username, password, deviceId } = req.body || {};
  if(!username || !password || !deviceId) return res.status(400).json({ message: 'Missing fields' });

  const users = loadUsers();
  if(!users[username]) {
    // create account with no hwid initially
    users[username] = { password: password, hwid: null };
  }

  // In real app: verify password properly
  // If account has no hwid, assign this deviceId as hwid (first login after reset)
  if(!users[username].hwid){
    users[username].hwid = deviceId;
    saveUsers(users);
    return res.json({ message: 'HWID assigned', hwid: users[username].hwid });
  }

  // If hwid exists, check match
  if(users[username].hwid !== deviceId){
    return res.status(403).json({ message: 'HWID mismatch', hwid: users[username].hwid });
  }

  // success
  return res.json({ message: 'Login OK', hwid: users[username].hwid });
});

// Reset HWID endpoint
app.post('/reset-hwid', async (req, res) => {
  const { username } = req.body || {};
  if(!username) return res.status(400).json({ message: 'Missing username' });

  const users = loadUsers();
  if(!users[username]) return res.status(404).json({ message: 'User not found' });

  const old = users[username].hwid;
  users[username].hwid = null;
  saveUsers(users);

  // Send Discord webhook notification (server-side only)
  try{
    const content = `HWID reset for user **${username}**\nPrevious HWID: ${old || 'none'}\nTime: ${new Date().toISOString()}`;
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  }catch(e){
    console.error('Webhook failed', e);
  }

  return res.json({ message: 'HWID reset' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on', PORT));
