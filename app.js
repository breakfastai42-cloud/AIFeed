const TOPICS = {
  all: 'all topics',
  research: 'frontier research',
  economics: 'macroeconomics',
  knowledge: 'foundational knowledge',
  admissions: 'college admissions',
  learning: 'learning and cognitive science',
};

const dateEl = document.getElementById('date');
const linksContainer = document.getElementById('linksContainer');
const requestStatus = document.getElementById('requestStatus');
const instructionInput = document.getElementById('instructionInput');
const refreshBtn = document.getElementById('refreshBtn');
const getMoreBtn = document.getElementById('getMoreBtn');
const searchBtn = document.getElementById('searchBtn');
const toastEl = document.getElementById('toast');

let activeTopic = 'all';
let requestMode = 'replace';
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
  dateEl.textContent = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory',
  }).format(new Date());

  loadDailyBriefing();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => console.log('Service Worker registered'))
      .catch(error => console.error('Service Worker registration failed', error));
  }
});

document.getElementById('topicButtons').addEventListener('click', event => {
  const button = event.target.closest('[data-topic]');
  if (!button || isLoading) return;

  activeTopic = button.dataset.topic;
  document.querySelectorAll('.topic-btn').forEach(topicButton => {
    topicButton.classList.toggle('active', topicButton === button);
  });
  requestMode = 'replace';
  loadDailyBriefing();
});

document.querySelectorAll('.suggestion-btn').forEach(button => {
  button.addEventListener('click', () => {
    instructionInput.value = button.dataset.instruction;
    instructionInput.focus();
  });
});

document.getElementById('instructionForm').addEventListener('submit', event => {
  event.preventDefault();
  const instruction = instructionInput.value.trim();
  if (!instruction) {
    instructionInput.focus();
    showToast('Choose a suggestion or enter a search instruction.', 'error');
    return;
  }
  requestMode = 'replace';
  loadDailyBriefing(instruction);
});

refreshBtn.addEventListener('click', () => {
  requestMode = 'replace';
  loadDailyBriefing();
});

getMoreBtn.addEventListener('click', () => {
  requestMode = 'append';
  loadDailyBriefing(instructionInput.value.trim());
});

async function loadDailyBriefing(instruction = '') {
  if (isLoading) return;
  isLoading = true;
  const append = requestMode === 'append' && linksContainer.querySelector('.section');
  const previousContent = append ? linksContainer.innerHTML : '';
  const startTime = performance.now();

  setButtonsDisabled(true);
  requestStatus.textContent = 'Finding fresh links…';
  if (append) {
    getMoreBtn.textContent = 'Finding more…';
  } else {
    linksContainer.innerHTML = `
      <div class="loading-state"><div class="spinner"></div>
      <p>${instruction ? 'Searching for focused links…' : 'Preparing today’s links…'}</p></div>`;
  }

  try {
    const response = await fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: TOPICS[activeTopic],
        instruction,
        more: Boolean(append),
      }),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response, 'Could not load links'));
    }

    const data = await response.json();
    if (!data.success || !data.briefing) {
      throw new Error(data.error || 'The briefing response was empty.');
    }
    renderBriefing(data.briefing, append);
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    requestStatus.textContent = `Updated in ${seconds}s`;
    requestMode = 'replace';
  } catch (error) {
    console.error('Daily feed error:', error);
    if (append && previousContent) {
      linksContainer.innerHTML = previousContent;
    } else {
      linksContainer.innerHTML = '';
      const errorState = document.createElement('div');
      errorState.className = 'error-state';
      const message = document.createElement('p');
      message.textContent = `⚠️ ${error.message}`;
      const retry = document.createElement('button');
      retry.className = 'retry-btn';
      retry.type = 'button';
      retry.textContent = 'Try again';
      retry.addEventListener('click', () => loadDailyBriefing(instruction));
      errorState.append(message, retry);
      linksContainer.append(errorState);
    }
    requestStatus.textContent = `Could not update (${((performance.now() - startTime) / 1000).toFixed(1)}s)`;
  } finally {
    isLoading = false;
    setButtonsDisabled(false);
    getMoreBtn.textContent = 'Show me more links';
  }
}

async function getApiError(response, fallback) {
  try {
    const data = await response.json();
    return data && typeof data.error === 'string'
      ? data.error
      : `${fallback} (HTTP ${response.status})`;
  } catch {
    return `${fallback} (HTTP ${response.status})`;
  }
}

function renderBriefing(briefing, append) {
  if (!Array.isArray(briefing.sections)) {
    throw new Error('The briefing response did not contain sections.');
  }

  if (!append) linksContainer.replaceChildren();
  briefing.sections.forEach(section => {
    const sectionEl = document.createElement('article');
    sectionEl.className = 'section';

    const heading = document.createElement('h2');
    heading.textContent = `${section.emoji || '•'} ${section.title || 'Daily links'}`;
    sectionEl.append(heading);

    if (section.content) {
      const description = document.createElement('p');
      description.className = 'section-description';
      description.textContent = section.content;
      sectionEl.append(description);
    }

    const grid = document.createElement('div');
    grid.className = 'links-grid';
    (Array.isArray(section.links) ? section.links : []).forEach(link => {
      const url = safeHttpUrl(link.url);
      if (!url) return;

      const card = document.createElement('a');
      card.className = 'link-card';
      card.href = url.href;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';

      const title = document.createElement('div');
      title.className = 'link-title';
      title.textContent = link.title || url.hostname;
      card.append(title);
      if (link.description) {
        const description = document.createElement('div');
        description.className = 'link-description';
        description.textContent = link.description;
        card.append(description);
      }
      const host = document.createElement('div');
      host.className = 'link-url';
      host.textContent = url.hostname;
      card.append(host);
      grid.append(card);
    });
    sectionEl.append(grid);
    linksContainer.append(sectionEl);
  });

  if (!linksContainer.querySelector('.section')) {
    linksContainer.textContent = 'No links were returned. Try another topic or refresh.';
  }
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function setButtonsDisabled(disabled) {
  refreshBtn.disabled = disabled;
  getMoreBtn.disabled = disabled;
  searchBtn.disabled = disabled;
  document.querySelectorAll('.topic-btn').forEach(button => {
    button.disabled = disabled;
  });
}

function showToast(message, type = 'success') {
  toastEl.textContent = message;
  toastEl.className = `toast ${type} show`;
  setTimeout(() => toastEl.classList.remove('show'), 3000);
}
