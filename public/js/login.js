const API_URL = 'http://localhost:3000';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const messageDiv = document.getElementById('message');
  
  messageDiv.textContent = '';
  
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      messageDiv.textContent = 'Login bem-sucedido! A redirecionar...';
      messageDiv.className = 'success';
      
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 500);
    } else {
      messageDiv.textContent = data.message || 'Erro ao fazer login';
      messageDiv.className = 'error';
    }
  } catch (error) {
    messageDiv.textContent = 'Erro ao conectar ao servidor';
    messageDiv.className = 'error';
    console.error('Erro:', error);
  }
});