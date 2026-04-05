/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(process.cwd(), 'session-log.json');

function appendLog(role, content) {
  let logs = [];
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf-8');
    logs = JSON.parse(raw);
  } catch {
    logs = [];
  }

  logs.push({
    timestamp: new Date().toISOString(),
    role,
    content,
  });

  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2) + '\n');
}

function logUser(content) {
  appendLog('user', content);
}

function logAssistant(content) {
  appendLog('assistant', content);
}

module.exports = { appendLog, logUser, logAssistant };
