// Grailed Auto-Fill Content Script
(async function() {
  // Check if we have a selected listing
  const { selectedListing } = await chrome.storage.local.get('selectedListing');
  
  if (!selectedListing) {
    showNotification('No listing selected. Click the extension icon to select one.');
    return;
  }
  
  // Wait for page to load
  await waitForElement('input[name="title"], input[placeholder*="title"]');
  
  // Show fill button
  const fillBtn = createFillButton();
  
  fillBtn.addEventListener('click', async () => {
    fillBtn.textContent = 'Filling...';
    
    try {
      // Optimize content for Grailed
      const optimized = optimizeForGrailed(selectedListing);
      
      // Fill title
      const titleInput = document.querySelector('input[name="title"], input[placeholder*="title"], input[aria-label*="title"]');
      if (titleInput) {
        setInputValue(titleInput, optimized.title);
      }
      
      // Fill description
      const descInput = document.querySelector('textarea[name="description"], textarea[placeholder*="description"], textarea[aria-label*="description"]');
      if (descInput) {
        setInputValue(descInput, optimized.description);
      }
      
      // Fill price
      const priceInput = document.querySelector('input[name="price"], input[placeholder*="price"], input[type="number"]');
      if (priceInput) {
        setInputValue(priceInput, optimized.price.toString());
      }
      
      fillBtn.textContent = '✓ Filled!';
      fillBtn.style.background = '#22c55e';
      
      showNotification(`Filled listing: ${selectedListing.title}. Review and add photos manually.`);
      
    } catch (error) {
      console.error('Fill error:', error);
      fillBtn.textContent = 'Error - Try Again';
      fillBtn.style.background = '#ef4444';
    }
  });
})();

function optimizeForGrailed(listing) {
  const conditionMap = {
    'new': 'New/Never Worn',
    'like_new': 'Gently Used',
    'good': 'Used',
    'fair': 'Very Worn',
    'poor': 'Not Specified'
  };
  
  const title = `${listing.brand || ''} ${listing.title}`.trim().slice(0, 60);
  const condition = conditionMap[listing.condition] || 'Used';
  
  const description = `${listing.description || ''}

Condition: ${condition}
Size: ${listing.size || 'See photos'}
Brand: ${listing.brand || 'N/A'}

Ships fast. Open to offers.`;

  return {
    title,
    description,
    price: listing.base_price
  };
}

function setInputValue(input, value) {
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

function createFillButton() {
  const btn = document.createElement('button');
  btn.textContent = '🏷️ Auto-Fill from Dashboard';
  btn.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 999999;
    padding: 12px 20px;
    background: #8b5cf6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  `;
  document.body.appendChild(btn);
  return btn;
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    padding: 12px 20px;
    background: #1a1a1a;
    color: #e5e5e5;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    font-size: 13px;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}
