// Complaints Management page functionality
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

    // Initialize
    currentPage = 1;
    currentStatus = '';
    currentSearch = '';

    // Load data
    await loadComplaints();
    await loadStats();

    // Setup event listeners
    setupEventListeners();
});

let currentPage = 1;
let currentStatus = '';
let currentSearch = '';
const pageLimit = 10;

async function loadComplaints() {
    try {
        const params = {
            page: currentPage,
            limit: pageLimit,
        };

        if (currentStatus) {
            params.status = currentStatus;
        }

        if (currentSearch) {
            params.search = currentSearch;
        }

        const response = await ComplaintAPI.getAll(params);
        
        if (response && response.data) {
            displayComplaints(response.data);
            updatePagination(response);
        }
    } catch (error) {
        console.error('Error loading complaints:', error);
        showError('Failed to load complaints');
    }
}

async function loadStats() {
    try {
        const stats = await ComplaintAPI.getStats();
        updateStats(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStats(stats) {
    const totalEl = document.getElementById('totalComplaints');
    const pendingEl = document.getElementById('pendingComplaints');
    const inProcessEl = document.getElementById('inProcessComplaints');
    const completedEl = document.getElementById('completedComplaints');
    const pendingCountEl = document.getElementById('pendingCount');

    if (totalEl && stats.total !== undefined) {
        totalEl.textContent = formatNumber(stats.total);
    }
    if (pendingEl && stats.pending !== undefined) {
        pendingEl.textContent = formatNumber(stats.pending);
    }
    if (inProcessEl && stats.in_process !== undefined) {
        inProcessEl.textContent = formatNumber(stats.in_process);
    }
    if (completedEl && stats.completed !== undefined) {
        completedEl.textContent = formatNumber(stats.completed);
    }
    if (pendingCountEl && stats.pending !== undefined) {
        pendingCountEl.textContent = stats.pending;
        if (stats.pending === 0) {
            pendingCountEl.style.display = 'none';
        } else {
            pendingCountEl.style.display = 'flex';
        }
    }
}

function displayComplaints(complaints) {
    const tbody = document.getElementById('complaintsTableBody');
    if (!tbody) return;

    if (complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No complaints found</td></tr>';
        return;
    }

    tbody.innerHTML = complaints.map(complaint => {
        const statusBadge = getStatusBadge(complaint.status);
        const date = formatDate(complaint.created_at);
        const studentName = complaint.user?.name || 'Unknown';
        const studentId = complaint.user?.student_id ? `(${complaint.user.student_id})` : '';

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-xs">#${complaint.ticket_id || complaint.id}</td>
                <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">${complaint.title || 'N/A'}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <div class="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            ${studentName.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm text-slate-900 dark:text-white">${studentName}</span>
                            ${studentId ? `<span class="text-xs text-slate-500 dark:text-slate-400">${studentId}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        ${complaint.category?.name || 'N/A'}
                    </span>
                </td>
                <td class="px-6 py-4 text-slate-600 dark:text-slate-400">${date}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                        <button onclick="viewComplaint(${complaint.id})" class="text-slate-400 hover:text-primary transition-colors p-1" title="View Details">
                            <span class="material-symbols-outlined" style="font-size: 20px;">visibility</span>
                        </button>
                        <button onclick="editComplaint(${complaint.id})" class="text-slate-400 hover:text-primary transition-colors p-1" title="Edit">
                            <span class="material-symbols-outlined" style="font-size: 20px;">edit</span>
                        </button>
                        <button onclick="deleteComplaint(${complaint.id})" class="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete">
                            <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updatePagination(response) {
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (paginationInfo) {
        const total = response.total || 0;
        const page = response.page || 1;
        const limit = response.limit || pageLimit;
        const totalPages = response.total_pages || 1;
        
        paginationInfo.textContent = `Showing ${((page - 1) * limit) + 1} to ${Math.min(page * limit, total)} of ${total} complaints`;
    }

    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }

    if (nextBtn) {
        const totalPages = response.total_pages || 1;
        nextBtn.disabled = currentPage >= totalPages;
    }
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            currentSearch = e.target.value.trim();
            currentPage = 1;
            await loadComplaints();
        }, 500));
    }

    // Table search input
    const tableSearchInput = document.getElementById('tableSearchInput');
    if (tableSearchInput) {
        tableSearchInput.addEventListener('input', debounce(async (e) => {
            currentSearch = e.target.value.trim();
            currentPage = 1;
            await loadComplaints();
        }, 500));
    }

    // Filter buttons
    const filterAll = document.getElementById('filterAll');
    const filterPending = document.getElementById('filterPending');
    const filterInProcess = document.getElementById('filterInProcess');
    const filterCompleted = document.getElementById('filterCompleted');

    if (filterAll) {
        filterAll.addEventListener('click', async () => {
            currentStatus = '';
            currentPage = 1;
            updateFilterButtons('all');
            await loadComplaints();
        });
    }

    if (filterPending) {
        filterPending.addEventListener('click', async () => {
            currentStatus = 'pending';
            currentPage = 1;
            updateFilterButtons('pending');
            await loadComplaints();
        });
    }

    if (filterInProcess) {
        filterInProcess.addEventListener('click', async () => {
            currentStatus = 'in_process';
            currentPage = 1;
            updateFilterButtons('in_process');
            await loadComplaints();
        });
    }

    if (filterCompleted) {
        filterCompleted.addEventListener('click', async () => {
            currentStatus = 'completed';
            currentPage = 1;
            updateFilterButtons('completed');
            await loadComplaints();
        });
    }

    // Pagination
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', async () => {
            if (currentPage > 1) {
                currentPage--;
                await loadComplaints();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            currentPage++;
            await loadComplaints();
        });
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            alert('Export functionality will be available soon.');
        });
    }
}

function updateFilterButtons(activeFilter) {
    const filters = {
        'all': document.getElementById('filterAll'),
        'pending': document.getElementById('filterPending'),
        'in_process': document.getElementById('filterInProcess'),
        'completed': document.getElementById('filterCompleted'),
    };

    Object.keys(filters).forEach(key => {
        const btn = filters[key];
        if (btn) {
            if (key === activeFilter) {
                btn.className = 'flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm';
            } else {
                btn.className = 'flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700';
            }
        }
    });
}

function viewComplaint(id) {
    window.location.href = `/admin/complaint/${id}`;
}

function editComplaint(id) {
    window.location.href = `/admin/complaint/${id}`;
}

async function deleteComplaint(id) {
    if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
        return;
    }

    try {
        await ComplaintAPI.delete(id);
        alert('Complaint deleted successfully!');
        await loadComplaints();
        await loadStats();
    } catch (error) {
        console.error('Error deleting complaint:', error);
        alert('Failed to delete complaint: ' + (error.message || 'Unknown error'));
    }
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Pending Review</span>',
        'in_process': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">In Process</span>',
        'completed': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">Completed</span>',
        'rejected': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">Rejected</span>'
    };
    return badges[status] || badges.pending;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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

function updateUserInfo(user) {
    // Update user name in navbar
    const nameEl = document.querySelector('header .text-right p.text-sm.font-semibold');
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

function showError(message) {
    console.error(message);
    alert(message);
}

