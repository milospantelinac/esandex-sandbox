/**
 * Esandex Sandbox Server
 * Lightweight local sandbox for the Esendex REST API v1.0
 *
 * Start: node server.js
 * API available at: http://localhost:3000
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// MOCK DATA
// ============================================================

const accounts = [
  {
    uri: '/v1.0/accounts/EX0000000',
    reference: 'EX0000000',
    label: 'Sandbox Account',
    address: '+447700900000',
    type: 'Mobile',
    messagesremaining: 50,
    expireson: '2030-01-01T00:00:00',
    role: 'PowerUser',
    settings: {
      uri: '/v1.0/accounts/EX0000000/settings/messagingpreferences'
    }
  }
];

const messages = [];
const inboxMessages = [
  {
    id: uuidv4(),
    reference: 'EX0000000',
    status: 'Delivered',
    laststatusat: new Date().toISOString(),
    submittedat: new Date().toISOString(),
    type: 'SMS',
    to: { phonenumber: '447700900000', displayname: 'Test Contact' },
    from: { phonenumber: '447700900001', displayname: '' },
    summary: 'Sample inbound message in sandbox',
    body: { uri: '/v1.0/inbox/messages/sample001' },
    direction: 'Inbound',
    parts: 1,
    username: 'sandbox.user@example.co.uk'
  }
];

// ============================================================
// MIDDLEWARE
// ============================================================

function basicAuthMiddleware(req, res, next) {
  // Sandbox accepts all requests without credential validation
  next();
}

app.use(basicAuthMiddleware);

// ============================================================
// ACCOUNTS
// ============================================================

// GET /v1.0/accounts - List all accounts
app.get('/v1.0/accounts', (req, res) => {
  res.json({
    accounts: {
      account: accounts,
      startindex: 0,
      count: accounts.length,
      totalcount: accounts.length
    }
  });
});

// GET /v1.0/accounts/:reference - Single account
app.get('/v1.0/accounts/:reference', (req, res) => {
  const account = accounts.find(a => a.reference === req.params.reference);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json(account);
});

// ============================================================
// MESSAGE DISPATCHER
// ============================================================

// POST /v1.0/messagedispatcher - Send SMS message
app.post('/v1.0/messagedispatcher', (req, res) => {
  const body = req.body;

  if (!body || !body.accountreference) {
    return res.status(400).json({ error: 'Missing field "accountreference"' });
  }
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'Field "messages" is missing or empty' });
  }

  const batchId = uuidv4();
  const now = new Date().toISOString();
  const messageHeaders = [];

  body.messages.forEach((msg) => {
    const messageId = uuidv4();
    const newMessage = {
      id: messageId,
      batchid: batchId,
      uri: `/v1.0/messageheaders/${messageId}`,
      reference: body.accountreference,
      status: 'Submitted',
      laststatusat: now,
      submittedat: now,
      type: msg.type || 'SMS',
      to: { phonenumber: msg.to, displayname: '' },
      from: { phonenumber: msg.from || accounts[0].address, displayname: '' },
      summary: (msg.body || '').substring(0, 20) + ((msg.body || '').length > 20 ? '...' : ''),
      body: msg.body || '',
      direction: 'Outbound',
      parts: Math.ceil((msg.body || '').length / 160) || 1,
      username: 'sandbox.user@example.co.uk'
    };
    messages.push(newMessage);
    messageHeaders.push({ uri: newMessage.uri, id: messageId });
    console.log(`[SEND] Message dispatched -> ${msg.to}: "${msg.body || ''}"`);
  });

  // 202 Accepted - matches real Esendex API status code
  res.status(202).json({
    batch: {
      batchid: batchId,
      messageheaders: messageHeaders
    }
  });
});

// ============================================================
// MESSAGE HEADERS
// ============================================================

// GET /v1.0/messageheaders - List sent messages
app.get('/v1.0/messageheaders', (req, res) => {
  const startIndex = parseInt(req.query.startIndex) || 0;
  const count = parseInt(req.query.count) || 15;
  const page = messages.slice(startIndex, startIndex + count);

  res.json({
    messageheaders: {
      messageheader: page,
      startindex: startIndex,
      count: page.length,
      totalcount: messages.length
    }
  });
});

// GET /v1.0/messageheaders/:id - Single sent message
app.get('/v1.0/messageheaders/:id', (req, res) => {
  const message = messages.find(m => m.id === req.params.id);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.json(message);
});

// ============================================================
// INBOX
// ============================================================

// GET /v1.0/inbox/messages - List received messages
app.get('/v1.0/inbox/messages', (req, res) => {
  const startIndex = parseInt(req.query.startIndex) || 0;
  const count = parseInt(req.query.count) || 15;
  const page = inboxMessages.slice(startIndex, startIndex + count);

  res.json({
    messageheaders: {
      messageheader: page,
      startindex: startIndex,
      count: page.length,
      totalcount: inboxMessages.length
    }
  });
});

// GET /v1.0/inbox/messages/:id - Single received message
app.get('/v1.0/inbox/messages/:id', (req, res) => {
  const message = inboxMessages.find(m => m.id === req.params.id);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.json(message);
});

// DELETE /v1.0/inbox/messages/:id - Delete message from inbox
app.delete('/v1.0/inbox/messages/:id', (req, res) => {
  const idx = inboxMessages.findIndex(m => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }
  inboxMessages.splice(idx, 1);
  res.status(200).json({ message: 'Message deleted' });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log('===========================================');
  console.log('  Esandex Sandbox started!');
  console.log('===========================================');
  console.log(`  URL: http://localhost:${PORT}`);
  console.log('');
  console.log('  Available endpoints:');
  console.log(`  GET    http://localhost:${PORT}/v1.0/accounts`);
  console.log(`  GET    http://localhost:${PORT}/v1.0/accounts/:ref`);
  console.log(`  POST   http://localhost:${PORT}/v1.0/messagedispatcher`);
  console.log(`  GET    http://localhost:${PORT}/v1.0/messageheaders`);
  console.log(`  GET    http://localhost:${PORT}/v1.0/messageheaders/:id`);
  console.log(`  GET    http://localhost:${PORT}/v1.0/inbox/messages`);
  console.log(`  GET    http://localhost:${PORT}/v1.0/inbox/messages/:id`);
  console.log(`  DELETE http://localhost:${PORT}/v1.0/inbox/messages/:id`);
  console.log('===========================================');
  console.log('  Press Ctrl+C to stop the server');
  console.log('===========================================');
});
