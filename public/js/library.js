// ============================
// Biblioteca de Músicas
// ============================

document.addEventListener('DOMContentLoaded', () => {
  loadSongs();
});

// ============================
// Carregar e Mostrar Músicas
// ============================

async function loadSongs() {
  const container = document.getElementById('songsContainer');

  try {
    const response = await fetch('/api/songs', {
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Resposta do servidor:', response.status, response.statusText);
      showMessage('Erro ao carregar músicas do servidor', 'error');
      return;
    }

    const songs = await response.json();

    if (songs.length === 0) {
      showEmptyState(container);
    } else {
      displaySongs(songs);
    }

  } catch (error) {
    console.error('Erro ao carregar músicas:', error);
    showMessage('Não conseguimos carregar a tua biblioteca', 'error');
  }
}

function showEmptyState(container) {
  container.innerHTML = `
    <div class="empty-state">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
      </svg>
      <h2>A tua biblioteca está vazia</h2>
      <p>Começa por carregar um ficheiro ChordPro ou criar uma nova música</p>
      <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
        Carregar primeiro ficheiro
      </button>
    </div>
  `;
}

function displaySongs(songs) {
  const container = document.getElementById('songsContainer');
  container.innerHTML = '<div class="songs-grid"></div>';
  const grid = container.querySelector('.songs-grid');

  songs.forEach(song => {
    const card = createSongCard(song);
    grid.appendChild(card);
  });
}

function createSongCard(song) {
  const date = new Date(song.created_at);
  const formattedDate = date.toLocaleDateString('pt-PT');

  const card = document.createElement('div');
  card.className = 'song-card';
  card.innerHTML = `
    <h3 onclick="viewSong(${song.id})">${escapeHtml(song.title)}</h3>
    <div class="artist">${song.artist ? escapeHtml(song.artist) : 'Artista desconhecido'}</div>
    <div class="date">Adicionado em ${formattedDate}</div>
    <div class="actions">
      <button class="btn btn-secondary btn-small" onclick="viewSong(${song.id})" title="Visualizar">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        Ver
      </button>
      <button class="btn btn-secondary btn-small" onclick="openEditor(${song.id})" title="Editar">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Editar
      </button>
      <button class="btn btn-danger btn-small" onclick="deleteSong(${song.id})" title="Eliminar">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Eliminar
      </button>
    </div>
  `;

  return card;
}

// ============================
// Upload de Ficheiro
// ============================

async function uploadFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/songs/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(data.message, 'success');
      loadSongs(); // Recarrega a lista
    } else {
      showMessage(data.message || 'Erro ao carregar ficheiro', 'error');
    }

  } catch (error) {
    console.error('Erro no upload:', error);
    showMessage('Não conseguimos carregar o ficheiro', 'error');
  } finally {
    fileInput.value = ''; // Limpa o input
  }
}

// ============================
// Navegação
// ============================

function viewSong(songId) {
  window.location.href = `/viewer/${songId}`;
}

function openEditor(songId) {
  window.location.href = `/editor/${songId}`;
}

// ============================
// Eliminar Música
// ============================

async function deleteSong(songId) {
  if (!confirm('Tens a certeza que queres eliminar esta música?')) {
    return;
  }

  try {
    const response = await fetch(`/api/songs/${songId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(data.message, 'success');
      loadSongs(); // Recarrega a lista
    } else {
      showMessage(data.message || 'Erro ao eliminar música', 'error');
    }

  } catch (error) {
    console.error('Erro ao eliminar:', error);
    showMessage('Não conseguimos eliminar a música', 'error');
  }
}

// ============================
// Utilitários
// ============================

function showMessage(message, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;

  setTimeout(() => {
    messageDiv.classList.add('hidden');
  }, 5000);
}

// Previne XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}