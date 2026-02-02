

## Multi-Platform Fashion Reseller Dashboard

A personal tool to streamline listing across Grailed, Vinted, and Plick from one unified interface.

---

### Core Concept

Since Grailed, Vinted, and Plick don't offer public listing APIs, we'll build a **smart listing preparation and automation system** with two operational modes:

1. **Guided Mode**: Generates platform-optimized content you can quickly copy to each platform
2. **Automation Mode** (Phase 2): Browser automation that posts directly to platforms

---

### Phase 1: Listing Hub & Smart Content Generation

**Unified Listing Form**
- Upload photos once (stored in cloud storage)
- Enter item details: title, description, brand, size, condition, price
- Select category and add tags
- Auto-generate platform-specific versions

**Platform Optimization Engine**
- **Grailed**: Menswear-focused titles, streetwear/designer tags, USD pricing with Grailed fee calculation
- **Vinted**: EU-friendly descriptions, metric sizing, EUR pricing, shipping-focused format
- **Plick**: Swedish language option, SEK pricing, local category mapping

**Price Intelligence**
- Set base price, auto-calculate platform-adjusted prices
- Account for platform fees (Grailed ~9%, Vinted ~5%, Plick varies)
- Optional markup/markdown per platform

**Dashboard**
- All listings with status per platform (Draft, Listed, Sold)
- Quick actions: Edit, Mark as Sold, Archive
- Inventory overview with filters

---

### Phase 2: Inventory Sync & Bulk Operations

**Cross-Platform Inventory Sync**
- Mark item sold on one platform → flag for removal on others
- Manual or one-click delist workflow

**Bulk Upload**
- CSV/spreadsheet import for power sellers
- Template-based quick listing for similar items
- Batch photo upload and processing

---

### Phase 3: Browser Automation via Desktop Companion App ✅ Infrastructure Ready

**Architecture**
- **Web Dashboard**: Manages listings, generates optimized content, queues automation tasks
- **Desktop Companion App** (Electron): Runs Puppeteer locally on your computer
  - Polls the automation queue for pending tasks
  - Executes browser automation using your logged-in sessions
  - Reports task status back to the dashboard

**Automation Task Queue** (Implemented)
- `automation_tasks` table tracks: post, update, delist, mark_sold actions
- Tasks have status: pending → in_progress → completed/failed
- Real-time polling (5s interval) for companion app

**Direct Platform Posting**
- Login once in the companion app, store sessions locally
- One-click publish to all three platforms from the web dashboard
- Status monitoring and retry handling
- Error messages propagate back to the dashboard

**Desktop App Features** (To be built separately)
- Electron app with embedded Chromium
- Platform session management (Grailed, Vinted, Plick)
- Background task runner with system tray
- Auto-update capability

*Note: The companion app runs locally to respect platform ToS by using real browser sessions*

---

### Technical Approach

- **Frontend**: Clean React dashboard with drag-drop photo upload
- **Backend**: Supabase for database, authentication, and file storage
- **Image Handling**: Optimized image compression and storage
- **Automation**: Local Electron app + Puppeteer for browser automation

---

### What You'll Get

1. **Single source of truth** for all your listings
2. **Platform-optimized content** generated instantly
3. **Price management** across platforms with fee calculations
4. **Status tracking** to know where each item is listed
5. **Time savings** from not recreating listings manually
6. **One-click cross-posting** via desktop companion app
7. **Automated delisting** when items sell


