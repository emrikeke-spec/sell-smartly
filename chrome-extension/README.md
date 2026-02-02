# Reseller Companion - Chrome Extension

Auto-fill listings on Grailed, Vinted, and Plick directly from your dashboard.

## Installation

1. **Download the extension folder**
   - Export your project to GitHub (Settings → GitHub → Export)
   - Go to your GitHub repo and download the `chrome-extension` folder
   - **Extract the ZIP file** after downloading

2. **Find the correct folder**
   - Open the extracted folder
   - Keep navigating **until you see `manifest.json` directly** (not inside another subfolder)
   - This is the folder you need to select in Chrome

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `chrome-extension` folder

3. **Configure the extension**
   - Click the extension icon (puzzle piece) → Reseller Companion
   - Go to **Settings** tab
   - Enter your credentials:
     - **Supabase URL**: `https://jmzzuqtwjzjamsjssjtd.supabase.co`
     - **Supabase Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptenp1cXR3anpqYW1zanNzanRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg4MTIsImV4cCI6MjA4NTU1NDgxMn0.D8AC5VNUxIzkVxS0DvlFtg_s0ro2HfnEpxCwe2wn2CM`
     - **User ID**: Your user ID from the web app
   - Click **Save & Connect**

## Usage

1. **Select a listing**
   - Click the extension icon
   - Your ready listings appear under "Listings" tab
   - Click **Select for Auto-Fill** on the one you want to post

2. **Post to platforms**
   - Click one of the quick links (Grailed, Vinted, or Plick)
   - When the page loads, a purple **Auto-Fill** button appears
   - Click it to fill the form with your listing data
   - Add photos manually and submit!

## Notes

- Photos must be uploaded manually (browser security prevents auto-upload)
- Categories/tags may need manual selection depending on platform
- Prices are automatically converted (USD → EUR for Vinted, USD → SEK for Plick)
- Descriptions are optimized for each platform's audience

## Troubleshooting

### Button doesn't appear
- Make sure you're on the sell/new listing page
- Refresh the page and wait a few seconds
- Check that the extension is enabled in `chrome://extensions`

### "No listing selected"
- Click the extension icon and select a listing first
- Make sure you're connected (green dot in header)

### Form not filling correctly
- Some platforms update their UI frequently
- Try clicking individual fields and pasting manually (use Copy button in dashboard)
