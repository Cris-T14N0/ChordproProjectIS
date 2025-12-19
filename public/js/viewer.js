// viewer.js - Lógica do visualizador de músicas ChordPro
const API_URL = 'http://localhost:3000';

let currentSongId = null;
let songContent = '';
let currentTranspose = 0;
let currentFontSize = 1;

document.addEventListener('DOMContentLoaded', function() {
    // Pega o ID da URL
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'viewer' && pathParts[2]) {
        currentSongId = parseInt(pathParts[2]);
        loadSong(currentSongId);
    }
});

async function loadSong(songId) {
    try {
        const response = await fetch(`${API_URL}/api/songs/${songId}`, {
            credentials: 'include' // Send cookies
        });

        if (response.ok) {
            const song = await response.json();
            
            // Atualiza o header
            document.getElementById('songTitle').textContent = song.title;
            document.getElementById('songArtist').textContent = song.artist || '';
            document.title = `${song.title} - ChordPro`;
            
            // ⭐ SEMPRE mostra a tag do dono
            const ownerTagContainer = document.getElementById('ownerTagContainer');
            ownerTagContainer.innerHTML = `
                <div class="owner-tag">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    Cifra de: <strong>${song.owner_username}</strong>
                </div>
            `;
            
            // Controla apenas a visibilidade do botão editar
            const editBtn = document.getElementById('editBtn');
            
            if (song.is_owner) {
                // É o dono - mostra botão de editar
                editBtn.href = `/editor/${songId}`;
                editBtn.style.display = 'inline-flex';
            } else {
                // Não é o dono - esconde botão
                editBtn.style.display = 'none';
            }
            
            // Guarda o conteúdo e renderiza
            songContent = song.content || '';
            renderSong();
            
        } else {
            if (response.status === 401) {
                window.location.href = '/login';
            } else if (response.status === 404) {
                showError('Música não encontrada');
            } else if (response.status === 403) {
                showError('Sem permissão para visualizar esta música');
            } else {
                showError('Erro ao carregar música');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar música:', error);
        showError('Erro ao conectar ao servidor');
    }
}

function renderSong() {
    const display = document.getElementById('songDisplay');
    
    try {
        // Aplica transposição se necessário
        let content = songContent;
        if (currentTranspose !== 0) {
            content = transposeContent(content, currentTranspose);
        }
        
        // Usa o parser ChordPro COM isViewer = true para criar colunas reais
        const html = parseChordPro(content, true);
        display.innerHTML = html;
        
        // Aplica tamanho de fonte se foi alterado
        if (currentFontSize !== 1) {
            const chordProSong = display.querySelector('.chordpro-song');
            if (chordProSong) {
                chordProSong.style.fontSize = currentFontSize + 'em';
            }
        }
    } catch (error) {
        console.error('Erro ao renderizar música:', error);
        display.innerHTML = '<p style="color: #dc2626; text-align: center;">Erro ao processar ChordPro. Verifique a sintaxe.</p>';
    }
}

function showError(message) {
    const display = document.getElementById('songDisplay');
    display.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #dc2626;">
            <svg width="60" height="60" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 20px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 style="margin-bottom: 10px;">${message}</h3>
            <a href="/library" style="color: #f97316; text-decoration: none;">← Voltar à biblioteca</a>
        </div>
    `;
}

function adjustFontSize(delta) {
    const display = document.getElementById('songDisplay');
    const chordProSong = display.querySelector('.chordpro-song');
    
    if (!chordProSong) return;
    
    currentFontSize += delta * 0.1;
    currentFontSize = Math.max(0.6, Math.min(2, currentFontSize));
    
    chordProSong.style.fontSize = currentFontSize + 'em';
    showFeedback(`Tamanho: ${Math.round(currentFontSize * 100)}%`);
}

function transposeChords(semitones) {
    if (semitones === 0) {
        currentTranspose = 0;
        renderSong();
        showFeedback('Tom original restaurado');
        return;
    }
    
    currentTranspose += semitones;
    renderSong();
    
    const direction = currentTranspose > 0 ? '♯' : '♭';
    showFeedback(`Transposto: ${Math.abs(currentTranspose)} ${direction}`);
}

function transposeContent(content, semitones) {
    semitones = ((semitones % 12) + 12) % 12;
    if (semitones > 6) semitones -= 12;
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteMap = {
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    
    function transposeChord(chord) {
        const chordRegex = /^([A-G][#b]?)(.*)/;
        const match = chord.match(chordRegex);
        
        if (!match) return chord;
        
        let note = match[1];
        const suffix = match[2];
        
        if (noteMap[note]) {
            note = noteMap[note];
        }
        
        let index = notes.indexOf(note);
        if (index === -1) return chord;
        
        index = (index + semitones + 12) % 12;
        
        return notes[index] + suffix;
    }
    
    return content.replace(/\[([^\]]+)\]/g, (match, chord) => {
        const transposed = transposeChord(chord.trim());
        return `[${transposed}]`;
    });
}

function showFeedback(message, isError = false) {
    const existing = document.querySelector('.feedback-toast');
    if (existing) {
        existing.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'feedback-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${isError ? '#dc2626' : '#059669'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Atalhos de teclado
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
    }
    
    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        adjustFontSize(1);
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        adjustFontSize(-1);
    }
    
    if (e.key === 'ArrowUp' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        transposeChords(1);
    }
    
    if (e.key === 'ArrowDown' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        transposeChords(-1);
    }
    
    if (e.key === 'r' || e.key === 'R') {
        transposeChords(0);
    }
});