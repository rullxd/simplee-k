// Complaint Details (Admin View) functionality
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

    // Get complaint ID from URL
    const pathParts = window.location.pathname.split('/').filter(part => part);
    let complaintId = null;
    
    // Find the ID (should be after /admin/complaint/)
    const complaintIndex = pathParts.indexOf('complaint');
    if (complaintIndex !== -1 && pathParts.length > complaintIndex + 1) {
        complaintId = pathParts[complaintIndex + 1];
    } else {
        // Fallback: get last part of URL
        complaintId = pathParts[pathParts.length - 1];
    }

    console.log('Extracted complaint ID from URL:', complaintId);

    if (complaintId && complaintId !== 'complaint' && complaintId !== 'admin') {
        await loadComplaintDetails(complaintId);
        setupForm(complaintId);
    } else {
        showError('Complaint ID not found in URL');
    }

    await loadPendingCount();
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

async function loadComplaintDetails(id) {
    if (!id || id === 'undefined' || id === 'null') {
        showError('Invalid complaint ID');
        return;
    }

    try {
        console.log('Fetching complaint with ID:', id);
        const complaint = await ComplaintAPI.getById(id);
        
        if (!complaint || !complaint.id) {
            showError('Complaint not found');
            return;
        }
        
        console.log('Complaint loaded:', complaint);
            displayComplaintDetails(complaint);
    } catch (error) {
        console.error('Error loading complaint:', error);
        showError('Failed to load complaint details: ' + (error.message || 'Unknown error'));
    }
}

