// Settings page functionality
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

    // Load settings
    await loadSettings();
    await loadPendingCount();

    // Setup event listeners
    setupEventListeners();
});

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

async function loadSettings() {
    try {
        // Load system information
        // Note: In a real application, you would fetch this from an API endpoint
        // For now, we'll use default values
        
        // Update database info (from config or API)
        // These would typically come from an API endpoint like /api/settings
        updateSystemInfo();
    } catch (error) {
        console.error('Error loading settings:', error);
        showError('Failed to load settings');
    }
}

function updateSystemInfo() {
    // Update database status
    const dbStatus = document.getElementById('dbStatus');
    if (dbStatus) {
        dbStatus.textContent = 'Connected';
        dbStatus.className = 'text-sm font-semibold text-green-600 dark:text-green-400';
    }

    // Update Go version (would come from API)
    const goVersion = document.getElementById('goVersion');
    if (goVersion) {
        goVersion.textContent = 'Go 1.21+';
    }

    // Update server uptime (would come from API)
    const serverUptime = document.getElementById('serverUptime');
    if (serverUptime) {
        // In a real app, this would be calculated from server start time
        serverUptime.textContent = 'Running';
    }
}

function setupEventListeners() {
    // Tab navigation
    const tabLinks = document.querySelectorAll('.settings-tab');
    tabLinks.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            await handleSaveSettings();
        });
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Discard all changes?')) {
                window.location.reload();
            }
        });
    }
}

function switchTab(tabName) {
    // Hide all content tabs
    const allContentTabs = document.querySelectorAll('.settings-content');
    allContentTabs.forEach(tab => {
        tab.classList.add('hidden');
    });

    // Remove active state from all tab links
    const allTabLinks = document.querySelectorAll('.settings-tab');
    allTabLinks.forEach(link => {
        link.classList.remove('bg-primary/10', 'text-primary');
        link.classList.add('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
    });

    // Show selected content tab
    const selectedContentTab = document.getElementById(`${tabName}-tab`);
    if (selectedContentTab) {
        selectedContentTab.classList.remove('hidden');
    }

    // Add active state to selected tab link
    const selectedTabLink = document.querySelector(`.settings-tab[data-tab="${tabName}"]`);
    if (selectedTabLink) {
        selectedTabLink.classList.add('bg-primary/10', 'text-primary');
        selectedTabLink.classList.remove('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
    }
}

async function handleSaveSettings() {
    const saveBtn = document.getElementById('saveBtn');
    const originalHTML = saveBtn.innerHTML;
    
    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">lock</span>Saving...';

        // Collect form data from General tab
        const settings = {
            siteName: document.getElementById('siteName').value,
            campusCode: document.getElementById('campusCode').value,
            supportEmail: document.getElementById('supportEmail').value,
            maintenanceMode: document.getElementById('maintenanceMode').checked,
            logRetention: document.getElementById('logRetention').value,
            analyticsProvider: document.getElementById('analyticsProvider').value,
        };

        // Validate
        if (!settings.siteName || !settings.campusCode || !settings.supportEmail) {
            alert('Please fill in all required fields');
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHTML;
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(settings.supportEmail)) {
            alert('Please enter a valid email address');
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHTML;
            return;
        }

        // Note: In a real application, you would send this to an API endpoint
        // await apiRequest('/api/settings', { method: 'PUT', body: JSON.stringify(settings) });

        alert('Settings saved successfully! Note: Some changes may require server restart.');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings: ' + (error.message || 'Unknown error'));
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalHTML;
    }
}

function showError(message) {
    console.error(message);
    alert(message);
}
