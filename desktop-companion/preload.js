const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Platform login
  loginPlatform: (platform) => ipcRenderer.invoke('login-platform', platform),
  checkPlatformSession: (platform) => ipcRenderer.invoke('check-platform-session', platform),
  
  // Tasks
  getPendingTasks: () => ipcRenderer.invoke('get-pending-tasks'),
  getTaskHistory: () => ipcRenderer.invoke('get-task-history'),
  
  // Event listeners
  onTaskStarted: (callback) => {
    ipcRenderer.on('task-started', (event, task) => callback(task));
  },
  onTaskCompleted: (callback) => {
    ipcRenderer.on('task-completed', (event, task) => callback(task));
  },
  onTaskFailed: (callback) => {
    ipcRenderer.on('task-failed', (event, data) => callback(data));
  },
  onLog: (callback) => {
    ipcRenderer.on('log', (event, message) => callback(message));
  },
});
