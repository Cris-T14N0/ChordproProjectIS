// ============================
// Gestão de Setlists - Lado do Cliente
// ============================

// Estado da aplicação
const state = {
    setlist: null,
    tracksInSetlist: [],
    userLibrary: [],
    draggedItem: null
};

// Pega o ID da setlist que está no URL
const setlistId = new URLSearchParams(window.location.search).get('id');

// ============================
// Inicialização
// ============================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Página carregada, setlist ID:', setlistId);

    // Se não tiver ID, volta para a lista de setlists
    if (!setlistId) {
        showToast('ID da setlist não encontrado');
        setTimeout(() => window.location.href = '/setlists', 2000);
        return;
    }

    // Carrega tudo em paralelo para ser mais rápido
    await Promise.all([
        loadSetlistData(),
        loadUserLibrary()
    ]);

    setupEventListeners();
});

// ============================
// Event Listeners
// ============================

function setupEventListeners() {
    // Botão de adicionar música
    const addBtn = document.getElementById('add-song-btn');
    addBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    // Fechar modal - botão X
    const closeBtn = document.getElementById('close-modal-btn');
    closeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
    });

    // Fechar modal - clique fora
    const overlay = document.getElementById('modal-overlay');
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Pesquisa no modal
    const searchInput = document.getElementById('modal-search');
    searchInput?.addEventListener('input', (e) => {
        filterSongs(e.target.value.toLowerCase());
    });
}

// ============================
// Carregar Dados do Servidor
// ============================

async function loadSetlistData() {
    try {
        const response = await fetch(`/api/setlists/${setlistId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar setlist');
        }

        const data = await response.json();
        state.setlist = data;
        state.tracksInSetlist = data.songs || [];

        // Atualiza a interface
        updateHeader();
        renderTracks();

    } catch (error) {
        console.error('Erro ao carregar setlist:', error);
        showToast('Erro ao carregar a setlist. Tenta novamente.');
    }
}

async function loadUserLibrary() {
    try {
        const response = await fetch('/api/songs', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar biblioteca');
        }

        state.userLibrary = await response.json();
        console.log(`Biblioteca carregada: ${state.userLibrary.length} músicas`);

    } catch (error) {
        console.error('Erro ao carregar biblioteca:', error);
        showToast('Não conseguimos carregar a tua biblioteca.');
    }
}

// ============================
// Atualizar Interface
// ============================

function updateHeader() {
    const { name, is_public, created_at } = state.setlist;
    const count = state.tracksInSetlist.length;

    // Título
    const titleEl = document.getElementById('setlist-title');
    if (titleEl) titleEl.textContent = name;

    // Badge de visibilidade
    const badgeEl = document.getElementById('visibility-badge');
    if (badgeEl) {
        badgeEl.textContent = is_public ? '🌐 Pública' : '🔒 Privada';
    }

    // Estatísticas
    const statsEl = document.getElementById('statistics');
    if (statsEl) {
        const date = new Date(created_at).toLocaleDateString('pt-PT');
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

    // Lista vazia? Mostra placeholder
    if (state.tracksInSetlist.length === 0) {
        container.innerHTML = `
      <li style="list-style: none;">
        <div class="placeholder-content">
          <div class="placeholder-icon">🎵</div>
          <h3 class="placeholder-title">Lista vazia</h3>
          <p class="placeholder-text">Adiciona músicas para começar</p>
        </div>
      </li>
    `;
        return;
    }

    // Renderiza cada música
    container.innerHTML = state.tracksInSetlist.map((track, idx) => {
        // Tenta encontrar o ID da música de várias formas
        // (o backend às vezes retorna nomes diferentes)
        const songId = track.song_id || track.cifra_id || track.id;

        return `
      <li class="track-entry" 
          draggable="true" 
          data-entry-id="${track.item_id}" 
          data-order="${idx}">
        <span class="grip-icon">☰</span>
        <div class="track-details">
          <h3 class="track-title">${escapeHtml(track.title)}</h3>
          <p class="track-artist">${escapeHtml(track.artist || 'Sem artista')}</p>
        </div>
        <div class="track-controls">
          <button class="control-btn view-btn" 
                  data-action="open" 
                  data-song-id="${songId}">
            Abrir
          </button>
          <button class="control-btn delete-btn" 
                  data-action="delete" 
                  data-item-id="${track.item_id}">
            Eliminar
          </button>
        </div>
      </li>
    `;
    }).join('');

    // Adiciona funcionalidade aos botões
    setupTrackButtons();
    setupDragDrop();
}

function setupTrackButtons() {
    // Botões de "Abrir" - vai para o viewer
    document.querySelectorAll('[data-action="open"]').forEach(btn => {
        btn.addEventListener('click', function () {
            const songId = this.getAttribute('data-song-id');
            if (songId && songId !== 'null' && songId !== 'undefined') {
                window.location.href = `/viewer/${songId}`;
            } else {
                console.error('ID da música não encontrado');
                showToast('Não conseguimos abrir esta música');
            }
        });
    });

    // Botões de "Eliminar"
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async function () {
            const itemId = this.getAttribute('data-item-id');
            if (confirm('Tens a certeza que queres remover esta música da setlist?')) {
                await deleteTrack(itemId);
            }
        });
    });
}

// ============================
// Modal de Adicionar Músicas
// ============================

function openModal() {
    const modal = document.getElementById('modal-overlay');
    if (!modal) {
        console.error('Modal não existe no HTML!');
        return;
    }

    modal.style.display = 'flex';
    renderModalSongs(state.userLibrary);

    // Foca no campo de pesquisa
    const searchInput = document.getElementById('modal-search');
    if (searchInput) {
        searchInput.value = '';
        setTimeout(() => searchInput.focus(), 100);
    }
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'none';
}

function renderModalSongs(songs) {
    const container = document.getElementById('modal-songs-list');
    if (!container) {
        console.error('Container de músicas não existe!');
        return;
    }

    // Remove as que já estão na setlist
    const existingIds = new Set(state.tracksInSetlist.map(t => t.song_id));
    const available = songs.filter(song => !existingIds.has(song.id));

    if (available.length === 0) {
        container.innerHTML = `
      <div class="placeholder-content">
        <p class="placeholder-text">Todas as tuas músicas já estão nesta setlist 🎉</p>
      </div>
    `;
        return;
    }

    // Renderiza lista de músicas disponíveis
    container.innerHTML = available.map(song => `
    <div class="selection-item" data-song-id="${song.id}">
      <h4 class="selection-name">${escapeHtml(song.title)}</h4>
      <p class="selection-detail">${escapeHtml(song.artist || 'Artista não definido')}</p>
    </div>
  `).join('');

    // Adiciona clique para adicionar
    container.querySelectorAll('.selection-item').forEach(item => {
        item.addEventListener('click', async function () {
            const songId = this.getAttribute('data-song-id');
            await addSongToSetlist(songId);
        });
    });
}

function filterSongs(query) {
    const filtered = state.userLibrary.filter(song =>
        song.title.toLowerCase().includes(query) ||
        (song.artist && song.artist.toLowerCase().includes(query))
    );
    renderModalSongs(filtered);
}

// ============================
// Operações CRUD
// ============================

async function addSongToSetlist(songId) {
    try {
        const response = await fetch(`/api/setlists/${setlistId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ cifra_id: parseInt(songId) })
        });

        if (!response.ok) {
            throw new Error('Erro ao adicionar música');
        }

        closeModal();
        await loadSetlistData(); // Recarrega para atualizar a lista
        showToast('Música adicionada! 🎵');

    } catch (error) {
        console.error('Erro ao adicionar música:', error);
        showToast('Não conseguimos adicionar a música. Tenta outra vez.');
    }
}

