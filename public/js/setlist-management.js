
// ===============================================
// VARIAVEIS GLOBAIS
// ===============================================
let currentSetlistId = null;
let currentSetlistSongs = [];
let allAvailableSongs = [];

// ===============================================
// INICIALIZAÇÃO
// ===============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Pegar ID da setlist do URL
    const urlParams = new URLSearchParams(window.location.search);
    currentSetlistId = urlParams.get('id');

    // Verifica se tem ID
    if (!currentSetlistId) {
        showToast('Setlist não encontrada', 'error');
        setTimeout(() => window.location.href = '/setlists', 2000);
        return;
    }

    // Carregar dados
    await Promise.all([
        loadSetlist(),
        loadAllSongs()
    ]);

    // Configurar eventos
    setupEventListeners();
});

// ===============================================
// EVENT LISTENERS
// ===============================================
function setupEventListeners() {
    // Botão adicionar música
    const addBtn = document.getElementById('add-song-btn');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal();
        });
    }

    // Botão fechar modal
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
    }

    // Fechar modal ao clicar fora
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    // Campo de pesquisa no modal
    const searchInput = document.getElementById('modal-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterSongs(e.target.value);
        });
    }

    // Tecla ESC para fechar modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// ===============================================
// FUNÇÕES DO MODAL
// ===============================================
function openModal() {
    const modal = document.getElementById('modal-overlay');
    const modalDialog = document.getElementById('modal-dialog');
    const searchInput = document.getElementById('modal-search');

    if (!modal) return;

    // Limpar pesquisa
    if (searchInput) {
        searchInput.value = '';
    }

    // Mostrar todas as músicas
    displayAvailableSongs(allAvailableSongs);

    // Mostrar modal com animação
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalDialog.classList.remove('scale-95');
    }, 10);

    // Focar no campo de pesquisa
    setTimeout(() => {
        if (searchInput) {
            searchInput.focus();
        }
    }, 100);
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    const modalDialog = document.getElementById('modal-dialog');

    if (!modal) return;

    // Animação de saída
    modal.classList.add('opacity-0');
    modalDialog.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// ===============================================
// CARREGAR SETLIST
// ===============================================
async function loadSetlist() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/setlists/${currentSetlistId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar setlist');
        }

        const setlist = await response.json();
        currentSetlistSongs = setlist.songs || [];

        // Atualizar interface
        updateSetlistHeader(setlist);
        displaySongs(currentSetlistSongs);

    } catch (error) {
        console.error('Erro ao carregar setlist:', error);
        showToast('Erro ao carregar setlist', 'error');
    }
}

// ===============================================
// ATUALIZAR CABEÇALHO
// ===============================================
function updateSetlistHeader(setlist) {
    // Título
    const titleEl = document.getElementById('setlist-title');
    if (titleEl) {
        titleEl.textContent = setlist.name || 'Setlist';
    }

    // Badge de visibilidade
    const badge = document.getElementById('visibility-badge');
    if (badge) {
        badge.textContent = setlist.is_public ? 'Pública' : 'Privada';
        badge.className = setlist.is_public
            ? 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800'
            : 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800';
    }

    // Estatísticas
    const stats = document.getElementById('statistics');
    if (stats) {
        stats.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="text-gray-600">Total de músicas:</span>
                        <span class="font-semibold text-gray-900">${currentSetlistSongs.length}</span>
                    </div>
                `;
    }
}

// ===============================================
// MOSTRAR MÚSICAS
// ===============================================
function displaySongs(songs) {
    const container = document.getElementById('tracks-container');

    if (!container) return;

    // Se não tem músicas
    if (songs.length === 0) {
        container.innerHTML = `
                    <li>
                        <div class="text-center py-10 text-gray-500">
                            <p class="mb-2">Nenhuma música na setlist</p>
                            <p class="text-sm text-gray-400">Clica em "Adicionar Música" para começar</p>
                        </div>
                    </li>
                `;
        return;
    }

    // Gerar HTML para cada música
    container.innerHTML = songs.map((song, index) => `
                <li class="track-item bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-300 rounded-xl p-4 flex items-center gap-4 transition-all duration-200 cursor-move"
                    data-item-id="${song.item_id}" 
                    data-position="${song.position}" 
                    draggable="true">
                    <div class="w-10 h-10 flex items-center justify-center bg-white rounded-lg font-semibold text-gray-700 flex-shrink-0">
                        ${index + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-gray-900 truncate">${escapeHtml(song.title)}</div>
                        <div class="text-sm text-gray-600 truncate">${escapeHtml(song.artist)}</div>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <a href="/viewer/${song.song_id}" 
                           class="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                           title="Ver cifra">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                        </a>
                        <button onclick="removeSong(${song.item_id})"
                                class="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                                title="Remover">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </li>
            `).join('');

    // Configurar drag-and-drop
    setupDragAndDrop();
}

// ===============================================
// CARREGAR TODAS MÚSICAS
// ===============================================
async function loadAllSongs() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/songs', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar músicas');
        }

        allAvailableSongs = await response.json();
    } catch (error) {
        console.error('Erro ao carregar músicas:', error);
        showToast('Erro ao carregar lista de músicas', 'error');
    }
}

// ===============================================
// MOSTRAR MÚSICAS DISPONÍVEIS NO MODAL
// ===============================================
function displayAvailableSongs(songs) {
    const container = document.getElementById('modal-songs-list');

    if (!container) return;

    // Se não tem músicas
    if (songs.length === 0) {
        container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <p>Nenhuma música encontrada</p>
                    </div>
                `;
        return;
    }

    // IDs das músicas já na setlist
    const songsInSetlist = new Set(currentSetlistSongs.map(s => s.song_id));

    // Gerar HTML para cada música
    container.innerHTML = songs.map(song => {
        const isInSetlist = songsInSetlist.has(song.id);

        return `
                    <div class="song-item ${isInSetlist ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'} 
                                bg-gray-100 border border-gray-200 rounded-xl p-4 flex items-center justify-between transition-all duration-200"
                         ${isInSetlist ? '' : `onclick="addSongToSetlist(${song.id})"`}>
                        <div class="flex-1 min-w-0">
                            <div class="font-semibold text-gray-900 truncate">${escapeHtml(song.title)}</div>
                            <div class="text-sm text-gray-600 truncate">${escapeHtml(song.artist)}</div>
                        </div>
                        ${isInSetlist ?
                '<span class="inline-flex items-center gap-1 text-sm font-medium text-green-600 flex-shrink-0 ml-4">✓ Já adicionada</span>' :
                '<button class="w-10 h-10 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xl transition-colors flex-shrink-0 ml-4">+</button>'
            }
                    </div>
                `;
    }).join('');
}

// ===============================================
// FILTRAR MÚSICAS
// ===============================================
function filterSongs(query) {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
        displayAvailableSongs(allAvailableSongs);
        return;
    }

    const filtered = allAvailableSongs.filter(song =>
        song.title.toLowerCase().includes(normalizedQuery) ||
        song.artist.toLowerCase().includes(normalizedQuery)
    );

    displayAvailableSongs(filtered);
}

