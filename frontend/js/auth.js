/**
 * TaskFlow Auth View Handler
 */

document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('authSection');
    const appDashboard = document.getElementById('appDashboard');
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');

    const loginAlert = document.getElementById('loginAlert');
    const registerAlert = document.getElementById('registerAlert');

    const logoutBtn = document.getElementById('logoutBtn');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    // Toggle forms
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('d-none');
        registerForm.classList.remove('d-none');
        loginAlert.classList.add('d-none');
    });

    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('d-none');
        loginForm.classList.remove('d-none');
        registerAlert.classList.add('d-none');
    });

    // Check existing auth state
    function initAuth() {
        const user = window.apiService.getCurrentUser();
        if (user) {
            showDashboard(user);
        } else {
            showAuthScreen();
        }
    }

    function showDashboard(user) {
        authSection.classList.add('d-none');
        appDashboard.classList.remove('d-none');
        userNameDisplay.textContent = user.name || 'User';
        userEmailDisplay.textContent = user.email || '';
        
        // Trigger initial task loading in app.js
        if (window.loadTasks) {
            window.loadTasks();
        }
    }

    function showAuthScreen() {
        appDashboard.classList.add('d-none');
        authSection.classList.remove('d-none');
    }

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginAlert.classList.add('d-none');
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        try {
            const user = await window.apiService.login(email, password);
            showDashboard(user);
            window.showToast('Signed in successfully!', 'bg-success');
        } catch (err) {
            loginAlert.textContent = err.message || 'Login failed. Please try again.';
            loginAlert.classList.remove('d-none');
        }
    });

    // Handle Register
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerAlert.classList.add('d-none');

        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();

        try {
            await window.apiService.register(name, email, password);
            window.showToast('Registration successful! Please log in.', 'bg-success');
            
            // Switch to login form
            registerForm.classList.add('d-none');
            loginForm.classList.remove('d-none');
            document.getElementById('loginEmail').value = email;
        } catch (err) {
            registerAlert.textContent = err.message || 'Registration failed.';
            registerAlert.classList.remove('d-none');
        }
    });

    // Handle Logout
    logoutBtn.addEventListener('click', async () => {
        await window.apiService.logout();
        showAuthScreen();
        window.showToast('Logged out successfully', 'bg-secondary');
    });

    initAuth();
});
