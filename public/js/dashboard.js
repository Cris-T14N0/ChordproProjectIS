// Dashboard Search Functionality
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearSearch");
const resultsSection = document.getElementById("resultsSection");
const welcomeSection = document.getElementById("welcomeSection");
const searchResults = document.getElementById("searchResults");
const resultsTitle = document.getElementById("resultsTitle");
const resultsCount = document.getElementById("resultsCount");

let searchTimeout;
let userSetlists = []; // Cache das setlists do utilizador

// ============================
// Carregar setlists do utilizador
// ============================
async function loadUserSetlists() {
  try {
    const response = await fetch('/api/setlists', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar setlists');
    }

    userSetlists = await response.json();
  } catch (error) {
    console.error('Erro ao carregar setlists:', error);
    userSetlists = [];
  }
}

// ============================
// Search function
// ============================
async function performSearch(query) {
  if (!query || query.trim().length === 0) {
    showWelcome();
    return;
  }

  try {
    showLoading();

    const response = await fetch(`/api/songs/search?q=${encodeURIComponent(query.trim())}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao pesquisar');
    }

    const songs = await response.json();
    displayResults(songs, query);
  } catch (error) {
    console.error("Erro ao pesquisar:", error);
    showError("Erro ao pesquisar músicas. Tenta novamente.");
  }
}

// ============================
// Display search results
// ============================
function displayResults(songs, query) {
  resultsSection.style.display = "block";
  welcomeSection.style.display = "none";

  resultsTitle.textContent = `Resultados para "${query}"`;
  resultsCount.textContent = `${songs.length} ${songs.length === 1 ? 'música encontrada' : 'músicas encontradas'}`;

  if (songs.length === 0) {
    searchResults.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h3>Nenhuma música encontrada</h3>
        <p>Tenta pesquisar por outro termo</p>
      </div>
    `;
    return;
  }

  searchResults.innerHTML = songs.map(song => createSongCard(song)).join('');
  
  // Adiciona event listeners aos botões de adicionar
  attachAddToSetlistButtons();
}

// ============================
// Create song card HTML
// ============================
function createSongCard(song) {
  const isOwner = song.is_owner === 1;
  const isPublic = song.is_public === 1;
  
  return `
    <div class="song-card-wrapper">
      <a href="/viewer/${song.id}" class="song-card">
        <button class="add-to-setlist-btn" data-song-id="${song.id}" data-song-title="${escapeHtml(song.title)}" title="Adicionar à setlist">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
        <div class="song-card-header">
          <div class="song-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
          </div>
          <div class="song-info">
            <h3 class="song-title">${escapeHtml(song.title)}</h3>
            ${song.artist ? `<p class="song-artist">${escapeHtml(song.artist)}</p>` : '<p class="song-artist">Artista desconhecido</p>'}
          </div>
        </div>
        <div class="song-meta">
          ${isOwner ? `
            <span class="song-badge badge-owner">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
              </svg>
              Minha
            </span>
          ` : ''}
          <span class="song-badge ${isPublic ? 'badge-public' : 'badge-private'}">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              ${isPublic ? 
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' :
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>'
              }
            </svg>
            ${isPublic ? 'Pública' : 'Privada'}
          </span>
          ${!isOwner ? `
            <span class="song-owner">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              ${escapeHtml(song.owner_username)}
            </span>
          ` : ''}
        </div>
      </a>
    </div>
  `;
}

// ============================
// Attach event listeners to add buttons
// ============================
function attachAddToSetlistButtons() {
  const addButtons = document.querySelectorAll('.add-to-setlist-btn');
  addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const songId = btn.dataset.songId;
      const songTitle = btn.dataset.songTitle;
      showSetlistModal(songId, songTitle);
    });
  });
}

// ============================
// Show setlist selection modal
// ============================
function showSetlistModal(songId, songTitle) {
  // Remove modal anterior se existir
  const existingModal = document.getElementById('setlistModal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'setlistModal';
  modal.className = 'modal-overlay';
  
  const setlistsList = userSetlists.length > 0 
    ? userSetlists.map(setlist => `
        <button class="setlist-option" data-setlist-id="${setlist.id}">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <span>${escapeHtml(setlist.name)}</span>
          <svg class="check-icon" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </button>
      `).join('')
    : '<p class="no-setlists">Ainda não tens setlists. <a href="/setlists">Criar uma agora</a></p>';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Adicionar à setlist</h3>
        <button class="modal-close" id="closeModal">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <p class="modal-song-title">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
          </svg>
          ${songTitle}
        </p>
        <div class="setlists-list">
          ${setlistsList}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Event listeners
  document.getElementById('closeModal').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Add to setlist buttons
  const setlistOptions = modal.querySelectorAll('.setlist-option');
  setlistOptions.forEach(option => {
    option.addEventListener('click', () => {
      const setlistId = option.dataset.setlistId;
      addSongToSetlist(songId, setlistId, songTitle);
    });
  });

  // Show modal with animation
  setTimeout(() => modal.classList.add('show'), 10);
}

// ============================
// Close modal
// ============================
function closeModal() {
  const modal = document.getElementById('setlistModal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// ============================
// Add song to setlist
// ============================
async function addSongToSetlist(songId, setlistId, songTitle) {
  try {
    const response = await fetch(`/api/setlists/${setlistId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ cifra_id: songId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao adicionar música');
    }

    // Mostra mensagem de sucesso
    showNotification('✓ Música adicionada à setlist!', 'success');
    closeModal();

  } catch (error) {
    console.error('Erro ao adicionar música:', error);
    showNotification(error.message || 'Erro ao adicionar música', 'error');
  }
}

// ============================
// Show notification
// ============================
function showNotification(message, type = 'success') {
  // Remove notificação anterior
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================
// Show loading state
// ============================
function showLoading() {
  resultsSection.style.display = "block";
  welcomeSection.style.display = "none";
  resultsTitle.textContent = "A pesquisar...";
  resultsCount.textContent = "";
  searchResults.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>A procurar músicas...</p>
    </div>
  `;
}

// ============================
// Show error
// ============================
function showError(message) {
  resultsSection.style.display = "block";
  welcomeSection.style.display = "none";
  searchResults.innerHTML = `
    <div class="empty-state">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h3>Erro</h3>
      <p>${message}</p>
    </div>
  `;
}

// ============================
// Show welcome screen
// ============================
function showWelcome() {
  resultsSection.style.display = "none";
  welcomeSection.style.display = "flex";
  searchResults.innerHTML = "";
}

// ============================
// Escape HTML to prevent XSS
// ============================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================
// Event Listeners
// ============================
searchInput.addEventListener("input", (e) => {
  const query = e.target.value;
  
  clearBtn.style.display = query.length > 0 ? "flex" : "none";
  
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch(query);
  }, 300);
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearBtn.style.display = "none";
  showWelcome();
  searchInput.focus();
});

// ============================
// Initialize
// ============================
// Carrega as setlists quando a página carrega
loadUserSetlists();

// Focus search input on load
searchInput.focus();