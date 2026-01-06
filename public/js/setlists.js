// Load setlists on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSetlists();
});

// Load all user setlists
async function loadSetlists() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/setlists', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Erro ao carregar setlists');

    const setlists = await response.json();
    displaySetlists(setlists);
  } catch (error) {
    console.error('Erro:', error);
    showNotification('Erro ao carregar setlists', 'error');
  }
}

// Display setlists in grid
function displaySetlists(setlists) {
  const container = document.getElementById('setlists-container');
  
  if (setlists.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-bottom: 16px; color: #cbd5e1;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <h3>Nenhuma setlist criada</h3>
        <p>Cria a tua primeira setlist para começar a organizar as tuas músicas!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = setlists.map(setlist => `
    <div class="setlist-card" onclick="manageSetlist(${setlist.id})">
      <div class="setlist-card-header">
        <h3>${escapeHtml(setlist.name)}</h3>
        <button class="setlist-menu-btn" onclick="event.stopPropagation(); openEditModal(${setlist.id}, '${escapeHtml(setlist.name)}', ${setlist.is_public})" title="Editar setlist">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
      </div>
      <div class="setlist-meta">
        <span class="setlist-badge ${setlist.is_public ? 'badge-public' : 'badge-private'}">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${setlist.is_public ? 
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' :
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>'
            }
          </svg>
          ${setlist.is_public ? 'Pública' : 'Privada'}
        </span>
        <span class="setlist-date">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          ${new Date(setlist.created_at).toLocaleDateString('pt-PT')}
        </span>
      </div>
      <div class="setlist-actions" onclick="event.stopPropagation()">
        <button class="btn-icon btn-icon-danger" onclick="deleteSetlist(${setlist.id})" title="Eliminar setlist">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Navigate to setlist management page
function manageSetlist(setlistId) {
  window.location.href = `/setlist-management?id=${setlistId}`;
}

// ============================
// Create Setlist Modal
// ============================
function openCreateModal() {
  document.getElementById('create-modal').classList.add('active');
  document.getElementById('setlist-name').focus();
}

function closeCreateModal() {
  document.getElementById('create-modal').classList.remove('active');
  document.getElementById('create-form').reset();
}

// Handle create setlist form
document.getElementById('create-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('setlist-name').value.trim();
  const isPublic = document.getElementById('setlist-public').checked;

  if (!name) {
    showNotification('O nome da setlist é obrigatório', 'error');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/setlists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        is_public: isPublic ? 1 : 0
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar setlist');
    }

    closeCreateModal();
    loadSetlists();
    showNotification('✓ Setlist criada com sucesso!', 'success');
  } catch (error) {
    console.error('Erro:', error);
    showNotification(error.message || 'Erro ao criar setlist', 'error');
  }
});

// ============================
// Edit Setlist Modal
// ============================
let currentEditingSetlistId = null;

function openEditModal(setlistId, name, isPublic) {
  currentEditingSetlistId = setlistId;
  
  document.getElementById('edit-setlist-name').value = name;
  document.getElementById('edit-setlist-public').checked = isPublic === 1;
  document.getElementById('edit-modal').classList.add('active');
  document.getElementById('edit-setlist-name').focus();
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('active');
  document.getElementById('edit-form').reset();
  currentEditingSetlistId = null;
}

// Handle edit setlist form
document.getElementById('edit-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!currentEditingSetlistId) {
    showNotification('Erro: ID da setlist não encontrado', 'error');
    return;
  }

  const name = document.getElementById('edit-setlist-name').value.trim();
  const isPublic = document.getElementById('edit-setlist-public').checked;

  if (!name) {
    showNotification('O nome da setlist é obrigatório', 'error');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/setlists/${currentEditingSetlistId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        is_public: isPublic ? 1 : 0
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao atualizar setlist');
    }

    closeEditModal();
    loadSetlists();
    showNotification('✓ Setlist atualizada com sucesso!', 'success');
  } catch (error) {
    console.error('Erro:', error);
    showNotification(error.message || 'Erro ao atualizar setlist', 'error');
  }
});

// ============================
// Delete setlist
// ============================
async function deleteSetlist(setlistId) {
  if (!confirm('Tens a certeza que queres eliminar esta setlist?\n\nEsta ação não pode ser desfeita.')) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/setlists/${setlistId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao eliminar setlist');
    }

    loadSetlists();
    showNotification('✓ Setlist eliminada com sucesso', 'success');
  } catch (error) {
    console.error('Erro:', error);
    showNotification(error.message || 'Erro ao eliminar setlist', 'error');
  }
}

// ============================
// Notification system
// ============================
function showNotification(message, type = 'success') {
  // Remove existing notification
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
// Utility functions
// ============================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    if (e.target.id === 'create-modal') closeCreateModal();
    if (e.target.id === 'edit-modal') closeEditModal();
  }
});

// Close modals with ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCreateModal();
    closeEditModal();
  }
});