// ============================
// setlist-management.js (FIXED)
// ============================

let setlistData = null;
let tracksInSetlist = [];
let userLibrary = [];
let draggedItem = null;

// Get setlist ID from URL
const urlParams = new URLSearchParams(window.location.search);
const setlistId = urlParams.get('id');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, setlist ID:', setlistId);

    if (!setlistId) {
        showToast('ID da setlist não encontrado');
        setTimeout(() => window.location.href = '/setlists', 2000);
        return;
    }

    // Load data
    loadSetlistData();
    loadUserLibrary();

    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Add song button
    const addBtn = document.getElementById('add-song-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Add button clicked');
            openModal();
        });
    }

    // Close modal buttons
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            closeModal();
        });
    }

    // Close on overlay click
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    // Search input
    const searchInput = document.getElementById('modal-search');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase();
            filterSongs(query);
        });
    }
}

async function loadSetlistData() {
    try {
        const response = await fetch(`/api/setlists/${setlistId}`, {
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load setlist');

        setlistData = await response.json();
        tracksInSetlist = setlistData.songs || [];

        updateHeader();
        renderTracks();

    } catch (error) {
        console.error('Error loading setlist:', error);
        showToast('Erro ao carregar setlist');
    }
}

async function loadUserLibrary() {
    try {
        const response = await fetch('/api/songs', {
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load library');

        userLibrary = await response.json();
        console.log('Loaded library:', userLibrary.length, 'songs');

    } catch (error) {
        console.error('Error loading library:', error);
        showToast('Erro ao carregar biblioteca');
    }
}

function updateHeader() {
    const titleEl = document.getElementById('setlist-title');
    const badgeEl = document.getElementById('visibility-badge');
    const statsEl = document.getElementById('statistics');

    if (titleEl) titleEl.textContent = setlistData.name;
    if (badgeEl) badgeEl.textContent = setlistData.is_public ? '🌐 Pública' : '🔒 Privada';

    if (statsEl) {
        const count = tracksInSetlist.length;
        const date = new Date(setlistData.created_at).toLocaleDateString('pt-PT');
        statsEl.innerHTML = `
      <span>${count} ${count === 1 ? 'música' : 'músicas'}</span>
      <span>•</span>
      <span>Criada a ${date}</span>
    `;
    }
}

function renderTracks() {
    const container = document.getElementById('tracks-container');
    if (!container) return;

    // DEBUG: Check what data we're getting
    if (tracksInSetlist.length > 0) {
        console.log('=== TRACK DATA STRUCTURE ===');
        console.log('First track:', tracksInSetlist[0]);
        console.log('Available fields:', Object.keys(tracksInSetlist[0]));
    }

    if (tracksInSetlist.length === 0) {
        container.innerHTML = `
      <li style="list-style: none;">
        <div class="placeholder-content">
          <div class="placeholder-icon">🎵</div>
          <h3 class="placeholder-title">Lista vazia</h3>
          <p class="placeholder-text">Adicione músicas para começar</p>
        </div>
      </li>
    `;
        return;
    }

    container.innerHTML = tracksInSetlist.map((track, idx) => `
    <li class="track-entry" draggable="true" data-entry-id="${track.item_id}" data-order="${idx}">
      <span class="grip-icon">☰</span>
      <div class="track-details">
        <h3 class="track-title">${escapeHtml(track.title)}</h3>
        <p class="track-artist">${escapeHtml(track.artist || 'Sem artista')}</p>
      </div>
      <div class="track-controls">
        <button class="control-btn view-btn" data-action="open" data-song-id="${track.song_id || track.cifra_id || track.id}">
          Abrir
        </button>
        <button class="control-btn delete-btn" data-action="delete" data-item-id="${track.item_id}">
          Eliminar
        </button>
      </div>
    </li>
`).join('');

    setupTrackButtons();
    setupDragDrop();
}

function setupTrackButtons() {
  // Open buttons - Navigate to /viewer/:id
  document.querySelectorAll('[data-action="open"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const songId = this.getAttribute('data-song-id');
      if (songId) {
        window.location.href = `/viewer/${songId}`;
      } else {
        console.error('Song ID not found');
        showToast('ID da música não encontrado');
      }
    });
  });
  
  // Delete buttons
  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async function() {
      const itemId = this.getAttribute('data-item-id');
      if (confirm('Eliminar esta música da setlist?')) {
        await deleteTrack(itemId);
      }
    });
  });
}

