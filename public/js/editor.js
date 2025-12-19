const API_URL = 'http://localhost:3000';
let currentSongId = null;
let currentView = 'edit';

document.addEventListener('DOMContentLoaded', function() {
    // Check if editing existing song
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'editor' && pathParts[2]) {
        currentSongId = parseInt(pathParts[2]);
        loadSong(currentSongId);
    }

    // Auto-update preview as user types
    const input = document.getElementById('chordproInput');
    input.addEventListener('input', updatePreview);

    // Initial preview
    updatePreview();

    // Mobile view handling
    if (window.innerWidth <= 768) {
        document.querySelector('.editor-content').classList.add('single-view');
    }

    window.addEventListener('resize', function() {
        const content = document.querySelector('.editor-content');
        if (window.innerWidth <= 768) {
            content.classList.add('single-view');
        } else {
            content.classList.remove('single-view');
        }
    });
});

async function loadSong(songId) {
    try {
        const response = await fetch(`${API_URL}/api/songs/${songId}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const song = await response.json();
            
            document.getElementById('pageTitle').textContent = `Editar: ${song.title}`;
            document.getElementById('title').value = song.title;
            document.getElementById('artist').value = song.artist || '';
            document.getElementById('chordproInput').value = song.content || '';
            document.getElementById('isPublic').checked = song.is_public === 1;
            
            updatePreview();
        } else if (response.status === 404) {
            showMessage('Música não encontrada', 'error');
            setTimeout(() => window.location.href = '/library', 2000);
        } else {
            showMessage('Erro ao carregar música', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar música:', error);
        showMessage('Erro ao carregar música', 'error');
    }
}

function updatePreview() {
    const input = document.getElementById('chordproInput').value;
    const preview = document.getElementById('preview');
    
    try {
        const html = parseChordPro(input, false); // FALSE for editor (shows dotted line)
        preview.innerHTML = html;
    } catch (error) {
        console.error('Parse error:', error);
        preview.innerHTML = '<p style="color: #dc2626;">Erro ao processar ChordPro. Verifique a sintaxe.</p>';
    }
}

async function saveSong() {
    const title = document.getElementById('title').value.trim();
    const artist = document.getElementById('artist').value.trim();
    const content = document.getElementById('chordproInput').value.trim();
    const is_public = document.getElementById('isPublic').checked;
    const saveBtn = document.getElementById('saveBtn');

    if (!title) {
        showMessage('Por favor, insira um título', 'error');
        return;
    }

    if (!content) {
        showMessage('Por favor, insira o conteúdo da música', 'error');
        return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> A guardar...';

    try {
        const url = currentSongId 
            ? `${API_URL}/api/songs/${currentSongId}`
            : `${API_URL}/api/songs`;
        
        const method = currentSongId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ title, artist, content, is_public })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message, 'success');
            
            if (!currentSongId && data.song) {
                currentSongId = data.song.id;
                window.history.replaceState(null, '', `/editor/${currentSongId}`);
                document.getElementById('pageTitle').textContent = `Editar: ${title}`;
            }
        } else {
            showMessage(data.message || 'Erro ao guardar música', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro ao conectar ao servidor', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg> Guardar';
    }
}

function switchView(view) {
    const content = document.querySelector('.editor-content');
    const buttons = document.querySelectorAll('.toggle-btn');
    const editPanel = document.querySelector('.editor-panel');
    const previewPanel = document.querySelector('.preview-panel');

    currentView = view;

    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (view === 'edit') {
        buttons[0].classList.add('active');
        editPanel.classList.add('active');
        previewPanel.classList.remove('active');
    } else {
        buttons[1].classList.add('active');
        previewPanel.classList.add('active');
        editPanel.classList.remove('active');
        updatePreview();
    }
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}