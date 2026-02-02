class GrailedAutomation {
  constructor(browser, log) {
    this.browser = browser;
    this.log = log;
    this.baseUrl = 'https://www.grailed.com';
  }

  async getPage() {
    const pages = await this.browser.pages();
    let page = pages.find(p => p.url().includes('grailed.com'));
    
    if (!page) {
      page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }
    
    return page;
  }

  async openLoginPage() {
    const page = await this.getPage();
    await page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });
  }

  async checkSession() {
    try {
      const page = await this.getPage();
      await page.goto(`${this.baseUrl}/sell`, { waitUntil: 'networkidle2' });
      
      // Check if we're redirected to login
      const url = page.url();
      return !url.includes('/login');
    } catch (error) {
      return false;
    }
  }

  async postListing(listing, payload) {
    const page = await this.getPage();
    this.log('Navigating to Grailed sell page...');
    
    await page.goto(`${this.baseUrl}/sell`, { waitUntil: 'networkidle2' });

    // Wait for the form to load
    await page.waitForSelector('input[name="title"]', { timeout: 10000 });

    // Fill in title
    const title = payload?.optimizedTitle || listing.title;
    await page.type('input[name="title"]', title);
    this.log(`Entered title: ${title}`);

    // Upload photos
    if (listing.photos && listing.photos.length > 0) {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        // Note: In real implementation, you'd need to download photos first
        this.log(`Would upload ${listing.photos.length} photos`);
      }
    }

    // Fill in description
    const description = payload?.optimizedDescription || listing.description || '';
    const descriptionInput = await page.$('textarea[name="description"]');
    if (descriptionInput) {
      await descriptionInput.type(description);
      this.log('Entered description');
    }

    // Select category (simplified - real implementation needs more logic)
    // await this.selectCategory(page, listing.category);

    // Fill in price
    const price = payload?.platformPrice || listing.base_price;
    const priceInput = await page.$('input[name="price"]');
    if (priceInput) {
      await priceInput.type(String(price));
      this.log(`Entered price: $${price}`);
    }

    // Fill in size
    if (listing.size) {
      const sizeInput = await page.$('input[name="size"]');
      if (sizeInput) {
        await sizeInput.type(listing.size);
        this.log(`Entered size: ${listing.size}`);
      }
    }

    // Fill in brand
    if (listing.brand) {
      const brandInput = await page.$('input[name="designer"]');
      if (brandInput) {
        await brandInput.type(listing.brand);
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        this.log(`Entered brand: ${listing.brand}`);
      }
    }

    // Select condition
    await this.selectCondition(page, listing.condition);

    // Note: In production, you'd click the submit button
    // await page.click('button[type="submit"]');
    
    this.log('Listing form filled (submit disabled for safety)');
    
    // Return mock URL - in production, you'd extract the actual listing URL
    return {
      platformUrl: null, // Would be extracted after submission
    };
  }

  async selectCondition(page, condition) {
    const conditionMap = {
      'new': 'New/Never Worn',
      'like_new': 'Gently Used',
      'good': 'Used',
      'fair': 'Very Worn',
      'poor': 'Very Worn',
    };

    const grailedCondition = conditionMap[condition] || 'Used';
    
    // Click condition dropdown and select
    try {
      await page.click('[data-testid="condition-select"]');
      await page.waitForTimeout(300);
      await page.click(`text="${grailedCondition}"`);
      this.log(`Selected condition: ${grailedCondition}`);
    } catch (error) {
      this.log(`Could not select condition: ${error.message}`);
    }
  }

  async updateListing(listing, payload) {
    // Implementation for updating existing listing
    this.log('Update listing not yet implemented');
    return { success: false };
  }

  async delistListing(listing, payload) {
    const platformUrl = payload?.platformUrl;
    if (!platformUrl) {
      throw new Error('No platform URL provided for delisting');
    }

    const page = await this.getPage();
    await page.goto(platformUrl, { waitUntil: 'networkidle2' });

    // Find and click delete/delist button
    try {
      await page.click('[data-testid="delete-listing"]');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Confirm")');
      this.log('Listing delisted successfully');
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delist: ${error.message}`);
    }
  }

  async markSold(listing, payload) {
    const platformUrl = payload?.platformUrl;
    if (!platformUrl) {
      throw new Error('No platform URL provided');
    }

    const page = await this.getPage();
    await page.goto(platformUrl, { waitUntil: 'networkidle2' });

    // Find and click mark as sold button
    try {
      await page.click('[data-testid="mark-sold"]');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Confirm")');
      this.log('Marked as sold successfully');
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to mark as sold: ${error.message}`);
    }
  }
}

module.exports = { GrailedAutomation };