function openModal() {
    console.log('Opening modal...');
    const modal = document.getElementById('modal-overlay');
    if (!modal) {
        console.error('Modal not found!');
        return;
    }

    modal.style.display = 'flex';

    // Render songs
    renderModalSongs(userLibrary);

    // Focus search
    const searchInput = document.getElementById('modal-search');
    if (searchInput) {
        searchInput.value = '';
        setTimeout(() => searchInput.focus(), 100);
    }
}

function closeModal() {
    console.log('Closing modal...');
    const modal = document.getElementById('modal-overlay');
    if (modal) {
        modal.style.display = 'none';
    }
}

function renderModalSongs(songs) {
    const container = document.getElementById('modal-songs-list');
    if (!container) {
        console.error('Modal songs container not found!');
        return;
    }

    // Filter out songs already in setlist
    const existingIds = new Set(tracksInSetlist.map(t => t.song_id));
    const available = songs.filter(song => !existingIds.has(song.id));

    console.log('Rendering', available.length, 'available songs');

    if (available.length === 0) {
        container.innerHTML = `
      <div class="placeholder-content">
        <p class="placeholder-text">Todas as músicas já estão na setlist</p>
      </div>
    `;
        return;
    }

    container.innerHTML = available.map(song => `
    <div class="selection-item" data-song-id="${song.id}">
      <h4 class="selection-name">${escapeHtml(song.title)}</h4>
      <p class="selection-detail">${escapeHtml(song.artist || 'Artista não definido')}</p>
    </div>
  `).join('');

    // Add click handlers
    container.querySelectorAll('.selection-item').forEach(item => {
        item.addEventListener('click', async function () {
            const songId = this.getAttribute('data-song-id');
            await addSongToSetlist(songId);
        });
    });
}

function filterSongs(query) {
    const filtered = userLibrary.filter(song =>
        song.title.toLowerCase().includes(query) ||
        (song.artist && song.artist.toLowerCase().includes(query))
    );
    renderModalSongs(filtered);
}

async function addSongToSetlist(songId) {
    try {
        const response = await fetch(`/api/setlists/${setlistId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ cifra_id: parseInt(songId) })
        });

        if (!response.ok) throw new Error('Failed to add song');

        closeModal();
        await loadSetlistData();
        showToast('Música adicionada!');

    } catch (error) {
        console.error('Error adding song:', error);
        showToast('Erro ao adicionar música');
    }
}

async function deleteTrack(itemId) {
    try {
        const response = await fetch(`/api/setlists/${setlistId}/items/${itemId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to delete');

        await loadSetlistData();
        showToast('Música removida');

    } catch (error) {
        console.error('Error deleting track:', error);
        showToast('Erro ao remover música');
    }
}

function setupDragDrop() {
    const entries = document.querySelectorAll('.track-entry');

    entries.forEach(entry => {
        entry.addEventListener('dragstart', function (e) {
            draggedItem = this;
            this.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        entry.addEventListener('dragend', function () {
            this.classList.remove('is-dragging');
            draggedItem = null;
        });

        entry.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        entry.addEventListener('drop', function (e) {
            e.preventDefault();
            if (draggedItem && draggedItem !== this) {
                const container = document.getElementById('tracks-container');
                const allEntries = [...container.children].filter(el => el.classList.contains('track-entry'));
                const draggedIdx = allEntries.indexOf(draggedItem);
                const targetIdx = allEntries.indexOf(this);

                if (draggedIdx < targetIdx) {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(draggedItem, this);
                }

                saveNewOrder();
            }
        });
    });
}

async function saveNewOrder() {
    const container = document.getElementById('tracks-container');
    const entries = [...container.children].filter(el => el.classList.contains('track-entry'));

    const items = entries.map((entry, position) => ({
        itemId: parseInt(entry.dataset.entryId),
        position: position
    }));

    try {
        const response = await fetch(`/api/setlists/${setlistId}/items/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ items })
        });

        if (!response.ok) throw new Error('Failed to reorder');

    } catch (error) {
        console.error('Error reordering:', error);
        showToast('Erro ao guardar ordem');
        await loadSetlistData();
    }
}

function showToast(message) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}