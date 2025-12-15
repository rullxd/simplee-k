// Users Management Page
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!TokenManager.getToken()) {
        window.location.href = '/login';
        return;
    }

    const user = TokenManager.getUser();
    if (user.role !== 'admin') {
        window.location.href = '/student/dashboard';
        return;
    }

    // Update user info in navbar
    updateUserInfo(user);

    let currentPage = 1;
    let currentRole = '';
    let currentSearch = '';

    // Load initial data
    await loadUserStats();
    await loadUsers();
    await loadPendingCount();

    // Event listeners
    setupEventListeners();

    function setupEventListeners() {
        // Add User button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                openAddUserModal();
            });
        }

        // Close modal buttons
        const closeModalBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeAddUserModal);
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeAddUserModal);
        }

        // Close modal on backdrop click
        const modal = document.getElementById('addUserModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeAddUserModal();
                }
            });
        }

        // Form submission
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', handleCreateUser);
        }

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(async (e) => {
                currentSearch = e.target.value;
                currentPage = 1;
                await loadUsers();
            }, 500));
        }

        // Filter buttons
        const filterAll = document.getElementById('filterAll');
        const filterAdmin = document.getElementById('filterAdmin');
        const filterStudent = document.getElementById('filterStudent');

        if (filterAll) {
            filterAll.addEventListener('click', async () => {
                currentRole = '';
                currentPage = 1;
                updateFilterButtons('all');
                await loadUsers();
            });
        }

        if (filterAdmin) {
            filterAdmin.addEventListener('click', async () => {
                currentRole = 'admin';
                currentPage = 1;
                updateFilterButtons('admin');
                await loadUsers();
            });
        }

        if (filterStudent) {
            filterStudent.addEventListener('click', async () => {
                currentRole = 'student';
                currentPage = 1;
                updateFilterButtons('student');
                await loadUsers();
            });
        }

        // Pagination
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', async () => {
                if (currentPage > 1) {
                    currentPage--;
                    await loadUsers();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', async () => {
                currentPage++;
                await loadUsers();
            });
        }
    }

    function updateFilterButtons(active) {
        const buttons = {
            all: document.getElementById('filterAll'),
            admin: document.getElementById('filterAdmin'),
            student: document.getElementById('filterStudent'),
        };

        Object.keys(buttons).forEach(key => {
            const btn = buttons[key];
            if (btn) {
                if (key === active) {
                    btn.className = 'flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm';
                } else {
                    btn.className = 'flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700';
                }
            }
        });
    }

    async function loadUserStats() {
        try {
            const stats = await apiRequest('/users/stats');
            if (stats) {
                const totalEl = document.getElementById('totalUsers');
                const adminEl = document.getElementById('adminCount');
                const studentEl = document.getElementById('studentCount');

                if (totalEl) totalEl.textContent = stats.total || 0;
                if (adminEl) adminEl.textContent = stats.admin || 0;
                if (studentEl) studentEl.textContent = stats.student || 0;
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    async function loadUsers() {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
            });

            if (currentRole) {
                params.append('role', currentRole);
            }

            if (currentSearch) {
                params.append('search', currentSearch);
            }

            const response = await apiRequest(`/users?${params.toString()}`);

            if (response && response.data) {
                displayUsers(response.data);
                updatePagination(response);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            const tbody = document.getElementById('usersTableBody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-red-500">Error loading users: ${error.message}</td></tr>`;
            }
        }
    }

    function displayUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No users found</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(user => {
            const roleBadge = user.role === 'admin' 
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';

            return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="px-6 py-4 font-mono text-slate-500 text-xs">#${user.id}</td>
                    <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">${user.name || 'N/A'}</td>
                    <td class="px-6 py-4">${user.username}</td>
                    <td class="px-6 py-4">${user.student_id || 'N/A'}</td>
                    <td class="px-6 py-4">${user.email || 'N/A'}</td>
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge}">
                            ${user.role === 'admin' ? 'Admin' : 'Student'}
                        </span>
                    </td>
                    <td class="px-6 py-4">${formatDate(user.created_at)}</td>
                </tr>
            `;
        }).join('');
    }

    function updatePagination(response) {
        const infoEl = document.getElementById('paginationInfo');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (infoEl) {
            const start = (response.page - 1) * response.limit + 1;
            const end = Math.min(response.page * response.limit, response.total);
            infoEl.textContent = `Showing ${start} to ${end} of ${response.total} users`;
        }

        if (prevBtn) {
            prevBtn.disabled = response.page <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = response.page >= response.total_pages;
        }
    }

    function updateUserInfo(user) {
        // Update user name in navbar
        const nameEl = document.getElementById('adminName');
        const roleEl = document.querySelector('header .text-right p.text-xs');
        
        if (nameEl) {
            nameEl.textContent = user.name || user.username || 'Admin User';
        }
        if (roleEl) {
            // Display student_id if available, otherwise show role
            if (user.student_id) {
                roleEl.textContent = user.student_id;
            } else {
                roleEl.textContent = user.role === 'admin' ? 'Super Admin' : 'Administrator';
            }
        }
    }

    async function loadPendingCount() {
        try {
            const stats = await ComplaintAPI.getStats();
            const pendingCountEl = document.getElementById('pendingCount');
            if (pendingCountEl && stats && stats.pending !== undefined) {
                pendingCountEl.textContent = stats.pending;
                if (stats.pending === 0) {
                    pendingCountEl.style.display = 'none';
                } else {
                    pendingCountEl.style.display = 'flex';
                }
            }
        } catch (error) {
            console.error('Error loading pending count:', error);
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});

// Modal functions
function openAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.style.display = 'flex';
        // Reset form
        const form = document.getElementById('addUserForm');
        if (form) {
            form.reset();
        }
    }
}

function closeAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        const form = document.getElementById('addUserForm');
        if (form) {
            form.reset();
        }
    }
}

async function handleCreateUser(e) {
    e.preventDefault();
    
    const formData = {
        username: document.getElementById('username').value.trim(),
        student_id: document.getElementById('student_id').value.trim(),
        email: document.getElementById('email').value.trim(),
        name: document.getElementById('name').value.trim(),
        password: document.getElementById('password').value,
        phone: document.getElementById('phone').value.trim(),
        role: document.getElementById('role').value,
    };

    // Validation
    if (!formData.username || !formData.email || !formData.name || !formData.password || !formData.role) {
        alert('Please fill in all required fields');
        return;
    }

    if (formData.password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        // Disable submit button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
        }

        const newUser = await UserAPI.create(formData);
        
        if (newUser) {
            alert('User created successfully!');
            closeAddUserModal();
            // Reload users list and stats
            location.reload(); // Simple reload to refresh data
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Failed to create user: ' + (error.message || 'Unknown error'));
    } finally {
        // Re-enable submit button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create User';
        }
    }
}

