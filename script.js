const state = {
  savedWords: [],
  currentWord: null,
  currentAudioUrl: null,
};

const searchForm = document.getElementById('search-form');
const wordInput = document.getElementById('word-input');
const loadingMsg = document.getElementById('loading-msg');
const errorMsg = document.getElementById('error-msg');
const resultsBox = document.getElementById('results');
const wordTitle = document.getElementById('word-title');


const phoneticText = document.getElementById('phonetic-text');
const playBtn = document.getElementById('play-btn');
const meaningsBox = document.getElementById('meanings');
const saveBtn = document.getElementById('save-btn');
const savedList = document.getElementById('saved-list');
const noSavedMsg = document.getElementById('no-saved-msg');
const audioPlayer = document.getElementById('audio-player');



function showLoading(isLoading) {
  loadingMsg.classList.toggle('hidden', !isLoading);
}

function setError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.toggle('hidden', !message);
}


async function fetchDefinition(word) {
  const response = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word);
  const data = await response.json();
  return data[0];
}


function buildMeaningBlock(meaning) {
  const block = document.createElement('div');
  block.className = 'meaning-block';

  const heading = document.createElement('div');
  heading.className = 'meaning-heading';
  heading.innerHTML = `<span class="part-of-speech">${meaning.partOfSpeech || 'Unknown'}</span>`;
  block.appendChild(heading);

  const list = document.createElement('ol');
  meaning.definitions.slice().forEach((definition) => {
    const item = document.createElement('li');
    item.innerHTML = `<p>${definition.definition}</p>`;

    if (definition.example) {
      const example = document.createElement('p');
      example.className = 'example-text';
      example.textContent = `"${definition.example}"`;
      item.appendChild(example);
    }

    list.appendChild(item);
  });

  block.appendChild(list);

  if (meaning.synonyms && meaning.synonyms.length > 0) {
    const synonyms = document.createElement('p');
    synonyms.className = 'synonyms-text';
    synonyms.textContent = `Synonyms: ${meaning.synonyms.slice(0, 6).join(', ')}`;
    block.appendChild(synonyms);
  }

  return block;
}


function updateSaveState() {

  if (!state.currentWord) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Save Word";
    saveBtn.classList.remove("saved");
    return;
  }
  saveBtn.disabled = false;

  let found = state.savedWords.find(function(item) {
    return item.word === state.currentWord.word;
  });

  if (found) {
    saveBtn.textContent = "saved";
    saveBtn.classList.add("saved")
  } else {
    saveBtn.textContent = "Saved Word";
    saveBtn.classList.remove("saved");
  }
}
  
function updateSavedList() {
  savedList.innerHTML = '';

  if (state.savedWords.length === 0) {
    noSavedMsg.classList.remove('hidden');
    return;
  }

  noSavedMsg.classList.add('hidden');

  state.savedWords.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'saved-item';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'saved-word-button';
    button.textContent = item.word;
    button.addEventListener('click', () => {
      wordInput.value = item.word;
      searchForm.requestSubmit();
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-saved';
    removeBtn.setAttribute('aria-label', `Remove ${item.word}`);
    removeBtn.textContent = '';
    removeBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      state.savedWords = state.savedWords.filter((saved) => saved.word !== item.word);
      persistSavedWords();
      updateSavedList();
      updateSaveState();
    });

    li.appendChild(button);
    li.appendChild(removeBtn);
    savedList.appendChild(li);
  });
}


function persistSavedWords() {
  localStorage.setItem('wordlySavedWords', JSON.stringify(state.savedWords));
}

function loadSavedWords() {
  const stored = localStorage.getItem('wordlySavedWords');
  state.savedWords = stored ? JSON.parse(stored) : [];
  updateSavedList();
}


function displayDefinition(entry) {
  state.currentWord = entry;
  wordTitle.textContent = entry.word;
  phoneticText.textContent = entry.phonetic || '';

  let audioCandidate = null;
  for (let i = 0; i < entry.phonetics.length; i++) {
    if (entry.phonetics[i].audio) {
      audioCandidate = entry.phonetics[i];
      break;
    }
  }

  state.currentAudioUrl = audioCandidate ? audioCandidate.audio :null;
  playBtn.classList.toggle('hidden',!state.currentAudioUrl);

  meaningsBox.innerHTML = '';
  entry.meanings.forEach((meaning) => meaningsBox.appendChild(buildMeaningBlock(meaning)));
  resultsBox.classList.remove('hidden');
  updateSaveState();
}


function playPronunciation() {
  if (!state.currentAudioUrl) {
    return;
  }

  audioPlayer.src = state.currentAudioUrl;
  audioPlayer.play().catch(() => {
    setError('Unable to play pronunciation audio');
  });
}


async function handleSearch(event) {
  event.preventDefault();
  const word = wordInput.value.trim();
  if (!word) {
    return;
  }

  setError('');
  showLoading(true);

  try {
    const entry = await fetchDefinition(word);
    displayDefinition(entry);
  } catch (error) {
    resultsBox.classList.add('hidden');
    setError(error.message || 'Unable to fetch definition.');
  } finally {
    showLoading(false);
  }
}

function handleSaveToggle() {
  if (!state.currentWord) {
    return;
  }

  const savedIndex = state.savedWords.findIndex((item) => item.word === state.currentWord.word);
  if (savedIndex >= 0) {
    state.savedWords.splice(savedIndex, 1);
  } else {
    state.savedWords.push({ word: state.currentWord.word });
  }

  persistSavedWords();
  updateSavedList();
  updateSaveState();
}


searchForm.addEventListener('submit', handleSearch);
playBtn.addEventListener('click', playPronunciation);
saveBtn.addEventListener('click', handleSaveToggle);
window.addEventListener('DOMContentLoaded', loadSavedWords);