async function deleteTrack(itemId) {
    try {
        const response = await fetch(`/api/setlists/${setlistId}/items/${itemId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao eliminar música');
        }

        await loadSetlistData(); // Recarrega a lista
        showToast('Música removida da setlist');

    } catch (error) {
        console.error('Erro ao eliminar música:', error);
        showToast('Não conseguimos remover a música.');
    }
}

// ============================
// Drag & Drop (Reordenar)
// ============================

function setupDragDrop() {
    const entries = document.querySelectorAll('.track-entry');

    entries.forEach(entry => {
        // Começa a arrastar
        entry.addEventListener('dragstart', function (e) {
            state.draggedItem = this;
            this.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        // Para de arrastar
        entry.addEventListener('dragend', function () {
            this.classList.remove('is-dragging');
            state.draggedItem = null;
        });

        // Está por cima de outro item
        entry.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        // Solta o item
        entry.addEventListener('drop', function (e) {
            e.preventDefault();

            if (state.draggedItem && state.draggedItem !== this) {
                const container = document.getElementById('tracks-container');
                const allEntries = [...container.children].filter(el =>
                    el.classList.contains('track-entry')
                );

                const draggedIdx = allEntries.indexOf(state.draggedItem);
                const targetIdx = allEntries.indexOf(this);

                // Reordena no DOM
                if (draggedIdx < targetIdx) {
                    this.parentNode.insertBefore(state.draggedItem, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(state.draggedItem, this);
                }

                // Guarda a nova ordem no servidor
                saveNewOrder();
            }
        });
    });
}

async function saveNewOrder() {
    const container = document.getElementById('tracks-container');
    const entries = [...container.children].filter(el =>
        el.classList.contains('track-entry')
    );

    // Cria array com a nova ordem
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

        if (!response.ok) {
            throw new Error('Erro ao reordenar');
        }

        // Tudo certo! Não precisa mostrar mensagem
        console.log('Ordem guardada com sucesso');

    }
    catch (error) {
        console.error('Erro ao guardar ordem:', error);
        showToast('Não conseguimos guardar a nova ordem');
        await loadSetlistData(); // Reverte para a ordem anterior
    }
}

// ============================
// Utilitários
// ============================

function showToast(message) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
