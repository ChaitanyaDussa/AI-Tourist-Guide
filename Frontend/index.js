// --- Constants ---
const VOICES = {
  English: { Male: "Matthew", Female: "Alicia" },
  Hindi: { Male: "Aman", Female: "Namrita" },
  Tamil: { Male: "Murali", Female: "Iniya" },
  Telugu: { Male: "Zion", Female: "Josie" }
};

const LOCALES = {
  English: "en-US",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN"
};


// --- State ---
const state = {
  place: '',
  image: '',
  length: 'Summary',
  voice: 'Male'
};

// --- DOM Elements ---
const cardsContainer = document.querySelector('.cards');
const experiencePanel = document.getElementById('experience');
const previewTitle = document.getElementById('previewTitle');
const audioSection = document.getElementById('audioSection');
const audioPlayer = document.getElementById('audioPlayer');
const transcriptText = document.getElementById('scriptText');
const generateButton = document.getElementById('generateBtn');
const languageSelect = document.getElementById('selectLanguage');
const closeButton = document.getElementById('closeExperience');
const searchPreviewCard = document.getElementById('searchPreviewCard');
const searchPreviewImage = document.getElementById('searchPreviewImage');
const searchPreviewTitle = document.getElementById('searchPreviewTitle');
const transcriptToggle = document.getElementById('transcriptToggle');
const transcriptContent = document.getElementById('transcriptContent');
const transcriptArrow = document.getElementById('transcriptArrow');
const itineraryButton = document.getElementById('itineraryBtn');
const itineraryResult = document.getElementById('itineraryResult');
const daysSelect = document.getElementById('selectDays');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const tripNotesInput = document.getElementById('tripNotes');
const guideNotesInput = document.getElementById('guideNotes');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendButton = document.getElementById('chatSendBtn');
const chatHistory = [];

// --- Functions ---

function selectDestination(place, image, clickedCard = null) {
  state.place = place;
  state.image = image;

  // Update UI content
  previewTitle.textContent = place;
  cardsContainer.classList.add('faded');

  // Reset previous states
  document.querySelectorAll('.place-card').forEach(card => card.classList.remove('active'));
  searchPreviewCard.classList.add('hidden');

  // Handle Card Visibility
  if (clickedCard) {
    clickedCard.classList.add('active');
  } else {
    // If it's a search result, show the preview card
    searchPreviewImage.src = image;
    searchPreviewTitle.textContent = place;
    searchPreviewCard.classList.remove('hidden');
    searchPreviewCard.classList.add('active');
  }

  // Reset Audio Panel
  audioSection.classList.add('hidden');
  audioPlayer.src = '';
  transcriptText.textContent = '';
  generateButton.textContent = 'Generate Audio Guide';
  generateButton.disabled = false;
  itineraryResult.innerHTML = '';
  itineraryResult.classList.add('hidden');
  chatHistory.length = 0;
  chatMessages.innerHTML = '';
  chatMessages.classList.add('hidden');
  chatInput.value = '';

  // Show Panel with animation
  experiencePanel.classList.remove('hidden');
  setTimeout(() => {
    experiencePanel.classList.add('visible');
  }, 10);
}

function deselectDestination() {
  experiencePanel.classList.remove('visible');

  // Wait for animation to finish before hiding
  setTimeout(() => {
    experiencePanel.classList.add('hidden');
    cardsContainer.classList.remove('faded');
    searchPreviewCard.classList.add('hidden');
    document.querySelectorAll('.place-card').forEach(card => card.classList.remove('active'));
  }, 300);
}

// --- Event Listeners ---

// Close Button
closeButton.addEventListener('click', deselectDestination);

// Card Clicks
document.querySelectorAll('.place-card:not(.search-preview-card)').forEach(card => {
  card.addEventListener('click', () => {
    selectDestination(card.dataset.place, card.dataset.image, card);
  });
});

// Option Toggles (History Type)
const lengthButtons = document.querySelectorAll('[data-group="length"] button');
lengthButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    lengthButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.length = btn.dataset.value;
  });
});

