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

    // Load notifications
    await loadNotifications();

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

async function loadNotifications() {
    try {
        const response = await NotificationAPI.getAll({ limit: 20 });
        if (response && response.data) {
            displayNotifications(response.data);
            updateNotificationBadge(response.unread_count || 0);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function displayNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;

    if (notifications.length === 0) {
        notificationList.innerHTML = '<div class="text-center text-slate-500 dark:text-slate-400 py-8">No notifications</div>';
        return;
    }

    notificationList.innerHTML = notifications.map(notif => `
        <div class="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${!notif.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}" onclick="handleNotificationClick(${notif.id}, ${notif.related_id || 'null'}, '${notif.type}')">
            <div class="flex items-start gap-3">
                <div class="size-10 rounded-full ${getNotificationIconColor(notif.type)} flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-white" style="font-size: 20px;">${getNotificationIcon(notif.type)}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                        <h4 class="text-sm font-semibold text-[#0d141b] dark:text-white ${!notif.is_read ? 'font-bold' : ''}">${notif.title}</h4>
                        ${!notif.is_read ? '<span class="size-2 rounded-full bg-primary flex-shrink-0 mt-1"></span>' : ''}
                    </div>
                    <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">${notif.message}</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">${formatNotificationTime(notif.created_at)}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    const icons = {
        'complaint_update': 'inbox',
        'announcement': 'campaign',
        'system': 'info',
        'other': 'notifications',
    };
    return icons[type] || 'notifications';
}

function getNotificationIconColor(type) {
    const colors = {
        'complaint_update': 'bg-blue-500',
        'announcement': 'bg-purple-500',
        'system': 'bg-amber-500',
        'other': 'bg-slate-500',
    };
    return colors[type] || 'bg-slate-500';
}

function formatNotificationTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (count > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

async function handleNotificationClick(notificationId, relatedId, type) {
    // Mark as read
    try {
        await NotificationAPI.markAsRead(notificationId);
        await loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }

    // Navigate based on type
    if (type === 'complaint_update' && relatedId) {
        window.location.href = `/student/complaint/${relatedId}`;
    } else if (type === 'announcement' && relatedId) {
        // Show announcement in a modal or navigate to announcement page
        // For now, we'll show an alert with the announcement details
        try {
            const announcement = await AnnouncementAPI.getById(relatedId);
            if (announcement) {
                // Close notification popup
                const popup = document.getElementById('notificationPopup');
                if (popup) popup.classList.add('hidden');
                
                // Show announcement details (you can create a modal for this)
                alert(`Announcement: ${announcement.title}\n\n${announcement.content}`);
            }
        } catch (error) {
            console.error('Error loading announcement:', error);
        }
    }
}

function setupEventListeners() {
    // Notification button
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPopup = document.getElementById('notificationPopup');
    const closeNotificationBtn = document.getElementById('closeNotificationBtn');
    const markAllReadBtn = document.getElementById('markAllReadBtn');

    if (notificationBtn && notificationPopup) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationPopup.classList.toggle('hidden');
            loadNotifications();
        });
    }

    if (closeNotificationBtn && notificationPopup) {
        closeNotificationBtn.addEventListener('click', () => {
            notificationPopup.classList.add('hidden');
        });
    }

    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            try {
                await NotificationAPI.markAllAsRead();
                await loadNotifications();
            } catch (error) {
                console.error('Error marking all as read:', error);
            }
        });
    }

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        if (notificationPopup && !notificationPopup.contains(e.target) && !notificationBtn.contains(e.target)) {
            notificationPopup.classList.add('hidden');
        }
    });

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
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const status = btn.getAttribute('data-status');
            
            // Update active state immediately (no delay)
            updateFilterActiveState(btn);
            
            // Load filtered complaints (async, but UI already updated)
            const params = { page: 1, limit: 10 };
            if (status) {
                params.status = status;
            }
            
            // Load data in background
            try {
                const response = await ComplaintAPI.getAll(params);
            if (response && response.data) {
                displayComplaints(response.data);
                }
            } catch (error) {
                console.error('Error loading filtered complaints:', error);
            }
        });
    });
}

function updateFilterActiveState(activeBtn) {
    // Update all filter buttons immediately (synchronous, no delay)
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        if (btn === activeBtn) {
            // Active state: blue background
            btn.className = 'filter-btn active flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium whitespace-nowrap shadow-sm transition-colors';
        } else {
            // Inactive state: white/gray background
            btn.className = 'filter-btn flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full text-sm font-medium whitespace-nowrap transition-colors';
        }
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

