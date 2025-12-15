// Admin Dashboard functionality
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

    // Update user info
    updateUserInfo(user);

    // Load dashboard data
    await loadDashboard();

    // Load notifications
    await loadNotifications();

    // Setup event listeners
    setupEventListeners();
});

async function loadDashboard() {
    try {
        // Load stats
        const stats = await ComplaintAPI.getStats();
        console.log('Stats received:', stats);
        if (stats) {
        updateStats(stats);
        } else {
            console.warn('No stats data received');
        }

        // Load recent complaints
        const response = await ComplaintAPI.getAll({ page: 1, limit: 5 });
        if (response && response.data) {
            displayComplaints(response.data);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data: ' + (error.message || 'Unknown error'));
    }
}

function updateStats(stats) {
    console.log('Updating stats with:', stats);
    
    // Format number with thousand separator
    const formatNumber = (num) => {
        return num ? num.toLocaleString('en-US') : '0';
    };
    
    // Find stat cards by their parent structure
    const statCards = document.querySelectorAll('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 > div');
    
    if (statCards.length >= 4) {
        // Total Complaints (first card)
        const totalCard = statCards[0];
        const totalValue = totalCard.querySelector('h3.text-2xl.font-bold');
        if (totalValue) {
            totalValue.textContent = formatNumber(stats.total || 0);
        }
        
        // Pending Review (second card)
        const pendingCard = statCards[1];
        const pendingValue = pendingCard.querySelector('h3.text-2xl.font-bold');
        if (pendingValue) {
            pendingValue.textContent = formatNumber(stats.pending || 0);
        }
        
        // In Process (third card)
        const inProcessCard = statCards[2];
        const inProcessValue = inProcessCard.querySelector('h3.text-2xl.font-bold');
        if (inProcessValue) {
            inProcessValue.textContent = formatNumber(stats.in_process || 0);
        }
        
        // Completed (fourth card)
        const completedCard = statCards[3];
        const completedValue = completedCard.querySelector('h3.text-2xl.font-bold');
        if (completedValue) {
            completedValue.textContent = formatNumber(stats.completed || 0);
        }
    } else {
        // Fallback: try to find by text content
        const allStatValues = document.querySelectorAll('h3.text-2xl.font-bold');
        if (allStatValues.length >= 4) {
            allStatValues[0].textContent = formatNumber(stats.total || 0);
            allStatValues[1].textContent = formatNumber(stats.pending || 0);
            allStatValues[2].textContent = formatNumber(stats.in_process || 0);
            allStatValues[3].textContent = formatNumber(stats.completed || 0);
        }
    }
    
    // Update pending count badge in sidebar
    const pendingCountEl = document.getElementById('pendingCount');
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
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = complaints.map(complaint => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="px-6 py-4 font-mono text-slate-500 text-xs">#${complaint.ticket_id}</td>
            <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">${complaint.title}</td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <div class="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                        ${complaint.user?.name?.charAt(0) || 'U'}
                    </div>
                    ${complaint.user?.name || 'Unknown'}
                </div>
            </td>
            <td class="px-6 py-4">${formatDate(complaint.created_at)}</td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    ${complaint.category?.name || 'N/A'}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(complaint.status)}">
                    ${getStatusText(complaint.status)}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="viewComplaint(${complaint.id})" class="text-slate-400 hover:text-primary transition-colors p-1" title="View Details">
                    <span class="material-symbols-outlined" style="font-size: 20px;">visibility</span>
                </button>
                <button onclick="editComplaint(${complaint.id})" class="text-slate-400 hover:text-primary transition-colors p-1" title="Edit">
                    <span class="material-symbols-outlined" style="font-size: 20px;">edit</span>
                </button>
                <button onclick="deleteComplaint(${complaint.id})" class="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete">
                    <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
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
                        <h4 class="text-sm font-semibold text-slate-900 dark:text-white ${!notif.is_read ? 'font-bold' : ''}">${notif.title}</h4>
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
        'system': 'inbox', // New complaint notifications use inbox icon
        'other': 'notifications',
    };
    return icons[type] || 'notifications';
}

function getNotificationIconColor(type) {
    const colors = {
        'complaint_update': 'bg-blue-500',
        'announcement': 'bg-purple-500',
        'system': 'bg-green-500', // New complaint notifications use green color
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
            // Optionally show count if > 9
            if (count > 9) {
                badge.textContent = '9+';
                badge.classList.add('flex', 'items-center', 'justify-center', 'text-xs', 'text-white', 'font-bold', 'px-1', 'min-w-[18px]', 'h-[18px]');
                badge.classList.remove('size-2.5');
            } else {
                badge.textContent = '';
                badge.classList.add('size-2.5');
                badge.classList.remove('flex', 'items-center', 'justify-center', 'text-xs', 'text-white', 'font-bold', 'px-1', 'min-w-[18px]', 'h-[18px]');
            }
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
    if ((type === 'complaint_update' || type === 'system') && relatedId) {
        // Navigate to complaint detail page for both complaint_update and system (new complaint) notifications
        window.location.href = `/admin/complaint/${relatedId}`;
    } else if (type === 'announcement' && relatedId) {
        // Show announcement details
        try {
            const announcement = await AnnouncementAPI.getById(relatedId);
            if (announcement) {
                // Close notification popup
                const popup = document.getElementById('notificationPopup');
                if (popup) popup.classList.add('hidden');
                
                // Show announcement details
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

    // Logout
    const logoutLinks = document.querySelectorAll('a');
    logoutLinks.forEach(link => {
        const icon = link.querySelector('span.material-symbols-outlined');
        if (icon && icon.textContent === 'logout') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                AuthAPI.logout();
            });
        }
    });

    // Search
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            const search = e.target.value;
            const response = await ComplaintAPI.getAll({ search, page: 1, limit: 5 });
            if (response && response.data) {
                displayComplaints(response.data);
            }
        }, 500));
    }

    // Navigation links are handled by href attributes, no need for JavaScript handlers
}

function viewComplaint(id) {
    window.location.href = `/admin/complaint/${id}`;
}

function editComplaint(id) {
    window.location.href = `/admin/complaint/${id}`;
}

async function deleteComplaint(id) {
    if (!confirm('Are you sure you want to delete this complaint?')) {
        return;
    }

    try {
        await ComplaintAPI.delete(id);
        await loadDashboard(); // Reload data
    } catch (error) {
        alert('Failed to delete complaint: ' + error.message);
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

function showError(message) {
    console.error(message);
}

