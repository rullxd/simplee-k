// Student Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!TokenManager.getToken()) {
        window.location.href = '/login';
        return;
    }

    const user = TokenManager.getUser();
    if (user.role === 'admin') {
        window.location.href = '/admin/dashboard';
        return;
    }

    // Update user info in header
    updateUserInfo(user);

    // Load dashboard data
    await loadDashboard();

    // Event listeners
    setupEventListeners();
});

async function loadDashboard() {
    try {
        // Load stats
        const stats = await ComplaintAPI.getStats();
        updateStats(stats);

        // Load complaints
        const response = await ComplaintAPI.getAll({ page: 1, limit: 10 });
        if (response && response.data) {
            displayComplaints(response.data);
            updatePagination(response);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

function updateStats(stats) {
    const totalEl = document.querySelector('.text-3xl.font-bold');
    const pendingEl = document.querySelectorAll('.text-3xl.font-bold')[1];
    const resolvedEl = document.querySelectorAll('.text-3xl.font-bold')[2];

    if (totalEl && stats.total !== undefined) {
        totalEl.textContent = stats.total;
    }
    if (pendingEl && stats.pending !== undefined) {
        pendingEl.textContent = stats.pending;
    }
    if (resolvedEl && stats.completed !== undefined) {
        resolvedEl.textContent = stats.completed;
    }
}

function displayComplaints(complaints) {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = complaints.map(complaint => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
            <td class="p-4 text-sm font-medium text-[#0d141b] dark:text-white">${complaint.ticket_id}</td>
            <td class="p-4 text-sm text-[#0d141b] dark:text-white font-medium">${complaint.title}</td>
            <td class="p-4 text-sm text-slate-500 dark:text-slate-400">${complaint.category?.name || 'N/A'}</td>
            <td class="p-4 text-sm text-slate-500 dark:text-slate-400">${formatDate(complaint.created_at)}</td>
            <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(complaint.status)}">
                    <span class="size-1.5 rounded-full bg-${complaint.status === 'pending' ? 'amber' : complaint.status === 'in_process' ? 'blue' : 'green'}-500"></span>
                    ${getStatusText(complaint.status)}
                </span>
            </td>
            <td class="p-4 text-right">
                <button onclick="viewComplaint(${complaint.id})" class="text-primary hover:text-primary-dark font-medium text-sm inline-flex items-center gap-1">
                    Details <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateUserInfo(user) {
    const nameEl = document.querySelector('p.text-sm.font-semibold');
    const idEl = document.querySelector('p.text-xs.text-slate-500');
    
    if (nameEl) nameEl.textContent = user.name || user.username;
    if (idEl) idEl.textContent = `Student ID: ${user.student_id || user.username}`;
}

function setupEventListeners() {
    // Submit new complaint button
    const submitBtns = document.querySelectorAll('button');
    submitBtns.forEach(btn => {
        if (btn.textContent.includes('Submit New Complaint')) {
            btn.addEventListener('click', () => {
                window.location.href = '/complaint/submit';
            });
        }
    });

    // Logout button
    const logoutBtns = document.querySelectorAll('button');
    logoutBtns.forEach(btn => {
        const icon = btn.querySelector('span.material-symbols-outlined');
        if (btn.getAttribute('title') === 'Logout' || (icon && icon.textContent === 'logout')) {
            btn.addEventListener('click', () => {
                AuthAPI.logout();
            });
        }
    });

    // Search functionality
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            const search = e.target.value;
            const response = await ComplaintAPI.getAll({ search, page: 1, limit: 10 });
            if (response && response.data) {
                displayComplaints(response.data);
            }
        }, 500));
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('button:has(span.size-2.rounded-full)');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const status = btn.textContent.trim().toLowerCase().replace(' ', '_');
            const response = await ComplaintAPI.getAll({ status, page: 1, limit: 10 });
            if (response && response.data) {
                displayComplaints(response.data);
            }
        });
    });
}

function viewComplaint(id) {
    // Navigate to student complaint details page
    window.location.href = `/student/complaint/${id}`;
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

function showError(message) {
    console.error(message);
    // You can add a toast notification here
}

