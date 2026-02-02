class VintedAutomation {
  constructor(browser, log) {
    this.browser = browser;
    this.log = log;
    this.baseUrl = 'https://www.vinted.com';
  }

  async getPage() {
    const pages = await this.browser.pages();
    let page = pages.find(p => p.url().includes('vinted.'));
    
    if (!page) {
      page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }
    
    return page;
  }

  async openLoginPage() {
    const page = await this.getPage();
    await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
    
    // Click login button
    try {
      await page.click('[data-testid="header--login-button"]');
    } catch {
      // Try alternative selector
      await page.click('a[href*="login"]');
    }
  }

  async checkSession() {
    try {
      const page = await this.getPage();
      await page.goto(`${this.baseUrl}/items/new`, { waitUntil: 'networkidle2' });
      
      const url = page.url();
      return url.includes('/items/new');
    } catch (error) {
      return false;
    }
  }

  async postListing(listing, payload) {
    const page = await this.getPage();
    this.log('Navigating to Vinted sell page...');
    
    await page.goto(`${this.baseUrl}/items/new`, { waitUntil: 'networkidle2' });

    // Handle cookie consent if present
    try {
      await page.click('#onetrust-accept-btn-handler', { timeout: 2000 });
    } catch {
      // Cookie banner not present
    }

    // Wait for upload button
    await page.waitForSelector('[data-testid="add-photos-button"]', { timeout: 10000 });

    // Upload photos
    if (listing.photos && listing.photos.length > 0) {
      this.log(`Would upload ${listing.photos.length} photos`);
      // Real implementation would download and upload photos
    }

    // Fill in title
    const title = payload?.optimizedTitle || listing.title;
    const titleInput = await page.$('input[name="title"]');
    if (titleInput) {
      await titleInput.type(title);
      this.log(`Entered title: ${title}`);
    }

    // Fill in description
    const description = payload?.optimizedDescription || listing.description || '';
    const descriptionInput = await page.$('textarea[name="description"]');
    if (descriptionInput) {
      await descriptionInput.type(description);
      this.log('Entered description');
    }

    // Select category
    await this.selectCategory(page, listing.category);

    // Select brand
    if (listing.brand) {
      await this.selectBrand(page, listing.brand);
    }

    // Select size
    if (listing.size) {
      await this.selectSize(page, listing.size);
    }

    // Select condition
    await this.selectCondition(page, listing.condition);

    // Fill in price
    const price = payload?.platformPrice || listing.base_price;
    const priceInput = await page.$('input[name="price"]');
    if (priceInput) {
      await priceInput.type(String(price));
      this.log(`Entered price: €${price}`);
    }

    this.log('Listing form filled (submit disabled for safety)');
    
    return {
      platformUrl: null,
    };
  }

  async selectCategory(page, category) {
    try {
      await page.click('[data-testid="category-select"]');
      await page.waitForTimeout(300);
      
      // Map our categories to Vinted categories
      const categoryMap = {
        'Tops': 'Tops',
        'Bottoms': 'Trousers',
        'Outerwear': 'Jackets',
        'Footwear': 'Shoes',
        'Accessories': 'Accessories',
        'Bags': 'Bags',
      };
      
      const vintedCategory = categoryMap[category] || category;
      await page.click(`text="${vintedCategory}"`);
      this.log(`Selected category: ${vintedCategory}`);
    } catch (error) {
      this.log(`Could not select category: ${error.message}`);
    }
  }

  async selectBrand(page, brand) {
    try {
      const brandInput = await page.$('input[name="brand"]');
      if (brandInput) {
        await brandInput.type(brand);
        await page.waitForTimeout(500);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        this.log(`Selected brand: ${brand}`);
      }
    } catch (error) {
      this.log(`Could not select brand: ${error.message}`);
    }
  }

  async selectSize(page, size) {
    try {
      await page.click('[data-testid="size-select"]');
      await page.waitForTimeout(300);
      await page.click(`text="${size}"`);
      this.log(`Selected size: ${size}`);
    } catch (error) {
      this.log(`Could not select size: ${error.message}`);
    }
  }

  async selectCondition(page, condition) {
    const conditionMap = {
      'new': 'New with tags',
      'like_new': 'New without tags',
      'good': 'Very good',
      'fair': 'Good',
      'poor': 'Satisfactory',
    };

    try {
      await page.click('[data-testid="condition-select"]');
      await page.waitForTimeout(300);
      const vintedCondition = conditionMap[condition] || 'Good';
      await page.click(`text="${vintedCondition}"`);
      this.log(`Selected condition: ${vintedCondition}`);
    } catch (error) {
      this.log(`Could not select condition: ${error.message}`);
    }
  }

  async updateListing(listing, payload) {
    this.log('Update listing not yet implemented for Vinted');
    return { success: false };
  }

  async delistListing(listing, payload) {
    const platformUrl = payload?.platformUrl;
    if (!platformUrl) {
      throw new Error('No platform URL provided for delisting');
    }

    const page = await this.getPage();
    await page.goto(platformUrl, { waitUntil: 'networkidle2' });

    try {
      // Click edit/more options
      await page.click('[data-testid="item-actions"]');
      await page.waitForTimeout(300);
      await page.click('text="Delete"');
      await page.waitForTimeout(300);
      await page.click('text="Confirm"');
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

    try {
      await page.click('[data-testid="item-actions"]');
      await page.waitForTimeout(300);
      await page.click('text="Mark as sold"');
      await page.waitForTimeout(300);
      await page.click('text="Confirm"');
      this.log('Marked as sold successfully');
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to mark as sold: ${error.message}`);
    }
  }
}

module.exports = { VintedAutomation };
