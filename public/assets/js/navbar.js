// Elements
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    // Toggle sidebar
    function toggleSidebar() {
      const isOpen = sidebar.classList.toggle('open');
      overlay.classList.toggle('active', isOpen);
      hamburger.classList.toggle('active', isOpen);
      document.body.classList.toggle('sidebar-open', isOpen);
      sidebar.setAttribute('aria-hidden', !isOpen);
    }

    // Close sidebar when clicking overlay or nav item (mobile only)
    overlay.addEventListener('click', () => {
      if (sidebar.classList.contains('open')) toggleSidebar();
    });

    document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
          toggleSidebar();
        }
        // Highlight active page
        document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });

    // Auto-close on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });

    // Prevent touchmove when sidebar open (iOS fix)
    document.addEventListener('touchmove', (e) => {
      if (sidebar.classList.contains('open')) {
        e.preventDefault();
      }
    }, { passive: false });

    // Touch + Click support (no 300ms delay)
    ['click', 'touchstart'].forEach(evt => {
      hamburger.addEventListener(evt, (e) => {
        e.preventDefault();
        toggleSidebar();
      }, { passive: false });
    });

    // Fetch user
    fetch('/api/users/me', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(user => {
      document.getElementById('userName').textContent = user.username;
      document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
    })
    .catch(() => {
      document.getElementById('userName').textContent = 'Utilizador';
      document.getElementById('userAvatar').textContent = 'U';
    });

    // Logout
    function logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login.html';
    }

    // Auto-highlight current page
    const path = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(link => {
      const href = link.getAttribute('href');
      if (href === path || (path === '/' && href === '/dashboard.html')) {
        link.classList.add('active');
      }
    });