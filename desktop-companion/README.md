# Reseller Companion - Desktop App

A desktop companion app that automates posting to Grailed, Vinted, and Plick by polling a task queue from your web dashboard.

## Prerequisites

1. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
2. **Google Chrome** - The app uses Chrome for automation
3. **Your Supabase credentials** - From the web app

## Quick Start

### 1. Install Dependencies

```bash
cd desktop-companion
npm install
```

### 2. Run the App

```bash
npm start
```

### 3. Configure the App

1. Go to **Settings** tab
2. Enter your **Supabase URL**: `https://jmzzuqtwjzjamsjssjtd.supabase.co`
3. Enter your **Supabase Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptenp1cXR3anpqYW1zanNzanRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg4MTIsImV4cCI6MjA4NTU1NDgxMn0.D8AC5VNUxIzkVxS0DvlFtg_s0ro2HfnEpxCwe2wn2CM`
4. Enter your **User ID**: `f6ee0665-85eb-49e5-a935-6950172e1cde` (this is your current user ID)
5. Verify the **Chrome path** is correct for your system

### 4. Login to Platforms

1. Go to **Platforms** tab
2. Click **Login** for each platform (Grailed, Vinted, Plick)
3. Complete the login in the browser window that opens
4. The app saves your session locally

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web Dashboard │────▶│  Supabase Queue  │────▶│ Companion App   │
│   (Create task) │     │ (automation_tasks)│     │ (Execute task)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ Puppeteer       │
                                                 │ (Browser auto)  │
                                                 └─────────────────┘
```

1. **Web Dashboard**: Create listings and click "Post to All" or "Delist"
2. **Task Queue**: Tasks are stored in Supabase `automation_tasks` table
3. **Companion App**: Polls for pending tasks every 5 seconds
4. **Puppeteer**: Opens Chrome and fills in forms automatically

## Features

- 🔄 **Real-time polling** - Picks up tasks from your web dashboard
- 🔐 **Local sessions** - Platform logins stored securely on your machine
- 📊 **Task monitoring** - See pending and completed tasks
- 📝 **Activity logs** - Track what the automation is doing
- 🖥️ **System tray** - Runs in background, accessible from tray icon

## Platform Support

| Platform | Post | Update | Delist | Mark Sold |
|----------|------|--------|--------|-----------|
| Grailed  | ✅   | 🚧     | ✅     | ✅        |
| Vinted   | ✅   | 🚧     | ✅     | ✅        |
| Plick    | ✅   | 🚧     | ✅     | ✅        |

✅ = Implemented | 🚧 = In Progress

## Chrome Path Examples

**macOS:**
```
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

**Windows:**
```
C:\Program Files\Google\Chrome\Application\chrome.exe
```

**Linux:**
```
/usr/bin/google-chrome
```

## Troubleshooting

### "Chrome path not configured"
Make sure you've entered the correct path to your Chrome executable in Settings.

### "Not authenticated"
1. Check your Supabase URL and key are correct
2. Make sure your User ID matches your logged-in user in the web app

### Platform login not working
1. Try logging in manually in the Chrome window
2. Complete any CAPTCHA or 2FA challenges
3. The app will detect your session on the next check

### Tasks not executing
1. Check the Logs tab for error messages
2. Verify you're logged into the required platform
3. Make sure the automation isn't paused (check system tray)

## Security Notes

- Credentials are stored locally using `electron-store` (encrypted)
- Browser sessions use Chrome's built-in session storage
- The app never sends your platform passwords to any server
- All automation happens locally on your machine

## Development

```bash
# Run in dev mode with DevTools
npm run dev
```

## Building for Distribution

```bash
# Install electron-builder
npm install --save-dev electron-builder

# Build for your platform
npm run build
```

## License

MIT - Personal use only. Respect platform Terms of Service.
