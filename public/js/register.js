const API_URL = 'http://localhost:3000';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const messageDiv = document.getElementById('message');
  
  messageDiv.textContent = '';
  
  // Validar que as passwords coincidem
  if (password !== confirmPassword) {
    messageDiv.textContent = 'As palavras-passe não coincidem';
    messageDiv.className = 'error';
    return;
  }
  
  // Validar comprimento mínimo da password
  if (password.length < 6) {
    messageDiv.textContent = 'A palavra-passe deve ter pelo menos 6 caracteres';
    messageDiv.className = 'error';
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        username: name, 
        email, 
        password 
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageDiv.textContent = 'Conta criada com sucesso! A redirecionar para o login...';
      messageDiv.className = 'success';
      
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
    } else {
      messageDiv.textContent = data.message || 'Erro ao criar conta';
      messageDiv.className = 'error';
    }
  } catch (error) {
    messageDiv.textContent = 'Erro ao conectar ao servidor';
    messageDiv.className = 'error';
    console.error('Erro:', error);
  }
});