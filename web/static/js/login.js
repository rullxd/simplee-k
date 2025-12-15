// Login page functionality
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('togglePassword');
    const passwordIcon = document.getElementById('passwordIcon');
    const alertArea = document.querySelector('.bg-red-50, .dark\\:bg-red-900\\/20');

    /* ============================================
       LOGIKA TOGGLE PERLIHATKAN KATA SANDI
       ============================================
       
       Cara kerja:
       1. User klik button dengan icon mata (visibility_off/visibility)
       2. JavaScript mengecek type input saat ini
       3. Jika type = "password" → ubah jadi "text" (tampilkan password)
       4. Jika type = "text" → ubah jadi "password" (sembunyikan password)
       5. Icon berubah sesuai state (visibility_off ↔ visibility)
       6. Memastikan password input tetap focus agar outline tetap sama
    */
    if (passwordToggle && passwordInput) {
        // Mencegah toggle button mengambil focus saat diklik
        // Ini memastikan password input tetap focus, sehingga outline tetap sama
        passwordToggle.addEventListener('mousedown', (e) => {
            // Prevent toggle button dari mengambil focus
            e.preventDefault();
        });
        
        // Handle toggle functionality
        passwordToggle.addEventListener('click', (e) => {
            // Cek type input saat ini
            const currentType = passwordInput.getAttribute('type');
            
            // Toggle: jika password → text, jika text → password
            const newType = currentType === 'password' ? 'text' : 'password';
            
            // Ubah type input
            passwordInput.setAttribute('type', newType);
            
            // Ubah icon sesuai state
            if (passwordIcon) {
                // Jika password tersembunyi (type="password") → icon visibility_off
                // Jika password terlihat (type="text") → icon visibility
                passwordIcon.textContent = newType === 'password' ? 'visibility_off' : 'visibility';
            }
            
            // Memastikan password input tetap focus agar outline tetap sama
            // Setelah toggle, kembalikan focus ke password input
            setTimeout(() => {
                passwordInput.focus();
            }, 0);
        });
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!username || !password) {
                showError('Please fill in all fields');
                return;
            }

            try {
                const response = await AuthAPI.login(username, password);
                
                if (response) {
                    // Redirect based on role
                    if (response.role === 'admin') {
                        window.location.href = '/admin/dashboard';
                    } else {
                        window.location.href = '/student/dashboard';
                    }
                }
            } catch (error) {
                showError(error.message || 'Login failed. Please check your credentials.');
            }
        });
    }

    function showError(message) {
        // Create or update alert
        let alertDiv = document.querySelector('.alert-error');
        if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.className = 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 alert-error';
            const form = document.querySelector('form');
            if (form) {
                form.insertBefore(alertDiv, form.firstChild);
            }
        }
        
        alertDiv.innerHTML = `
            <span class="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
            <p class="text-sm text-red-700 dark:text-red-300">${message}</p>
        `;
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // Check if already logged in
    if (TokenManager.getToken()) {
        const user = TokenManager.getUser();
        if (user.role === 'admin') {
            window.location.href = '/admin/dashboard';
        } else {
            window.location.href = '/student/dashboard';
        }
    }
});

