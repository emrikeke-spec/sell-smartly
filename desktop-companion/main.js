const { app, BrowserWindow, ipcMain, Tray, Menu, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { createClient } = require('@supabase/supabase-js');
const { AutomationRunner } = require('./automation/runner');

const store = new Store();
let mainWindow = null;
let tray = null;
let automationRunner = null;

// Supabase configuration - user must set these
const SUPABASE_URL = store.get('supabaseUrl') || '';
const SUPABASE_KEY = store.get('supabaseKey') || '';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  mainWindow.loadFile('renderer/index.html');

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'tray-icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open Dashboard', 
      click: () => mainWindow.show() 
    },
    { 
      label: 'Open Web App', 
      click: () => shell.openExternal('https://id-preview--f374b376-68d1-4f53-aed6-dc609a025d31.lovable.app') 
    },
    { type: 'separator' },
    { 
      label: 'Pause Automation', 
      type: 'checkbox',
      checked: false,
      click: (menuItem) => {
        if (automationRunner) {
          if (menuItem.checked) {
            automationRunner.pause();
          } else {
            automationRunner.resume();
          }
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Reseller Companion');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.show();
  });
}

async function initializeAutomation() {
  const supabaseUrl = store.get('supabaseUrl');
  const supabaseKey = store.get('supabaseKey');
  const userId = store.get('userId');

  if (!supabaseUrl || !supabaseKey || !userId) {
    console.log('Missing configuration, automation not started');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  automationRunner = new AutomationRunner(supabase, userId, store);
  automationRunner.on('taskStarted', (task) => {
    mainWindow?.webContents.send('task-started', task);
  });
  automationRunner.on('taskCompleted', (task) => {
    mainWindow?.webContents.send('task-completed', task);
  });
  automationRunner.on('taskFailed', (task, error) => {
    mainWindow?.webContents.send('task-failed', { task, error: error.message });
  });
  automationRunner.on('log', (message) => {
    mainWindow?.webContents.send('log', message);
  });

  automationRunner.start();
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return {
    supabaseUrl: store.get('supabaseUrl') || '',
    supabaseKey: store.get('supabaseKey') || '',
    userId: store.get('userId') || '',
    chromePath: store.get('chromePath') || '',
    grailedLoggedIn: store.get('grailedLoggedIn') || false,
    vintedLoggedIn: store.get('vintedLoggedIn') || false,
    plickLoggedIn: store.get('plickLoggedIn') || false,
  };
});

ipcMain.handle('save-config', (event, config) => {
  store.set('supabaseUrl', config.supabaseUrl);
  store.set('supabaseKey', config.supabaseKey);
  store.set('userId', config.userId);
  store.set('chromePath', config.chromePath);
  
  // Restart automation with new config
  if (automationRunner) {
    automationRunner.stop();
  }
  initializeAutomation();
  
  return true;
});

ipcMain.handle('login-platform', async (event, platform) => {
  if (!automationRunner) {
    throw new Error('Automation not initialized');
  }
  
  await automationRunner.loginToPlatform(platform);
  store.set(`${platform}LoggedIn`, true);
  return true;
});

ipcMain.handle('check-platform-session', async (event, platform) => {
  if (!automationRunner) {
    return false;
  }
  
  return automationRunner.checkSession(platform);
});

ipcMain.handle('get-pending-tasks', async () => {
  if (!automationRunner) {
    return [];
  }
  
  return automationRunner.getPendingTasks();
});

ipcMain.handle('get-task-history', async () => {
  if (!automationRunner) {
    return [];
  }
  
  return automationRunner.getTaskHistory();
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  initializeAutomation();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep running in tray on macOS
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (automationRunner) {
    automationRunner.stop();
  }
});
