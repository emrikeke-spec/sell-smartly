// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
  });
});

// Load saved settings
chrome.storage.local.get(['supabaseUrl', 'supabaseKey', 'userId'], (data) => {
  if (data.supabaseUrl) document.getElementById('supabaseUrl').value = data.supabaseUrl;
  if (data.supabaseKey) document.getElementById('supabaseKey').value = data.supabaseKey;
  if (data.userId) document.getElementById('userId').value = data.userId;
  
  if (data.supabaseUrl && data.supabaseKey && data.userId) {
    document.getElementById('statusDot').classList.add('connected');
    loadPendingListings();
  }
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', async () => {
  const supabaseUrl = document.getElementById('supabaseUrl').value.trim();
  const supabaseKey = document.getElementById('supabaseKey').value.trim();
  const userId = document.getElementById('userId').value.trim();
  
  if (!supabaseUrl || !supabaseKey || !userId) {
    showStatus('Please fill in all fields', 'error');
    return;
  }
  
  // Test connection
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/listings?user_id=eq.${userId}&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) throw new Error('Connection failed');
    
    chrome.storage.local.set({ supabaseUrl, supabaseKey, userId }, () => {
      showStatus('Connected successfully!', 'success');
      document.getElementById('statusDot').classList.add('connected');
      loadPendingListings();
      
      // Switch to listings tab
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector('[data-tab="listings"]').classList.add('active');
      document.getElementById('listings-tab').classList.add('active');
    });
  } catch (error) {
    showStatus('Connection failed. Check your settings.', 'error');
  }
});

function showStatus(message, type) {
  const el = document.getElementById('connectionStatus');
  el.textContent = message;
  el.className = type;
}

async function loadPendingListings() {
  const { supabaseUrl, supabaseKey, userId } = await chrome.storage.local.get(['supabaseUrl', 'supabaseKey', 'userId']);
  
  if (!supabaseUrl || !supabaseKey || !userId) return;
  
  try {
    // Use edge function to bypass RLS (extension can't authenticate as user)
    const response = await fetch(
      `${supabaseUrl}/functions/v1/extension-listings`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'x-user-id': userId
        }
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch');
    
    const listings = await response.json();
    
    const container = document.getElementById('pendingListings');
    
    if (listings.length === 0) {
      container.innerHTML = '<p class="empty-state">No listings ready to post</p>';
      return;
    }
    
    container.innerHTML = listings.map(listing => `
      <div class="card" data-listing-id="${listing.id}">
        <div class="listing-title">${listing.title}</div>
        <div class="listing-meta">${listing.brand || ''} • ${listing.size || ''} • $${listing.base_price}</div>
        <button class="btn secondary select-listing" data-id="${listing.id}">Select for Auto-Fill</button>
      </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.select-listing').forEach(btn => {
      btn.addEventListener('click', async () => {
        const listingId = btn.dataset.id;
        const listing = listings.find(l => l.id === listingId);
        
        // Store selected listing for content scripts
        await chrome.storage.local.set({ selectedListing: listing });
        
        // Update UI
        container.querySelectorAll('.select-listing').forEach(b => {
          b.textContent = 'Select for Auto-Fill';
          b.style.background = '#2a2a2a';
        });
        btn.textContent = '✓ Selected';
        btn.style.background = '#22c55e';
      });
    });
    
  } catch (error) {
    console.error('Failed to load listings:', error);
  }
}
