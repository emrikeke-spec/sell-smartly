const EventEmitter = require('events');
const puppeteer = require('puppeteer-core');
const path = require('path');
const { GrailedAutomation } = require('./platforms/grailed');
const { VintedAutomation } = require('./platforms/vinted');
const { PlickAutomation } = require('./platforms/plick');

class AutomationRunner extends EventEmitter {
  constructor(supabase, userId, store) {
    super();
    this.supabase = supabase;
    this.userId = userId;
    this.store = store;
    this.browser = null;
    this.isRunning = false;
    this.isPaused = false;
    this.pollInterval = null;
    this.platformAutomation = {};
    this.taskHistory = [];
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.emit('log', 'Starting automation runner...');
    
    try {
      await this.initBrowser();
      await this.initPlatformAutomation();
      this.startPolling();
      this.emit('log', 'Automation runner started successfully');
    } catch (error) {
      this.emit('log', `Failed to start: ${error.message}`);
      this.isRunning = false;
    }
  }

  async initBrowser() {
    const chromePath = this.store.get('chromePath');
    
    if (!chromePath) {
      throw new Error('Chrome path not configured');
    }

    this.browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: false, // Show browser for login sessions
      defaultViewport: { width: 1280, height: 800 },
      userDataDir: path.join(require('os').homedir(), '.reseller-companion', 'chrome-data'),
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });

    this.emit('log', 'Browser initialized');
  }

  async initPlatformAutomation() {
    this.platformAutomation = {
      grailed: new GrailedAutomation(this.browser, this.emit.bind(this, 'log')),
      vinted: new VintedAutomation(this.browser, this.emit.bind(this, 'log')),
      plick: new PlickAutomation(this.browser, this.emit.bind(this, 'log')),
    };
  }

  startPolling() {
    // Poll every 5 seconds
    this.pollInterval = setInterval(async () => {
      if (this.isPaused) return;
      
      try {
        await this.processPendingTasks();
      } catch (error) {
        this.emit('log', `Polling error: ${error.message}`);
      }
    }, 5000);
    
    // Also run immediately
    this.processPendingTasks();
  }

  async processPendingTasks() {
    const { data: tasks, error } = await this.supabase
      .from('automation_tasks')
      .select('*, listings(*)')
      .eq('user_id', this.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      this.emit('log', `Failed to fetch tasks: ${error.message}`);
      return;
    }

    if (!tasks || tasks.length === 0) return;

    const task = tasks[0];
    await this.executeTask(task);
  }

  async executeTask(task) {
    this.emit('log', `Starting task: ${task.action} on ${task.platform}`);
    this.emit('taskStarted', task);

    // Mark as in_progress
    await this.supabase
      .from('automation_tasks')
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    try {
      const automation = this.platformAutomation[task.platform];
      if (!automation) {
        throw new Error(`Unknown platform: ${task.platform}`);
      }

      let result;
      switch (task.action) {
        case 'post':
          result = await automation.postListing(task.listings, task.payload);
          break;
        case 'update':
          result = await automation.updateListing(task.listings, task.payload);
          break;
        case 'delist':
          result = await automation.delistListing(task.listings, task.payload);
          break;
        case 'mark_sold':
          result = await automation.markSold(task.listings, task.payload);
          break;
        default:
          throw new Error(`Unknown action: ${task.action}`);
      }

      // Mark as completed
      await this.supabase
        .from('automation_tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      // Update platform_listings if we got a URL back
      if (result?.platformUrl) {
        await this.supabase
          .from('platform_listings')
          .update({
            status: 'listed',
            platform_url: result.platformUrl,
            listed_at: new Date().toISOString(),
          })
          .eq('listing_id', task.listing_id)
          .eq('platform', task.platform);
      }

      this.emit('log', `Task completed: ${task.action} on ${task.platform}`);
      this.emit('taskCompleted', task);
      this.taskHistory.unshift({ ...task, status: 'completed' });

    } catch (error) {
      // Mark as failed
      await this.supabase
        .from('automation_tasks')
        .update({ 
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
        })
        .eq('id', task.id);

      this.emit('log', `Task failed: ${error.message}`);
      this.emit('taskFailed', task, error);
      this.taskHistory.unshift({ ...task, status: 'failed', error_message: error.message });
    }
  }

  async loginToPlatform(platform) {
    const automation = this.platformAutomation[platform];
    if (!automation) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    this.emit('log', `Opening ${platform} login page...`);
    await automation.openLoginPage();
    this.emit('log', `Please log in to ${platform} in the browser window`);
  }

  async checkSession(platform) {
    const automation = this.platformAutomation[platform];
    if (!automation) return false;

    return automation.checkSession();
  }

  getPendingTasks() {
    return this.supabase
      .from('automation_tasks')
      .select('*')
      .eq('user_id', this.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
  }

  getTaskHistory() {
    return this.taskHistory.slice(0, 50);
  }

  pause() {
    this.isPaused = true;
    this.emit('log', 'Automation paused');
  }

  resume() {
    this.isPaused = false;
    this.emit('log', 'Automation resumed');
  }

  async stop() {
    this.isRunning = false;
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.emit('log', 'Automation runner stopped');
  }
}

module.exports = { AutomationRunner };
