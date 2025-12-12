
// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function () {

    // Get all elements
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const navItems = document.querySelectorAll('.nav-item');
    const userMenu = document.getElementById('userMenu');
    const userInfoToggle = document.getElementById('userInfoToggle');

    // Toggle sidebar function
    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
    }

    function toggleSidebar() {
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    // Hamburger click event
    if (hamburger) {
        hamburger.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // Overlay click to close
    if (overlay) {
        overlay.addEventListener('click', function () {
            closeSidebar();
        });
    }

    // Close sidebar when clicking nav items on mobile
    navItems.forEach(function (item) {
        item.addEventListener('click', function (e) {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Close sidebar on window resize to desktop
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    // Toggle user menu dropdown
    if (userInfoToggle && userMenu) {
        userInfoToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            userMenu.classList.toggle('open');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!userMenu.contains(e.target)) {
                userMenu.classList.remove('open');
            }
        });

        // Close dropdown when clicking a menu item
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(function (item) {
            item.addEventListener('click', function () {
                userMenu.classList.remove('open');
            });
        });
    }

    // Highlight active page
    const currentPath = window.location.pathname;
    navItems.forEach(function (link) {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '/' && href === '/dashboard')) {
            link.classList.add('active');
        }
    });

    // Set user name
    document.getElementById('userName').textContent = 'Utilizador';
    document.getElementById('userAvatar').textContent = 'U';

});

// Logout function (global scope)
function logout() {
    alert('Logout clicked!');
    console.log('User logged out');
    // Add your logout logic here
    // window.location.href = '/login';
}