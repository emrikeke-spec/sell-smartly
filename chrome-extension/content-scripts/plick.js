// Plick Auto-Fill Content Script (Swedish)
(async function() {
  const { selectedListing } = await chrome.storage.local.get('selectedListing');
  
  if (!selectedListing) {
    showNotification('Ingen annons vald. Klicka på tillägget för att välja en.');
    return;
  }
  
  await waitForElement('input, textarea');
  
  const fillBtn = createFillButton();
  
  fillBtn.addEventListener('click', async () => {
    fillBtn.textContent = 'Fyller i...';
    
    try {
      const optimized = optimizeForPlick(selectedListing);
      
      // Fill title
      const titleInput = document.querySelector('input[name="title"], input[placeholder*="titel"], input[placeholder*="Titel"], input[placeholder*="rubrik"]');
      if (titleInput) {
        setInputValue(titleInput, optimized.title);
      }
      
      // Fill description
      const descInput = document.querySelector('textarea[name="description"], textarea[placeholder*="beskriv"], textarea[placeholder*="Beskriv"]');
      if (descInput) {
        setInputValue(descInput, optimized.description);
      }
      
      // Fill price
      const priceInput = document.querySelector('input[name="price"], input[type="number"], input[placeholder*="pris"], input[placeholder*="Pris"], input[placeholder*="kr"]');
      if (priceInput) {
        setInputValue(priceInput, optimized.price.toString());
      }
      
      fillBtn.textContent = '✓ Klart!';
      fillBtn.style.background = '#22c55e';
      
      showNotification(`Ifylld: ${selectedListing.title}. Lägg till bilder och välj kategori manuellt.`);
      
    } catch (error) {
      console.error('Fill error:', error);
      fillBtn.textContent = 'Fel - Försök igen';
      fillBtn.style.background = '#ef4444';
    }
  });
})();

function optimizeForPlick(listing) {
  const conditionMap = {
    'new': 'Nytt med lappar',
    'like_new': 'Nyskick',
    'good': 'Bra skick',
    'fair': 'Okej skick',
    'poor': 'Slitet'
  };
  
  const title = `${listing.brand || ''} ${listing.title}`.trim().slice(0, 50);
  const condition = conditionMap[listing.condition] || 'Bra skick';
  
  // Convert USD to SEK (approximate)
  const sekPrice = Math.round(listing.base_price * 10.5);
  
  const description = `${listing.description || ''}

Storlek: ${listing.size || 'Se bilder'}
Märke: ${listing.brand || 'N/A'}
Skick: ${condition}

Snabb leverans! Skicka meddelande för frågor.`;

  return {
    title,
    description,
    price: sekPrice
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
  btn.textContent = '🇸🇪 Fyll i från Dashboard';
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
