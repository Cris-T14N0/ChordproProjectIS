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
    alert('Erro ao carregar setlists');
  }
}

// Display setlists in grid
function displaySetlists(setlists) {
  const container = document.getElementById('setlists-container');
  
  if (setlists.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <h3>Nenhuma setlist criada</h3>
        <p>Crie sua primeira setlist para começar a organizar suas músicas!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = setlists.map(setlist => `
    <div class="setlist-card" onclick="manageSetlist(${setlist.id})">
      <h3>${setlist.name}</h3>
      <div class="setlist-meta">
        ${setlist.is_public ? '🌐 Pública' : '🔒 Privada'} • 
        ${new Date(setlist.created_at).toLocaleDateString('pt-PT')}
      </div>
      <div class="setlist-actions" onclick="event.stopPropagation()">
        <button class="btn btn-danger btn-small" onclick="deleteSetlist(${setlist.id})">
          Eliminar
        </button>
      </div>
    </div>
  `).join('');
}

// Navigate to setlist management page
function manageSetlist(setlistId) {
  window.location.href = `/setlist-management?id=${setlistId}`;
}

// Create setlist modal
function openCreateModal() {
  document.getElementById('create-modal').classList.add('active');
}

function closeCreateModal() {
  document.getElementById('create-modal').classList.remove('active');
  document.getElementById('create-form').reset();
}

// Handle create setlist form
document.getElementById('create-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('setlist-name').value;
  const isPublic = document.getElementById('setlist-public').checked;

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

    if (!response.ok) throw new Error('Erro ao criar setlist');

    closeCreateModal();
    loadSetlists();
    alert('Setlist criada com sucesso!');
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao criar setlist');
  }
});

// Delete setlist
async function deleteSetlist(setlistId) {
  if (!confirm('Tem certeza que deseja eliminar esta setlist?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/setlists/${setlistId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Erro ao eliminar setlist');

    loadSetlists();
    alert('Setlist eliminada com sucesso!');
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao eliminar setlist');
  }
}