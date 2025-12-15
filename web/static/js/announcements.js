// Announcements Management page functionality
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
    let currentPage = 1;
    let currentStatus = '';
    let currentSearch = '';

    // Load data
    await loadAnnouncements();
    await loadPendingCount();

    // Setup event listeners
    setupEventListeners();
});

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

let currentPage = 1;
let currentStatus = '';
let currentSearch = '';
let editingId = null;

async function loadAnnouncements() {
    try {
        const response = await AnnouncementAPI.getAll({
            page: currentPage,
            limit: 10,
            status: currentStatus,
            search: currentSearch,
        });

        if (response && response.data) {
            displayAnnouncements(response.data);
            updatePagination(response);
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
        showError('Failed to load announcements: ' + (error.message || 'Unknown error'));
    }
}

function displayAnnouncements(announcements) {
    const tbody = document.getElementById('announcementsTableBody');
    if (!tbody) return;

    if (announcements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No announcements found.</td></tr>';
        return;
    }

    tbody.innerHTML = announcements.map(announcement => {
        const preview = announcement.content.length > 50 
            ? announcement.content.substring(0, 50) + '...' 
            : announcement.content;
        
        const date = new Date(announcement.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });

        const authorName = announcement.author?.name || announcement.author?.username || 'Unknown';
        const authorAvatar = announcement.author?.email || '';

        const statusBadge = getStatusBadge(announcement.status);

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">${escapeHtml(announcement.title)}</td>
                <td class="px-6 py-4 text-slate-600 dark:text-slate-400">${escapeHtml(preview)}</td>
                <td class="px-6 py-4 text-slate-600 dark:text-slate-400">${formattedDate}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <div class="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            ${authorName.charAt(0).toUpperCase()}
                        </div>
                        <span class="text-slate-900 dark:text-white">${escapeHtml(authorName)}</span>
                    </div>
                </td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editAnnouncement(${announcement.id})" class="text-slate-400 hover:text-primary transition-colors p-1 mr-2" title="Edit">
                        <span class="material-symbols-outlined" style="font-size: 20px;">edit</span>
                    </button>
                    <button onclick="deleteAnnouncement(${announcement.id})" class="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete">
                        <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusBadge(status) {
    const badges = {
        'published': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">Published</span>',
        'draft': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Draft</span>',
        'archived': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Archived</span>'
    };
    return badges[status] || badges.draft;
}

function updatePagination(response) {
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (paginationInfo) {
        const start = (response.page - 1) * response.limit + 1;
        const end = Math.min(response.page * response.limit, response.total);
        paginationInfo.textContent = `Showing ${start} to ${end} of ${response.total} results`;
    }

    if (prevBtn) {
        prevBtn.disabled = response.page <= 1;
    }

    if (nextBtn) {
        nextBtn.disabled = response.page >= response.total_pages;
    }
}

function setupEventListeners() {
    // New announcement button
    const newBtn = document.getElementById('newAnnouncementBtn');
    if (newBtn) {
        newBtn.addEventListener('click', () => {
            openModal();
        });
    }

    // Close modal
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    // Form submission
    const form = document.getElementById('announcementForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    // Search
    const searchInput = document.getElementById('tableSearchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = e.target.value;
                currentPage = 1;
                loadAnnouncements();
            }, 500);
        });
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            currentStatus = e.target.value;
            currentPage = 1;
            loadAnnouncements();
        });
    }

    // Pagination
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadAnnouncements();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            loadAnnouncements();
        });
    }
}

function openModal(id = null) {
    editingId = id;
    const modal = document.getElementById('announcementModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('announcementForm');
    
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    
    if (modalTitle) {
        modalTitle.textContent = id ? 'Edit Announcement' : 'New Announcement';
    }
    
    if (form) {
        form.reset();
        if (id) {
            loadAnnouncementForEdit(id);
        } else {
            document.getElementById('announcementStatus').value = 'draft';
        }
    }
}

async function loadAnnouncementForEdit(id) {
    try {
        const announcement = await AnnouncementAPI.getById(id);
        if (announcement) {
            document.getElementById('announcementTitle').value = announcement.title || '';
            document.getElementById('announcementContent').value = announcement.content || '';
            document.getElementById('announcementStatus').value = announcement.status || 'draft';
        }
    } catch (error) {
        console.error('Error loading announcement:', error);
        showError('Failed to load announcement: ' + (error.message || 'Unknown error'));
    }
}

function closeModal() {
    const modal = document.getElementById('announcementModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    editingId = null;
    const form = document.getElementById('announcementForm');
    if (form) {
        form.reset();
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('announcementTitle').value.trim();
    const content = document.getElementById('announcementContent').value.trim();
    const status = document.getElementById('announcementStatus').value;

    if (!title || !content) {
        showError('Please fill in all required fields');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
        const data = { title, content, status };
        
        if (editingId) {
            await AnnouncementAPI.update(editingId, data);
            showSuccess('Announcement updated successfully!');
        } else {
            await AnnouncementAPI.create(data);
            showSuccess('Announcement created successfully!');
        }
        
        closeModal();
        await loadAnnouncements();
    } catch (error) {
        showError('Failed to save announcement: ' + (error.message || 'Unknown error'));
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function editAnnouncement(id) {
    openModal(id);
}

async function deleteAnnouncement(id) {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
        return;
    }

    try {
        await AnnouncementAPI.delete(id);
        showSuccess('Announcement deleted successfully!');
        await loadAnnouncements();
    } catch (error) {
        console.error('Error deleting announcement:', error);
        showError('Failed to delete announcement: ' + (error.message || 'Unknown error'));
    }
}

function showError(message) {
    console.error(message);
    alert(message);
}

function showSuccess(message) {
    alert(message);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

