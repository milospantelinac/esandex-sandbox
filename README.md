# Esandex Sandbox

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square&logo=github)](https://github.com/your-username/esandex-sandbox/pulls)
[![REST API](https://img.shields.io/badge/REST-API%20v1.0-orange?style=flat-square&logo=fastapi&logoColor=white)]()

A lightweight local sandbox server that simulates the [Esendex REST API v1.0](https://developers.esendex.com/api-reference). Designed for development and testing without hitting the live Esendex API or consuming message credits.

---

## ✨ Features

- 📨 **Send messages** via `POST /v1.0/messagedispatcher` — matches real Esendex request/response format exactly
- 📬 **Message headers** — query sent message history with pagination support
- 📥 **Inbox** — pre-seeded inbound messages for immediate testing
- 🏦 **Accounts** — mock UK account with real-world data format
- 🔓 **No auth required** — accepts any `Authorization` header, no credentials validated
- 🔁 **In-memory state** — all dispatched messages are stored for the lifetime of the server process
- ⚡ **Zero native dependencies** — runs on modern Node.js without compilation

---

## 📋 Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | `>= 18.x` |
| npm | `>= 9.x` |

---

## 🚀 Getting Started

### Install dependencies

```bash
npm install
```

### Start the server

```bash
npm start
```

For development with auto-restart on file changes:

```bash
npm run dev
```

The sandbox will be available at `http://localhost:3000`.

### Custom port

Set the `PORT` environment variable before starting:

```bash
PORT=8080 npm start
```

---

## 📡 API Endpoints

All endpoints mirror the [Esendex REST API v1.0](https://developers.esendex.com/api-reference) structure.

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1.0/accounts` | Returns a list of all accounts |
| `GET` | `/v1.0/accounts/:reference` | Returns a single account by reference |

#### `GET /v1.0/accounts`

```json
{
  "accounts": {
    "account": [
      {
        "uri": "/v1.0/accounts/EX0000000",
        "reference": "EX0000000",
        "label": "Sandbox Account",
        "address": "+447700900000",
        "type": "Mobile",
        "messagesremaining": 50,
        "expireson": "2030-01-01T00:00:00",
        "role": "PowerUser"
      }
    ],
    "startindex": 0,
    "count": 1,
    "totalcount": 1
  }
}
```

---

### Message Dispatcher

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1.0/messagedispatcher` | Dispatch one or more SMS messages |

#### Request body

```json
{
  "accountreference": "EX0000000",
  "messages": [
    {
      "to": "447700900123",
      "body": "Hello from the sandbox!"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountreference` | `string` | ✅ | Account reference (e.g. `EX0000000`) |
| `messages` | `array` | ✅ | Array of message objects |
| `messages[].to` | `string` | ✅ | Recipient phone number |
| `messages[].body` | `string` | ✅ | Message text content |
| `messages[].from` | `string` | ❌ | Sender (defaults to account address) |
| `messages[].type` | `string` | ❌ | `SMS` or `Voice` (defaults to `SMS`) |

#### Response — `202 Accepted`

```json
{
  "batch": {
    "batchid": "19aafc9c-b08a-400d-a9f1-afe3c46f0a25",
    "messageheaders": [
      {
        "uri": "/v1.0/messageheaders/72d91006-3b55-4f9a-9571-cf5da891dc4f",
        "id": "72d91006-3b55-4f9a-9571-cf5da891dc4f"
      }
    ]
  }
}
```

---

### Message Headers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1.0/messageheaders` | Returns a paginated list of sent messages |
| `GET` | `/v1.0/messageheaders/:id` | Returns a single sent message by ID |

#### Query parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `startIndex` | `0` | Pagination offset |
| `count` | `15` | Number of results to return |

---

### Inbox

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1.0/inbox/messages` | Returns a paginated list of received messages |
| `GET` | `/v1.0/inbox/messages/:id` | Returns a single received message by ID |
| `DELETE` | `/v1.0/inbox/messages/:id` | Deletes a message from the inbox |

---

## 🔧 Usage Examples

### curl

```bash
# List accounts
curl http://localhost:3000/v1.0/accounts

# Send a message
curl -X POST http://localhost:3000/v1.0/messagedispatcher \
  -H "Content-Type: application/json" \
  -d '{
    "accountreference": "EX0000000",
    "messages": [{ "to": "447700900123", "body": "Hello!" }]
  }'

# List sent messages
curl http://localhost:3000/v1.0/messageheaders

# List inbox
curl http://localhost:3000/v1.0/inbox/messages
```

### C# (HttpClient)

```csharp
var client = new HttpClient();
client.BaseAddress = new Uri("http://localhost:3000");

var payload = new
{
    accountreference = "EX0000000",
    messages = new[]
    {
        new { to = "447700900123", body = "Hello from C#!" }
    }
};

var response = await client.PostAsJsonAsync("/v1.0/messagedispatcher", payload);
// response.StatusCode == 202 Accepted
```

### JavaScript / Node.js (fetch)

```js
const response = await fetch('http://localhost:3000/v1.0/messagedispatcher', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountreference: 'EX0000000',
    messages: [{ to: '447700900123', body: 'Hello!' }]
  })
});

const data = await response.json();
console.log(data.batch.batchid);
```

---

## 🗂 Project Structure

```
esandex-sandbox/
├── server.js        # Express server — all routes and mock data
├── package.json     # Project manifest and scripts
├── .env             # Environment config (PORT)
└── README.md
```

---

## ⚠️ Limitations

- State is **in-memory only** — all dispatched messages are lost when the server restarts
- Only a **single mock account** (`EX0000000`) is available
- Message status is always `Submitted` and never transitions (no delivery receipts)
- No XML support — JSON only

---

## 🤝 Contributing

Contributions are welcome. Fork the repository, create a feature branch, and open a pull request.

```bash
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
```

---

## 📄 License

MIT