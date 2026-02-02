// Tab navigation
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Show corresponding content
    const tabName = tab.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
  });
});

// Pre-filled configuration for this project
const DEFAULT_CONFIG = {
  supabaseUrl: 'https://jmzzuqtwjzjamsjssjtd.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptenp1cXR3anpqYW1zanNzanRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg4MTIsImV4cCI6MjA4NTU1NDgxMn0.D8AC5VNUxIzkVxS0DvlFtg_s0ro2HfnEpxCwe2wn2CM',
  userId: 'f6ee0665-85eb-49e5-a935-6950172e1cde',
};

// Load configuration on startup
async function loadConfig() {
  try {
    const config = await window.electronAPI.getConfig();
    
    // Use saved config or fall back to defaults
    document.getElementById('supabase-url').value = config.supabaseUrl || DEFAULT_CONFIG.supabaseUrl;
    document.getElementById('supabase-key').value = config.supabaseKey || DEFAULT_CONFIG.supabaseKey;
    document.getElementById('user-id').value = config.userId || DEFAULT_CONFIG.userId;
    document.getElementById('chrome-path').value = config.chromePath || getDefaultChromePath();

    // Update platform session statuses
    updatePlatformStatus('grailed', config.grailedLoggedIn);
    updatePlatformStatus('vinted', config.vintedLoggedIn);
    updatePlatformStatus('plick', config.plickLoggedIn);

    // Update connection status
    if (config.supabaseUrl && config.supabaseKey && config.userId) {
      setConnectionStatus(true);
    }
  } catch (error) {
    addLog(`Failed to load config: ${error.message}`, 'error');
  }
}

function getDefaultChromePath() {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('mac')) {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (platform.includes('win')) {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else {
    return '/usr/bin/google-chrome';
  }
}

// Save settings
document.getElementById('save-settings').addEventListener('click', async () => {
  const config = {
    supabaseUrl: document.getElementById('supabase-url').value,
    supabaseKey: document.getElementById('supabase-key').value,
    userId: document.getElementById('user-id').value,
    chromePath: document.getElementById('chrome-path').value,
  };

  try {
    await window.electronAPI.saveConfig(config);
    addLog('Settings saved successfully', 'success');
    setConnectionStatus(true);
  } catch (error) {
    addLog(`Failed to save settings: ${error.message}`, 'error');
  }
});

// Platform login handlers
document.getElementById('login-grailed').addEventListener('click', () => loginPlatform('grailed'));
document.getElementById('login-vinted').addEventListener('click', () => loginPlatform('vinted'));
document.getElementById('login-plick').addEventListener('click', () => loginPlatform('plick'));

async function loginPlatform(platform) {
  try {
    addLog(`Opening ${platform} login page...`);
    await window.electronAPI.loginPlatform(platform);
    
    // Check session after a delay (user needs time to log in)
    setTimeout(async () => {
      const isLoggedIn = await window.electronAPI.checkPlatformSession(platform);
      updatePlatformStatus(platform, isLoggedIn);
    }, 5000);
  } catch (error) {
    addLog(`Login failed: ${error.message}`, 'error');
  }
}

function updatePlatformStatus(platform, isLoggedIn) {
  const statusEl = document.getElementById(`${platform}-status`);
  if (isLoggedIn) {
    statusEl.textContent = 'Logged in';
    statusEl.classList.add('active');
  } else {
    statusEl.textContent = 'Not logged in';
    statusEl.classList.remove('active');
  }
}

function setConnectionStatus(connected) {
  const statusEl = document.getElementById('status');
  const dot = statusEl.querySelector('.status-dot');
  const text = statusEl.querySelector('span:last-child');
  
  if (connected) {
    dot.classList.remove('offline');
    dot.classList.add('online');
    text.textContent = 'Connected';
  } else {
    dot.classList.remove('online');
    dot.classList.add('offline');
    text.textContent = 'Disconnected';
  }
}

// Task updates
async function refreshTasks() {
  try {
    const { data: pendingTasks } = await window.electronAPI.getPendingTasks();
    const taskHistory = await window.electronAPI.getTaskHistory();

    renderPendingTasks(pendingTasks || []);
    renderTaskHistory(taskHistory || []);
  } catch (error) {
    console.error('Failed to refresh tasks:', error);
  }
}

function renderPendingTasks(tasks) {
  const container = document.getElementById('pending-tasks');
  
  if (tasks.length === 0) {
    container.innerHTML = '<p class="empty-state">No pending tasks</p>';
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="task-item">
      <div class="task-info">
        <span class="task-title">${task.action} on ${task.platform}</span>
        <span class="task-meta">${new Date(task.created_at).toLocaleString()}</span>
      </div>
      <span class="task-status ${task.status}">${task.status}</span>
    </div>
  `).join('');
}

function renderTaskHistory(tasks) {
  const container = document.getElementById('task-history');
  
  if (tasks.length === 0) {
    container.innerHTML = '<p class="empty-state">No recent activity</p>';
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="task-item">
      <div class="task-info">
        <span class="task-title">${task.action} on ${task.platform}</span>
        <span class="task-meta">${task.error_message || 'Completed successfully'}</span>
      </div>
      <span class="task-status ${task.status}">${task.status}</span>
    </div>
  `).join('');
}

// Logging
function addLog(message, type = 'info') {
  const container = document.getElementById('log-container');
  const entry = document.createElement('p');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  container.insertBefore(entry, container.firstChild);
}

document.getElementById('clear-logs').addEventListener('click', () => {
  document.getElementById('log-container').innerHTML = '';
});

// Event listeners from main process
window.electronAPI.onTaskStarted((task) => {
  addLog(`Task started: ${task.action} on ${task.platform}`);
  refreshTasks();
});

window.electronAPI.onTaskCompleted((task) => {
  addLog(`Task completed: ${task.action} on ${task.platform}`, 'success');
  refreshTasks();
});

window.electronAPI.onTaskFailed(({ task, error }) => {
  addLog(`Task failed: ${task.action} on ${task.platform} - ${error}`, 'error');
  refreshTasks();
});

window.electronAPI.onLog((message) => {
  addLog(message);
});

// Initialize
loadConfig();
setInterval(refreshTasks, 5000); // Refresh tasks every 5 seconds
refreshTasks();