// Option Toggles (Voice Gender)
const voiceButtons = document.querySelectorAll('[data-group="voice"] button');
voiceButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    voiceButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.voice = btn.dataset.value;
  });
});


// Generate Audio guide button Logic

const GENERATE_AUDIO_GUIDE_API_URL = `${window.APP_CONFIG.API_BASE_URL}/generate-audio-guide`;

generateButton.addEventListener('click', async () => {
  generateButton.disabled = true;
  generateButton.textContent = '⏳ Generating Audio...';

  try {
    const selectedLanguage = languageSelect.value;
    const selectedVoice = state.voice;

    const response = await fetch(GENERATE_AUDIO_GUIDE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place: state.place,
        answerType: state.length,
        language: selectedLanguage,
        voiceId: VOICES[selectedLanguage][selectedVoice],
        locale: LOCALES[selectedLanguage],
        notes: guideNotesInput.value.trim()
      })
    });

    if (!response.ok) throw new Error('Generation failed');

    const data = await response.json();

    // Update UI with Result
    transcriptText.textContent = data.description;
    audioSection.classList.remove('hidden');

    if (data.audioBase64) {
      audioPlayer.src = `data:audio/mp3;base64,${data.audioBase64}`;
      audioPlayer.load();
      audioPlayer.classList.remove('hidden');
    } else {
      audioPlayer.classList.add('hidden');
    }
    generateButton.textContent = 'Regenerate Audio Guide';
    generateButton.disabled = false;

  } catch (err) {
    console.error(err);
    alert('Generation failed. Please check your connection.');
    generateButton.textContent = 'Generate Audio Guide';
    generateButton.disabled = false;
  }
});

// Transcript Toggle
transcriptToggle.addEventListener('click', () => {
  transcriptContent.classList.toggle('hidden');
  transcriptArrow.classList.toggle('rotate-180');
});

// --- Search ---
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchBtn');

const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
  '<rect width="100%" height="100%" fill="#e5e7eb"/>' +
  '<text x="50%" y="50%" font-family="Arial" font-size="32" fill="#6b7280" text-anchor="middle">No image available</text>' +
  '</svg>'
);

async function searchDestination() {
  const query = searchInput.value.trim();
  if (!query) return;

  const originalLabel = searchButton.textContent;
  searchButton.disabled = true;
  searchButton.textContent = 'Searching...';

  try {
    // Wikipedia search: returns the best match and its main image (no API key needed)
    const url =
      'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
      '&generator=search&gsrlimit=1&prop=pageimages&piprop=original' +
      '&gsrsearch=' + encodeURIComponent(query);

    const response = await fetch(url);
    if (!response.ok) throw new Error('Search request failed');

    const data = await response.json();
    const pages = data.query && data.query.pages ? Object.values(data.query.pages) : [];

    if (!pages.length) {
      alert('No destination found for "' + query + '". Try another name.');
      return;
    }

    const page = pages[0];
    const image = page.original ? page.original.source : FALLBACK_IMAGE;
    selectDestination(page.title, image);
  } catch (err) {
    console.error(err);
    alert('Search failed. Please check your connection.');
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = originalLabel;
  }
}

searchButton.addEventListener('click', searchDestination);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchDestination();
});

