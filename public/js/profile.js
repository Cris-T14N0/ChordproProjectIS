const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async function() {
    await loadUserInfo();
    setupFormHandlers();
});

// Load user information
async function loadUserInfo() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const user = await response.json();
            
            // Populate form fields
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            
            // Format created date
            if (user.created_at) {
                const date = new Date(user.created_at);
                const formattedDate = date.toLocaleDateString('pt-PT', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                document.getElementById('createdAt').value = formattedDate;
            }
        } else {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar informações:', error);
        showMessage('usernameMessage', 'Erro ao carregar informações do utilizador', 'error');
    }
}

// Setup form handlers
function setupFormHandlers() {
    // Username form
    document.getElementById('usernameForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateUsername();
    });

    // Password form
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updatePassword();
    });
}

// Update username
async function updateUsername() {
    const username = document.getElementById('username').value.trim();
    const btn = document.getElementById('usernameBtn');
    const messageDiv = document.getElementById('usernameMessage');
    const token = localStorage.getItem('token');

    if (!username) {
        showMessage('usernameMessage', 'Username não pode estar vazio', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'A guardar...';

    try {
        const response = await fetch(`${API_URL}/api/auth/update-username`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('usernameMessage', data.message, 'success');
            // Update navbar
            window.location.reload();
        } else {
            showMessage('usernameMessage', data.message || 'Erro ao atualizar username', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showMessage('usernameMessage', 'Erro ao conectar ao servidor', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar alterações';
    }
}

// Update password
async function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btn = document.getElementById('passwordBtn');
    const messageDiv = document.getElementById('passwordMessage');
    const token = localStorage.getItem('token');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showMessage('passwordMessage', 'As passwords não coincidem', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showMessage('passwordMessage', 'A password deve ter pelo menos 6 caracteres', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'A atualizar...';

    try {
        const response = await fetch(`${API_URL}/api/auth/update-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('passwordMessage', data.message, 'success');
            // Clear form
            document.getElementById('passwordForm').reset();
        } else {
            showMessage('passwordMessage', data.message || 'Erro ao atualizar password', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showMessage('passwordMessage', 'Erro ao conectar ao servidor', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Atualizar password';
    }
}

// Show message helper
function showMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}