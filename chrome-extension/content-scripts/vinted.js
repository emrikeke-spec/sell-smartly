// Vinted Auto-Fill Content Script
(async function() {
  const { selectedListing } = await chrome.storage.local.get('selectedListing');
  
  if (!selectedListing) {
    showNotification('No listing selected. Click the extension icon to select one.');
    return;
  }
  
  await waitForElement('input, textarea');
  
  const fillBtn = createFillButton();
  
  fillBtn.addEventListener('click', async () => {
    fillBtn.textContent = 'Filling...';
    
    try {
      const optimized = optimizeForVinted(selectedListing);
      
      // Fill title - Vinted uses various input structures
      const titleInput = document.querySelector('input[data-testid="title-input"], input[name="title"], input[placeholder*="title"], input[placeholder*="Title"]');
      if (titleInput) {
        setInputValue(titleInput, optimized.title);
      }
      
      // Fill description
      const descInput = document.querySelector('textarea[data-testid="description-input"], textarea[name="description"], textarea[placeholder*="description"], textarea[placeholder*="Describe"]');
      if (descInput) {
        setInputValue(descInput, optimized.description);
      }
      
      // Fill price
      const priceInput = document.querySelector('input[data-testid="price-input"], input[name="price"], input[type="number"], input[placeholder*="price"], input[placeholder*="Price"]');
      if (priceInput) {
        setInputValue(priceInput, optimized.price.toString());
      }
      
      fillBtn.textContent = '✓ Filled!';
      fillBtn.style.background = '#22c55e';
      
      showNotification(`Filled: ${selectedListing.title}. Add photos and select category manually.`);
      
    } catch (error) {
      console.error('Fill error:', error);
      fillBtn.textContent = 'Error - Try Again';
      fillBtn.style.background = '#ef4444';
    }
  });
})();

function optimizeForVinted(listing) {
  const conditionMap = {
    'new': 'New with tags',
    'like_new': 'New without tags',
    'good': 'Very good',
    'fair': 'Good',
    'poor': 'Satisfactory'
  };
  
  const title = `${listing.brand || ''} ${listing.title}`.trim().slice(0, 50);
  const condition = conditionMap[listing.condition] || 'Very good';
  
  // Convert USD to EUR (approximate)
  const eurPrice = Math.round(listing.base_price * 0.92);
  
  const description = `${listing.description || ''}

📏 Size: ${listing.size || 'See photos'}
🏷️ Brand: ${listing.brand || 'N/A'}
✨ Condition: ${condition}

Fast shipping! Feel free to make an offer or bundle for discount.`;

  return {
    title,
    description,
    price: eurPrice
  };
}

function setInputValue(input, value) {
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
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
    setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
  });
}

function createFillButton() {
  const btn = document.createElement('button');
  btn.textContent = '👗 Auto-Fill from Dashboard';
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
