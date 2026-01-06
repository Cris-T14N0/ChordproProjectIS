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
// Upload Múltiplo de Ficheiros
// ============================

async function uploadFiles(files) {
    if (!files || files.length === 0) return;

    // Mostrar container de upload
    const uploadContainer = document.getElementById('upload-container');
    const fileList = document.getElementById('file-list');
    const overallProgressFill = document.getElementById('overall-progress-fill');
    const overallPercentage = document.getElementById('overall-percentage');

    if (uploadContainer) {
        uploadContainer.classList.remove('hidden');
        fileList.innerHTML = '';
        overallProgressFill.style.width = '0%';
        overallPercentage.textContent = '0%';
    }

    const formData = new FormData();

    // Adicionar cada ficheiro ao FormData
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);

        // Adicionar à lista visual (se existir)
        if (fileList) {
            const fileId = 'file-' + Date.now() + '-' + i;
            fileList.innerHTML += `
        <div id="${fileId}" class="upload-item bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="text-sm truncate" style="max-width: 200px;">${escapeHtml(files[i].name)}</span>
            </div>
            <div id="${fileId}-status" class="text-xs text-gray-600">Na fila</div>
          </div>
          <div class="progress-bar mt-2">
            <div id="${fileId}-progress" class="progress-fill" style="width: 0%"></div>
          </div>
          <div id="${fileId}-error" class="text-xs text-red-600 mt-1 hidden"></div>
        </div>
      `;
        }
    }

    try {
        const response = await fetch('/api/songs/upload-multiple', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Atualizar interface com resultados
            updateUploadResults(data.results);

            if (data.successful > 0) {
                showMessage(`✅ ${data.successful} ficheiro(s) carregado(s) com sucesso!`, 'success');
                setTimeout(() => loadSongs(), 1000); // Recarrega a lista após 1 segundo
            }

            if (data.failed > 0) {
                showMessage(`⚠️ ${data.failed} ficheiro(s) falharam`, 'warning');
            }

        } else {
            showMessage(data.message || 'Erro ao carregar ficheiros', 'error');
        }

    } catch (error) {
        console.error('Erro no upload múltiplo:', error);
        showMessage('Não conseguimos carregar os ficheiros', 'error');
    } finally {
        // Limpar o input após 3 segundos (tempo para ver os resultados)
        setTimeout(() => {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.value = '';

            // Ocultar container após alguns segundos
            if (uploadContainer) {
                setTimeout(() => {
                    uploadContainer.classList.add('hidden');
                }, 3000);
            }
        }, 3000);
    }
}

// ============================
// Funções Auxiliares para Upload
// ============================

// ============================
// Drag and Drop
// ============================

function setupDragAndDrop() {
    const dropZone = document.body;

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = '#fffbeb';
        dropZone.style.border = '2px dashed #fbbf24';
    });

    dropZone.addEventListener('dragleave', (e) => {
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.style.backgroundColor = '';
            dropZone.style.border = '';
        }
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = '';
        dropZone.style.border = '';

        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files);
        }
    });
}

// ============================
// Formatador de tamanho de ficheiro
// ============================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================
// Cancelar uploads
// ============================

function cancelAllUploads() {
    const uploadContainer = document.getElementById('upload-container');
    const fileInput = document.getElementById('fileInput');

    if (uploadContainer) {
        uploadContainer.classList.add('hidden');
    }

    if (fileInput) {
        fileInput.value = '';
    }

    showMessage('Upload cancelado', 'info');
}

function updateUploadResults(results) {
    let successful = 0;
    let failed = 0;

    results.forEach(result => {
        const fileId = 'file-' + result.fileName.replace(/[^a-z0-9]/gi, '-');
        const statusElement = document.getElementById(`${fileId}-status`);
        const progressElement = document.getElementById(`${fileId}-progress`);
        const errorElement = document.getElementById(`${fileId}-error`);
        const fileItem = document.getElementById(fileId);

        if (result.success) {
            if (statusElement) statusElement.textContent = '✓ Concluído';
            if (statusElement) statusElement.className = 'text-xs text-green-600 font-medium';
            if (progressElement) progressElement.style.width = '100%';
            if (fileItem) fileItem.classList.add('bg-green-50', 'border-green-200');
            successful++;
        } else {
            if (statusElement) statusElement.textContent = '✗ Erro';
            if (statusElement) statusElement.className = 'text-xs text-red-600 font-medium';
            if (progressElement) progressElement.style.width = '100%';
            if (progressElement) progressElement.style.background = '#ef4444';
            if (errorElement) {
                errorElement.textContent = result.error || 'Erro desconhecido';
                errorElement.classList.remove('hidden');
            }
            if (fileItem) fileItem.classList.add('bg-red-50', 'border-red-200');
            failed++;
        }
    });

    // Atualizar progresso geral
    const overallProgressFill = document.getElementById('overall-progress-fill');
    const overallPercentage = document.getElementById('overall-percentage');
    const total = results.length;

    if (overallProgressFill && overallPercentage && total > 0) {
        const percentage = Math.round((successful / total) * 100);
        overallProgressFill.style.width = `${percentage}%`;
        overallPercentage.textContent = `${percentage}%`;
    }
}

// ============================
// Manipulação de Seleção de Ficheiros
// ============================

function handleFileSelection(files) {
    if (!files || files.length === 0) return;

    // Validar ficheiros
    const validFiles = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.toLowerCase().split('.').pop();
        const validExtensions = ['chopro', 'chordpro', 'cho', 'crd', 'pro', 'txt'];

        if (!validExtensions.includes(ext)) {
            errors.push(`"${file.name}" - Extensão não permitida`);
            continue;
        }

        if (file.size > 10 * 1024 * 1024) {
            errors.push(`"${file.name}" - Ficheiro muito grande (máx: 10MB)`);
            continue;
        }

        validFiles.push(file);
    }

    // Mostrar erros
    if (errors.length > 0) {
        showMessage(`⚠️ ${errors.length} ficheiro(s) inválido(s): ${errors.join('; ')}`, 'warning');
    }

    // Fazer upload se houver ficheiros válidos
    if (validFiles.length > 0) {
        uploadFiles(validFiles);
    }
}

// ============================
// Atualizar a função antiga para compatibilidade
// ============================

async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;

    if (!files || files.length === 0) return;

    // Se for apenas um ficheiro, usa o endpoint antigo para compatibilidade
    if (files.length === 1) {
        const formData = new FormData();
        formData.append('file', files[0]);

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
    } else {
        // Se for múltiplos ficheiros, usa o novo sistema
        handleFileSelection(files);
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