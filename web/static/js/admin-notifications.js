// Admin Notifications - Shared functionality for all admin pages
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
        'system': 'inbox',
        'other': 'notifications',
    };
    return icons[type] || 'notifications';
}

function getNotificationIconColor(type) {
    const colors = {
        'complaint_update': 'bg-blue-500',
        'announcement': 'bg-purple-500',
        'system': 'bg-green-500',
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
    try {
        await NotificationAPI.markAsRead(notificationId);
        await loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }

    if ((type === 'complaint_update' || type === 'system') && relatedId) {
        window.location.href = `/admin/complaint/${relatedId}`;
    } else if (type === 'announcement' && relatedId) {
        try {
            const announcement = await AnnouncementAPI.getById(relatedId);
            if (announcement) {
                const popup = document.getElementById('notificationPopup');
                if (popup) popup.classList.add('hidden');
                alert(`Announcement: ${announcement.title}\n\n${announcement.content}`);
            }
        } catch (error) {
            console.error('Error loading announcement:', error);
        }
    }
}

function setupNotificationListeners() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPopup = document.getElementById('notificationPopup');
    const closeNotificationBtn = document.getElementById('closeNotificationBtn');
    const markAllReadBtn = document.getElementById('markAllReadBtn');

    if (notificationBtn && notificationPopup) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationPopup.classList.toggle('hidden');
            if (!notificationPopup.classList.contains('hidden')) {
                loadNotifications();
            }
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

    document.addEventListener('click', (e) => {
        if (notificationPopup && !notificationPopup.contains(e.target) && notificationBtn && !notificationBtn.contains(e.target)) {
            notificationPopup.classList.add('hidden');
        }
    });
}

// Initialize notifications when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof NotificationAPI !== 'undefined') {
        loadNotifications();
        setupNotificationListeners();
    }
});

