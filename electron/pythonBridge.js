const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

let pythonProcess = null;
let currentPort = null;
let notifyRenderer = null;
let restartAttempts = 0;
const MAX_RESTARTS = 3;

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function startPython(onEvent) {
  notifyRenderer = onEvent;
  const port = await findFreePort();
  currentPort = port;

  const isDev = process.env.NODE_ENV === 'development' || !require('electron').app.isPackaged;

  let cmd, args;
  if (isDev) {
    // Development: run Python source directly
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    cmd = pythonCmd;
    args = [path.join(__dirname, '../backend/main.py')];
  } else {
    // Production: run PyInstaller-compiled executable (no Python install needed)
    const exeName = process.platform === 'win32' ? 'nexus-backend.exe' : 'nexus-backend';
    cmd = path.join(process.resourcesPath, 'backend', exeName);
    args = [];
  }

  return new Promise((resolve, reject) => {
    pythonProcess = spawn(cmd, args, {
      env: { ...process.env, NEXUS_PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let ready = false;

    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      if (!ready && text.includes(`READY:${port}`)) {
        ready = true;
        restartAttempts = 0;
        if (notifyRenderer) notifyRenderer('python-ready', { port });
        resolve(port);
      }
      if (notifyRenderer) notifyRenderer('python-log', { level: 'info', msg: text.trim() });
    });

    pythonProcess.stderr.on('data', (data) => {
      const text = data.toString();
      if (!ready && text.includes(`READY:${port}`)) {
        ready = true;
        restartAttempts = 0;
        if (notifyRenderer) notifyRenderer('python-ready', { port });
        resolve(port);
      }
      if (notifyRenderer) notifyRenderer('python-log', { level: 'error', msg: text.trim() });
    });

    pythonProcess.on('close', (code) => {
      pythonProcess = null;
      if (notifyRenderer) notifyRenderer('python-crash', { code });
      if (!ready) reject(new Error(`Python exited with code ${code}`));
      attemptRestart();
    });

    // Timeout if Python doesn't start in 15s
    setTimeout(() => {
      if (!ready) reject(new Error('Python backend startup timeout'));
    }, 15000);
  });
}

function attemptRestart() {
  if (restartAttempts >= MAX_RESTARTS) return;
  restartAttempts++;
  setTimeout(() => {
    if (notifyRenderer) notifyRenderer('python-log', { level: 'warn', msg: `Restarting Python backend (attempt ${restartAttempts})...` });
    startPython(notifyRenderer).catch(console.error);
  }, 2000 * restartAttempts);
}

function stopPython() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}

function getPythonPort() {
  return currentPort;
}

module.exports = { startPython, stopPython, getPythonPort };
