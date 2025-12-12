// Verifica autenticação em cada página
const token = localStorage.getItem("token");
const currentPath = window.location.pathname;

// Páginas públicas (não precisam de autenticação)
const publicPages = ["/login", "/register", "/"];

// Se está numa página pública E tem token, vai para o dashboard
if (publicPages.includes(currentPath) && token) {
  window.location.href = "/dashboard";
}

// Se está numa página protegida E NÃO tem token, vai para o login
if (!publicPages.includes(currentPath) && !token) {
  window.location.href = "/login";
}