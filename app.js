// Ethiopian Calendar Converter
const ETHIOPIAN_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

const ETHIOPIAN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toEthiopianDate(date) {
  const ethiopianYear = date.getFullYear() - 8;
  let ethiopianMonth, ethiopianDay;
  
  const month = date.getMonth();
  const day = date.getDate();
  
  if (month >= 8) {
    ethiopianMonth = month - 8;
    ethiopianDay = day;
  } else {
    ethiopianMonth = month + 4;
    ethiopianDay = day;
  }
  
  const dayOfWeek = ETHIOPIAN_DAYS[date.getDay()];
  const monthName = ETHIOPIAN_MONTHS[ethiopianMonth];
  
  return `${dayOfWeek}, ${monthName} ${ethiopianDay}, ${ethiopianYear}`;
}

// UI Elements
const ethiopianDateEl = document.getElementById('ethiopianDate');
const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const toastEl = document.getElementById('toast');

// State
let conversationHistory = [];
let hasWelcome = true;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  ethiopianDateEl.textContent = toEthiopianDate(new Date());
  
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
    // Remove welcome message
    const welcome = chatContainer.querySelector('.welcome-message');
    if (welcome) {
      welcome.remove();
      hasWelcome = false;
    }

    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai';
    loadingDiv.innerHTML = `
      <div class="message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    chatContainer.appendChild(loadingDiv);
    scrollToBottom();

    const response = await fetch('/api/daily', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    loadingDiv.remove();

    if (!response.ok) {
      throw new Error('Failed to load daily briefing');
    }

    const data = await response.json();

    if (data.success && data.briefing) {
      displayDailyBriefing(data.briefing);
      conversationHistory.push({
        role: 'assistant',
        content: JSON.stringify(data.briefing)
      });
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error loading briefing:', error);
    addMessage('ai', `⚠️ Failed to load daily briefing: ${error.message}. Please try again.`);
  }
}

// Display Daily Briefing
function displayDailyBriefing(briefing) {
  if (!briefing.sections || !Array.isArray(briefing.sections)) {
    addMessage('ai', 'No briefing data available.');
    return;
  }

  briefing.sections.forEach(section => {
    const sectionHtml = `
      <div class="briefing-section">
        <h3>${section.emoji} ${section.title}</h3>
        <p>${section.content}</p>
        <div class="links-list">
          ${section.links.map(link => `
            <div class="link-item">
              <a href="${link.url}" target="_blank" rel="noopener noreferrer">
                ${link.title}
              </a>
              <p class="link-description">${link.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    addMessage('ai', sectionHtml, true);
  });

  // Add "New Briefing" button
  const buttonHtml = `
    <button class="new-briefing-btn" onclick="loadDailyBriefing()">
      🔄 Get New Briefing
    </button>
  `;
  addMessage('ai', buttonHtml, true);
}

// Add Message to Chat
function addMessage(role, content, isHtml = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  if (isHtml) {
    contentDiv.innerHTML = content;
  } else {
    contentDiv.textContent = content;
  }
  
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  messageDiv.appendChild(contentDiv);
  messageDiv.appendChild(timeDiv);
  chatContainer.appendChild(messageDiv);
  scrollToBottom();
}

// Scroll to Bottom
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Chat Form Submit
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const message = messageInput.value.trim();
  if (!message) return;

  // Remove welcome message if exists
  if (hasWelcome) {
    const welcome = chatContainer.querySelector('.welcome-message');
    if (welcome) {
      welcome.remove();
      hasWelcome = false;
    }
  }

  // Add user message
  addMessage('user', message);
  conversationHistory.push({ role: 'user', content: message });
  
  // Clear input
  messageInput.value = '';
  sendBtn.disabled = true;

  // Add loading indicator
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message ai';
  loadingDiv.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  chatContainer.appendChild(loadingDiv);
  scrollToBottom();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        history: conversationHistory
      }),
    });

    loadingDiv.remove();

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    const data = await response.json();

    if (data.success) {
      // Convert markdown links to HTML
      const htmlContent = data.response
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      
      addMessage('ai', htmlContent, true);
      conversationHistory.push({ role: 'assistant', content: data.response });
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Chat error:', error);
    loadingDiv.remove();
    addMessage('ai', `⚠️ Error: ${error.message}`);
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
  }
});

// Input Handler
messageInput.addEventListener('input', () => {
  sendBtn.disabled = !messageInput.value.trim();
});

// Suggestion Chips
document.querySelectorAll('.suggestion-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const prompt = chip.dataset.prompt;
    messageInput.value = prompt;
    sendBtn.disabled = false;
    messageInput.focus();
    chatForm.dispatchEvent(new Event('submit'));
  });
});

// Clear Chat
clearChatBtn.addEventListener('click', () => {
  if (confirm('Clear all messages?')) {
    chatContainer.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">🤖</div>
        <h2>Welcome to Intelligence Briefing AI</h2>
        <p>Ask me anything about science, economics, tech, or college admissions. I'll search the web and provide you with live links.</p>
        <div class="suggestion-chips">
          <button class="suggestion-chip" data-prompt="What's the latest breakthrough in quantum computing?">
            🔬 Quantum Computing
          </button>
          <button class="suggestion-chip" data-prompt="Latest macroeconomic policy changes">
            📈 Economics
          </button>
          <button class="suggestion-chip" data-prompt="Top college admissions strategies for Ivy League">
            🎓 Admissions
          </button>
          <button class="suggestion-chip" data-prompt="Latest AI technology trends">
            💻 AI & Tech
          </button>
        </div>
      </div>
    `;
    hasWelcome = true;
    conversationHistory = [];
    
    // Re-attach suggestion chip listeners
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        messageInput.value = prompt;
        sendBtn.disabled = false;
        messageInput.focus();
        chatForm.dispatchEvent(new Event('submit'));
      });
    });
  }
});

// Toast Notification
function showToast(message, type = 'success') {
  toastEl.textContent = message;
  toastEl.className = `toast ${type} show`;
  
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}
