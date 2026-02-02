class PlickAutomation {
  constructor(browser, log) {
    this.browser = browser;
    this.log = log;
    this.baseUrl = 'https://www.plick.se';
  }

  async getPage() {
    const pages = await this.browser.pages();
    let page = pages.find(p => p.url().includes('plick.se'));
    
    if (!page) {
      page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }
    
    return page;
  }

  async openLoginPage() {
    const page = await this.getPage();
    await page.goto(`${this.baseUrl}/logga-in`, { waitUntil: 'networkidle2' });
  }

  async checkSession() {
    try {
      const page = await this.getPage();
      await page.goto(`${this.baseUrl}/salj`, { waitUntil: 'networkidle2' });
      
      const url = page.url();
      return url.includes('/salj') && !url.includes('/logga-in');
    } catch (error) {
      return false;
    }
  }

  async postListing(listing, payload) {
    const page = await this.getPage();
    this.log('Navigating to Plick sell page...');
    
    await page.goto(`${this.baseUrl}/salj`, { waitUntil: 'networkidle2' });

    // Wait for the form to load
    await page.waitForSelector('input[name="title"]', { timeout: 10000 });

    // Upload photos
    if (listing.photos && listing.photos.length > 0) {
      this.log(`Would upload ${listing.photos.length} photos`);
    }

    // Fill in title (Swedish-optimized if available)
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

    // Fill in brand
    if (listing.brand) {
      const brandInput = await page.$('input[name="brand"]');
      if (brandInput) {
        await brandInput.type(listing.brand);
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        this.log(`Entered brand: ${listing.brand}`);
      }
    }

    // Select size
    if (listing.size) {
      await this.selectSize(page, listing.size);
    }

    // Select condition
    await this.selectCondition(page, listing.condition);

    // Fill in price (SEK)
    const price = payload?.platformPrice || listing.base_price;
    const priceInput = await page.$('input[name="price"]');
    if (priceInput) {
      await priceInput.type(String(Math.round(price)));
      this.log(`Entered price: ${price} kr`);
    }

    this.log('Listing form filled (submit disabled for safety)');
    
    return {
      platformUrl: null,
    };
  }

  async selectCategory(page, category) {
    // Map English categories to Swedish Plick categories
    const categoryMap = {
      'Tops': 'Toppar',
      'Bottoms': 'Byxor',
      'Outerwear': 'Jackor',
      'Footwear': 'Skor',
      'Accessories': 'Accessoarer',
      'Bags': 'Väskor',
      'Jewelry': 'Smycken',
      'Watches': 'Klockor',
    };

    try {
      await page.click('[data-testid="category-select"]');
      await page.waitForTimeout(300);
      const plickCategory = categoryMap[category] || category;
      await page.click(`text="${plickCategory}"`);
      this.log(`Selected category: ${plickCategory}`);
    } catch (error) {
      this.log(`Could not select category: ${error.message}`);
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
    // Map to Swedish condition names
    const conditionMap = {
      'new': 'Nytt med prislapp',
      'like_new': 'Nyskick',
      'good': 'Bra skick',
      'fair': 'Använt',
      'poor': 'Slitet',
    };

    try {
      await page.click('[data-testid="condition-select"]');
      await page.waitForTimeout(300);
      const plickCondition = conditionMap[condition] || 'Bra skick';
      await page.click(`text="${plickCondition}"`);
      this.log(`Selected condition: ${plickCondition}`);
    } catch (error) {
      this.log(`Could not select condition: ${error.message}`);
    }
  }

  async updateListing(listing, payload) {
    this.log('Update listing not yet implemented for Plick');
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
      await page.click('[data-testid="edit-listing"]');
      await page.waitForTimeout(300);
      await page.click('text="Ta bort"'); // Swedish for "Remove"
      await page.waitForTimeout(300);
      await page.click('text="Bekräfta"'); // Swedish for "Confirm"
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
      await page.click('[data-testid="edit-listing"]');
      await page.waitForTimeout(300);
      await page.click('text="Markera som såld"'); // Swedish for "Mark as sold"
      await page.waitForTimeout(300);
      await page.click('text="Bekräfta"');
      this.log('Marked as sold successfully');
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to mark as sold: ${error.message}`);
    }
  }
}

module.exports = { PlickAutomation };