// --- Trip Planner (Itinerary) ---
const GENERATE_ITINERARY_API_URL = `${window.APP_CONFIG.API_BASE_URL}/generate-itinerary`;

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// Built with textContent (not innerHTML) so model output can never inject HTML.
function renderItinerary(data) {
  itineraryResult.innerHTML = '';

  if (data.title) {
    itineraryResult.appendChild(
      makeEl('h5', "text-xl font-['Playfair_Display',_serif] font-bold text-gray-900", data.title)
    );
  }

  data.days.forEach((day, index) => {
    const card = makeEl('div', 'p-5 rounded-2xl border border-gray-200 bg-gray-50');

    const header = makeEl('div', 'flex items-center gap-3 mb-3');
    header.appendChild(
      makeEl('span', 'text-[10px] font-bold uppercase tracking-widest text-[#ff8a1f] bg-orange-50 px-2 py-1 rounded-md',
        'Day ' + (day.day || index + 1))
    );
    if (day.theme) header.appendChild(makeEl('strong', 'text-sm text-gray-900', day.theme));
    card.appendChild(header);

    (day.stops || []).forEach(stop => {
      const row = makeEl('div', 'mb-3 pl-4 border-l-2 border-[#ff8a1f]/40');
      if (stop.time) row.appendChild(makeEl('div', 'text-xs font-bold text-[#ff8a1f]', stop.time));
      row.appendChild(makeEl('div', 'text-sm font-semibold text-gray-800', stop.name || ''));
      if (stop.description) row.appendChild(makeEl('p', 'text-sm leading-6 text-gray-600', stop.description));
      card.appendChild(row);
    });

    if (day.tip) {
      card.appendChild(makeEl('p', 'mt-2 text-xs text-gray-500', 'Tip: ' + day.tip));
    }
    itineraryResult.appendChild(card);
  });

  itineraryResult.classList.remove('hidden');
}

itineraryButton.addEventListener('click', async () => {
  if (!state.place) return;

  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;
  if (!startTime || !endTime || endTime <= startTime) {
    alert('Please choose an end time that is later than the start time.');
    return;
  }

  const originalLabel = itineraryButton.textContent;
  itineraryButton.disabled = true;
  itineraryButton.textContent = '⏳ Planning your trip...';

  try {
    const response = await fetch(GENERATE_ITINERARY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place: state.place,
        days: Number(daysSelect.value),
        language: languageSelect.value,
        startTime: startTime,
        endTime: endTime,
        notes: tripNotesInput.value.trim()
      })
    });

    if (!response.ok) throw new Error('Itinerary generation failed');

    renderItinerary(await response.json());
  } catch (err) {
    console.error(err);
    alert('Could not create the itinerary. Please try again.');
  } finally {
    itineraryButton.disabled = false;
    itineraryButton.textContent = originalLabel;
  }
});

// --- Ask the Guide (Chat) ---
const CHAT_API_URL = `${window.APP_CONFIG.API_BASE_URL}/chat`;

function addChatBubble(role, text) {
  chatMessages.classList.remove('hidden');
  const isUser = role === 'user';
  const bubble = makeEl(
    'div',
    'max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-6 whitespace-pre-wrap ' +
      (isUser
        ? 'ml-auto bg-[#ff8a1f] text-white rounded-br-md'
        : 'mr-auto bg-gray-100 text-gray-800 rounded-bl-md'),
    text
  );
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

async function sendChatMessage(message) {
  message = message.trim();
  if (!message || !state.place || chatSendButton.disabled) return;

  const placeAtSend = state.place;
  const history = chatHistory.slice(-10);

  addChatBubble('user', message);
  chatInput.value = '';
  chatSendButton.disabled = true;
  const thinking = addChatBubble('model', 'Thinking...');

  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place: placeAtSend,
        language: languageSelect.value,
        message: message,
        history: history
      })
    });

    if (!response.ok) throw new Error('Chat failed');
    const data = await response.json();

    // The visitor switched to another place while we waited: drop this answer.
    if (placeAtSend !== state.place) return;

    thinking.textContent = data.reply;
    chatHistory.push({ role: 'user', text: message }, { role: 'model', text: data.reply });
  } catch (err) {
    console.error(err);
    if (placeAtSend === state.place) {
      thinking.textContent = 'Sorry, I could not get an answer. Please try again.';
    }
  } finally {
    chatSendButton.disabled = false;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

chatSendButton.addEventListener('click', () => sendChatMessage(chatInput.value));
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage(chatInput.value);
});
document.querySelectorAll('.chat-chip').forEach(chip => {
  chip.addEventListener('click', () => sendChatMessage(chip.textContent));
});