function displayComplaintDetails(complaint) {
    console.log('Loading complaint details:', complaint);
    
    // Update page title (h1 in main content)
    const titleEl = document.querySelector('main h1');
    if (titleEl) {
        titleEl.textContent = `Complaint Detail #${complaint.ticket_id}`;
    }

    // Update breadcrumb (last span in nav)
    const nav = document.querySelector('nav.flex.flex-wrap');
    if (nav) {
        const lastSpan = nav.querySelector('span:last-child');
        if (lastSpan) {
            lastSpan.textContent = `Complaint #${complaint.ticket_id}`;
        }
    }

    // Update status badge (in page header div)
    const statusBadge = document.querySelector('div.flex.items-center.gap-3 span.inline-flex');
    if (statusBadge) {
        const statusIcon = complaint.status === 'pending' ? 'pending' : 
                          complaint.status === 'in_process' ? 'timelapse' : 
                          complaint.status === 'completed' ? 'check_circle' : 
                          'cancel';
        statusBadge.innerHTML = `
            <span class="material-symbols-outlined text-[18px]">${statusIcon}</span>
            ${getStatusText(complaint.status)}
        `;
        statusBadge.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusBadgeClass(complaint.status)}`;
    }

    // Update category (span with uppercase text-primary)
    const categoryEl = document.querySelector('div.flex.flex-col.gap-1 span.text-xs.font-bold.tracking-wider.text-primary');
    if (categoryEl) {
        categoryEl.textContent = (complaint.category?.name || 'General').toUpperCase();
    }

    // Update complaint title (h2 in main details card)
    const complaintTitleEl = document.querySelector('div.p-6.border-b h2');
    if (complaintTitleEl) {
        complaintTitleEl.textContent = complaint.title || 'No Title';
    }

    // Update date (in the same div as title, right side)
    const dateContainer = document.querySelector('div.text-right.shrink-0');
    if (dateContainer) {
        const dateSpan = dateContainer.querySelector('div.flex.items-center.gap-1 span:last-child');
        const timeSpan = dateContainer.querySelector('div.text-xs');
        if (dateSpan) {
            const date = new Date(complaint.created_at);
            dateSpan.textContent = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        }
        if (timeSpan) {
            const date = new Date(complaint.created_at);
            timeSpan.textContent = date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
    }

    // Update user info (in the "Reported By" section)
    const userSection = document.querySelector('div.flex.items-center.gap-4.mb-8');
    if (userSection) {
        // Find the div with flex-col that contains user info
        const userInfoDiv = userSection.querySelector('div.flex.flex-col');
        if (userInfoDiv) {
            const userNameEl = userInfoDiv.querySelector('span.text-base.font-bold');
    if (userNameEl) {
        userNameEl.textContent = complaint.user?.name || 'Unknown';
    }

            const userInfoEl = userInfoDiv.querySelector('span.text-sm.text-slate-500') ||
                              userInfoDiv.querySelector('span.text-sm.text-slate-400');
    if (userInfoEl) {
                userInfoEl.textContent = `NIM: ${complaint.user?.student_id || 'N/A'} • ${complaint.user?.email || 'N/A'}`;
            }
        }
    }

    // Update description (p tag in Description section)
    const descSection = document.querySelector('div.space-y-4 h3 + p');
    if (descSection) {
        descSection.textContent = complaint.description || 'No description provided.';
    }

    // Update evidence image
    if (complaint.evidence_path) {
        const imgContainer = document.querySelector('div.aspect-video');
        if (imgContainer) {
            // Extract filename from path (handle both / and \ separators)
            let fileName = complaint.evidence_path;
            // Remove any leading path components (uploads/, /uploads/, uploads\, etc.)
            fileName = fileName.replace(/^.*[\/\\]/, ''); // Remove everything up to last / or \
            // If path already starts with /uploads/, use it directly, otherwise add /uploads/
            let imageUrl;
            if (complaint.evidence_path.startsWith('/uploads/')) {
                imageUrl = complaint.evidence_path;
            } else if (complaint.evidence_path.startsWith('uploads/')) {
                imageUrl = '/' + complaint.evidence_path;
            } else {
                // Just filename, add /uploads/ prefix
                imageUrl = `/uploads/${fileName}`;
            }
            
            imgContainer.style.backgroundImage = `url(${imageUrl})`;
            imgContainer.style.backgroundSize = 'cover';
            imgContainer.style.backgroundPosition = 'center';
        }
    } else {
        // Hide evidence section if no image
        const evidenceSection = document.querySelector('div.mt-8.space-y-4');
        if (evidenceSection) {
            evidenceSection.style.display = 'none';
        }
    }

    // Update status select dropdown
    const statusSelect = document.getElementById('status');
    if (statusSelect) {
        statusSelect.value = complaint.status || 'pending';
        
        // Update the "Current status" text below select
        const currentStatusText = statusSelect.closest('div.space-y-2')?.querySelector('p.text-xs span.font-medium');
        if (currentStatusText) {
            currentStatusText.textContent = getStatusText(complaint.status);
            // Update color based on status
            const statusColors = {
                'pending': 'text-amber-600 dark:text-amber-400',
                'in_process': 'text-blue-600 dark:text-blue-400',
                'completed': 'text-green-600 dark:text-green-400',
                'rejected': 'text-red-600 dark:text-red-400'
            };
            currentStatusText.className = `font-medium ${statusColors[complaint.status] || 'text-amber-600 dark:text-amber-400'}`;
        }
    }

    // Update admin response textarea
    const responseTextarea = document.getElementById('response');
    if (responseTextarea) {
        responseTextarea.value = complaint.admin_response || '';
    }

    // Update contact info (email and phone links if they exist)
    const emailEl = document.querySelector('a[href^="mailto:"]');
    if (emailEl && complaint.user?.email) {
        emailEl.href = `mailto:${complaint.user.email}`;
        emailEl.textContent = complaint.user.email;
    }

    const phoneEl = document.querySelector('a[href^="tel:"]');
    if (phoneEl && complaint.user?.phone) {
        phoneEl.href = `tel:${complaint.user.phone}`;
        phoneEl.textContent = complaint.user.phone;
    }
}

function setupForm(complaintId) {
    const form = document.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const status = document.getElementById('status').value;
        const response = document.getElementById('response').value;

        try {
            const updateData = {};
            if (status) updateData.status = status;
            if (response) updateData.admin_response = response;
            
            await ComplaintAPI.update(complaintId, updateData);

            alert('Complaint updated successfully!');
            await loadComplaintDetails(complaintId);
        } catch (error) {
            alert('Failed to update complaint: ' + error.message);
        }
    });
}

function setupEventListeners() {
    // Logout
    const logoutBtns = document.querySelectorAll('button');
    logoutBtns.forEach(btn => {
        const icon = btn.querySelector('span.material-symbols-outlined');
        if (icon && icon.textContent === 'logout') {
            btn.addEventListener('click', () => {
                AuthAPI.logout();
            });
        }
    });

    // Back to dashboard
    const dashboardLinks = document.querySelectorAll('a');
    dashboardLinks.forEach(link => {
        if (link.textContent.includes('Dashboard')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/admin/dashboard';
            });
        }
    });
}

function showError(message) {
    console.error(message);
    alert(message);
}

// Helper functions
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

function getStatusBadgeClass(status) {
    const classes = {
        'pending': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
        'in_process': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
        'completed': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800',
        'rejected': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
    };
    return classes[status] || classes.pending;
}

function getStatusText(status) {
    const texts = {
        'pending': 'Pending Review',
        'in_process': 'In Process',
        'completed': 'Completed',
        'rejected': 'Rejected'
    };
    return texts[status] || 'Unknown';
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

