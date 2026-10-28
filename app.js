// Gregorian Calendar
function toGregorianDate(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

async function getApiError(response, fallback) {
  let data;
  try {
    data = await response.json();
  } catch {
    return `${fallback} (HTTP ${response.status})`;
  }

  return data && typeof data.error === 'string'
    ? data.error
    : `${fallback} (HTTP ${response.status})`;
}

// UI Elements
const dateEl = document.getElementById('date');
const linksContainer = document.getElementById('linksContainer');
const getMoreBtn = document.getElementById('getMoreBtn');
const customSearchBtn = document.getElementById('customSearchBtn');
const customSearchModal = document.getElementById('customSearchModal');
const customSearchInput = document.getElementById('customSearchInput');
const runCustomSearchBtn = document.getElementById('runCustomSearchBtn');
const closeCustomSearchBtn = document.getElementById('closeCustomSearchBtn');
const toastEl = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  dateEl.textContent = toGregorianDate(new Date());
  
  // Load daily briefing on startup
  loadDailyBriefing();
  
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.log('Service Worker registration failed', err));
  }
});

// Load Daily Briefing
async function loadDailyBriefing() {
  try {
    linksContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Fetching daily intelligence links...</p>
      </div>
    `;

    const response = await fetch('/api/daily', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(await getApiError(response, 'Failed to load daily briefing'));
    }

    const data = await response.json();

    if (data.success && data.briefing) {
      displayBriefing(data.briefing);
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error loading briefing:', error);
    linksContainer.innerHTML = `
      <div class="error-state">
        <p class="error-message"></p>
        <button class="retry-btn" onclick="loadDailyBriefing()">Retry</button>
      </div>
    `;
    linksContainer.querySelector('.error-message').textContent =
      `⚠️ Failed to load: ${error.message}`;
  }
}

// Display Briefing
function displayBriefing(briefing) {
  if (!briefing.sections || !Array.isArray(briefing.sections)) {
    linksContainer.innerHTML = '<p>No briefing data available.</p>';
    return;
  }

  let html = '';
  
  briefing.sections.forEach(section => {
    html += `
      <div class="section">
        <h3>${section.emoji} ${section.title}</h3>
        <p class="section-description">${section.content}</p>
        <div class="links-grid">
          ${section.links.map(link => `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-card">
              <div class="link-title">${link.title}</div>
              <div class="link-description">${link.description}</div>
              <div class="link-url">${new URL(link.url).hostname}</div>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  });

  linksContainer.innerHTML = html;
}

// Get More Links
getMoreBtn.addEventListener('click', () => {
  loadDailyBriefing();
});

// Custom Search Modal
customSearchBtn.addEventListener('click', () => {
  customSearchModal.classList.add('show');
  customSearchInput.focus();
});

closeCustomSearchBtn.addEventListener('click', () => {
  customSearchModal.classList.remove('show');
});

customSearchModal.addEventListener('click', (e) => {
  if (e.target === customSearchModal) {
    customSearchModal.classList.remove('show');
  }
});

// Run Custom Search
runCustomSearchBtn.addEventListener('click', async () => {
  const instruction = customSearchInput.value.trim();
  
  if (!instruction) {
    showToast('Please enter a search instruction', 'error');
    return;
  }

  customSearchModal.classList.remove('show');
  customSearchInput.value = '';

  try {
    linksContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Searching with your custom instruction...</p>
      </div>
    `;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: instruction,
        history: []
      }),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response, 'Search failed'));
    }

    const data = await response.json();

    if (data.success) {
      // Parse links from response
      const links = extractLinks(data.response);
      displayCustomResults(links, data.response);
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Custom search error:', error);
    linksContainer.innerHTML = `
      <div class="error-state">
        <p class="error-message"></p>
        <button class="retry-btn" onclick="loadDailyBriefing()">Back to Daily Briefing</button>
      </div>
    `;
    linksContainer.querySelector('.error-message').textContent =
      `⚠️ Search failed: ${error.message}`;
  }
});

// Extract Links from Response
function extractLinks(text) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    links.push({
      title: match[1],
      url: match[2]
    });
  }
  
  return links;
}

// Display Custom Results
function displayCustomResults(links, fullResponse) {
  let html = `
    <div class="section">
      <h3>🔍 Custom Search Results</h3>
      <p class="section-description">${fullResponse}</p>
      <div class="links-grid">
  `;

  if (links.length > 0) {
    html += links.map(link => `
      <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-card">
        <div class="link-title">${link.title}</div>
        <div class="link-url">${new URL(link.url).hostname}</div>
      </a>
    `).join('');
  } else {
    html += '<p>No links found in response.</p>';
  }

  html += `
      </div>
    </div>
    <button class="back-btn" onclick="loadDailyBriefing()">← Back to Daily Briefing</button>
  `;

  linksContainer.innerHTML = html;
}

// Toast Notification
function showToast(message, type = 'success') {
  toastEl.textContent = message;
  toastEl.className = `toast ${type} show`;
  
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}
