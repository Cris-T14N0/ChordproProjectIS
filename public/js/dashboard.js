// Dashboard Search Functionality
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearSearch");
const resultsSection = document.getElementById("resultsSection");
const welcomeSection = document.getElementById("welcomeSection");
const searchResults = document.getElementById("searchResults");
const resultsTitle = document.getElementById("resultsTitle");
const resultsCount = document.getElementById("resultsCount");

let searchTimeout;

// Search function
async function performSearch(query) {
  if (!query || query.trim().length === 0) {
    showWelcome();
    return;
  }

  try {
    // Show loading state
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

// Display search results
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
}

// Create song card HTML
function createSongCard(song) {
  const isOwner = song.is_owner === 1;
  const isPublic = song.is_public === 1;
  
  return `
    <a href="/viewer/${song.id}" class="song-card">
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
  `;
}

// Show loading state
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

// Show error
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

// Show welcome screen
function showWelcome() {
  resultsSection.style.display = "none";
  welcomeSection.style.display = "flex";
  searchResults.innerHTML = "";
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event Listeners
searchInput.addEventListener("input", (e) => {
  const query = e.target.value;
  
  // Show/hide clear button
  clearBtn.style.display = query.length > 0 ? "flex" : "none";
  
  // Debounce search
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

// Focus search input on load
searchInput.focus();