// ===============================================
// ADICIONAR MÚSICA À SETLIST
// ===============================================
async function addSongToSetlist(songId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/setlists/${currentSetlistId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                cifra_id: songId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao adicionar música');
        }

        showToast('✓ Música adicionada!', 'success');
        closeModal();
        await loadSetlist();

    } catch (error) {
        console.error('Erro ao adicionar música:', error);
        showToast(error.message || 'Erro ao adicionar música', 'error');
    }
}

// ===============================================
// REMOVER MÚSICA DA SETLIST
// ===============================================
async function removeSong(itemId) {
    if (!confirm('Remover esta música da setlist?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/setlists/${currentSetlistId}/items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao remover música');
        }

        showToast('✓ Música removida', 'success');
        await loadSetlist();

    } catch (error) {
        console.error('Erro ao remover música:', error);
        showToast(error.message || 'Erro ao remover música', 'error');
    }
}

// ===============================================
// DRAG AND DROP
// ===============================================
function setupDragAndDrop() {
    const items = document.querySelectorAll('.track-item');
    let draggedItem = null;

    items.forEach(item => {
        // Início do arrastar
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', item.innerHTML);
        });

        // Fim do arrastar
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedItem = null;
        });

        // Passar por cima de outro item
        item.addEventListener('dragover', (e) => {
            e.preventDefault();

            if (!draggedItem || draggedItem === item) return;

            const container = item.parentElement;
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            // Inserir antes ou depois dependendo da posição
            if (e.clientY < midY) {
                container.insertBefore(draggedItem, item);
            } else {
                container.insertBefore(draggedItem, item.nextSibling);
            }
        });
    });

    // Soltar item
    const container = document.getElementById('tracks-container');
    if (container) {
        container.addEventListener('drop', async (e) => {
            e.preventDefault();
            await saveNewOrder();
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
    }
}

// ===============================================
// SALVAR NOVA ORDEM
// ===============================================
async function saveNewOrder() {
    const items = document.querySelectorAll('.track-item');

    // Criar array com nova ordem
    const updates = Array.from(items).map((item, index) => ({
        itemId: parseInt(item.dataset.itemId),
        position: index
    }));

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/setlists/${currentSetlistId}/items/reorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ items: updates })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao reordenar');
        }

        showToast('✓ Ordem atualizada', 'success');
        await loadSetlist();

    } catch (error) {
        console.error('Erro ao reordenar:', error);
        showToast(error.message || 'Erro ao reordenar', 'error');
        await loadSetlist(); // Recarregar para restaurar ordem original
    }
}

// ===============================================
// TOAST NOTIFICATION
// ===============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-message');

    if (!toast) return;

    // Definir cores baseadas no tipo
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const textColor = 'text-white';

    toast.textContent = message;
    toast.className = `fixed top-6 right-6 px-5 py-3 rounded-lg font-medium shadow-lg toast-notification ${bgColor} ${textColor} animate-slide-in`;
    toast.classList.remove('hidden');

    // Mostrar toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Esconder depois de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// ===============================================
// ESCAPE HTML (segurança)
// ===============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}