// Complaint Details (Student View) functionality
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

    // Get complaint ID from URL
    const pathParts = window.location.pathname.split('/').filter(part => part);
    let complaintId = null;
    
    // Find the ID (should be after /student/complaint/)
    const complaintIndex = pathParts.indexOf('complaint');
    if (complaintIndex !== -1 && pathParts.length > complaintIndex + 1) {
        complaintId = pathParts[complaintIndex + 1];
    } else {
        // Fallback: get last part of URL
        complaintId = pathParts[pathParts.length - 1];
    }

    console.log('Extracted complaint ID from URL:', complaintId);

    if (complaintId && complaintId !== 'complaint' && complaintId !== 'student') {
        await loadComplaintDetails(complaintId);
    } else {
        showError('Complaint ID not found in URL');
    }
});

function updateUserInfo(user) {
    const userNameEl = document.getElementById('userName');
    const studentIdEl = document.getElementById('studentId');
    
    if (userNameEl) {
        userNameEl.textContent = user.name || user.username || 'Student';
    }
    if (studentIdEl) {
        studentIdEl.textContent = `Student ID: ${user.student_id || user.username || 'N/A'}`;
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
        if (error.message && error.message.includes('403')) {
            showError('You do not have permission to view this complaint');
            setTimeout(() => {
                window.location.href = '/student/dashboard';
            }, 2000);
        } else {
            showError('Failed to load complaint details: ' + (error.message || 'Unknown error'));
        }
    }
}

function displayComplaintDetails(complaint) {
    console.log('Displaying complaint details:', complaint);
    
    // Update breadcrumb
    const breadcrumbEl = document.getElementById('breadcrumbTicketId');
    if (breadcrumbEl) {
        breadcrumbEl.textContent = `Complaint #${complaint.ticket_id || complaint.id}`;
    }

    // Update page title
    const titleEl = document.getElementById('complaintTitle');
    if (titleEl) {
        titleEl.textContent = `Complaint Detail #${complaint.ticket_id || complaint.id}`;
    }

    // Update status badge in header
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    if (statusBadge && statusText) {
        statusText.textContent = getStatusText(complaint.status);
        statusBadge.className = `inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadgeClass(complaint.status)}`;
        // Check if status dot exists, if not create it
        let statusDot = statusBadge.querySelector('span:first-child');
        if (!statusDot || statusDot.id === 'statusText') {
            // Create status dot if it doesn't exist
            statusDot = document.createElement('span');
            statusDot.className = `size-2 rounded-full ${getStatusDotColor(complaint.status)}`;
            statusBadge.insertBefore(statusDot, statusText);
        } else {
            statusDot.className = `size-2 rounded-full ${getStatusDotColor(complaint.status)}`;
        }
    }

    // Update category
    const categoryEl = document.getElementById('categoryName');
    if (categoryEl) {
        categoryEl.textContent = (complaint.category?.name || 'General').toUpperCase();
    }

    // Update complaint title
    const complaintTitleDetail = document.getElementById('complaintTitleDetail');
    if (complaintTitleDetail) {
        complaintTitleDetail.textContent = complaint.title || 'No Title';
    }

    // Update dates
    const complaintDate = document.getElementById('complaintDate');
    const complaintTime = document.getElementById('complaintTime');
    if (complaintDate && complaint.created_at) {
        const date = new Date(complaint.created_at);
        complaintDate.textContent = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
    if (complaintTime && complaint.created_at) {
        const date = new Date(complaint.created_at);
        complaintTime.textContent = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    // Update description
    const descriptionEl = document.getElementById('complaintDescription');
    if (descriptionEl) {
        descriptionEl.textContent = complaint.description || 'No description provided.';
    }

    // Update evidence image
    const evidenceSection = document.getElementById('evidenceSection');
    if (complaint.evidence_path) {
        if (evidenceSection) {
            evidenceSection.style.display = 'block';
            
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
            
            // Update image
            const evidenceImage = document.getElementById('evidenceImage');
            const evidenceBackground = document.getElementById('evidenceBackground');
            const viewFullSizeBtn = document.getElementById('viewFullSizeBtn');
            
            if (evidenceImage) {
                evidenceImage.src = imageUrl;
                evidenceImage.style.display = 'block';
            }
            if (evidenceBackground) {
                evidenceBackground.style.backgroundImage = `url(${imageUrl})`;
                evidenceBackground.style.backgroundSize = 'cover';
                evidenceBackground.style.backgroundPosition = 'center';
                evidenceBackground.style.display = 'block';
            }
            if (viewFullSizeBtn) {
                viewFullSizeBtn.href = imageUrl;
            }
        }
    } else {
        if (evidenceSection) {
            evidenceSection.style.display = 'none';
        }
    }

    // Update admin response
    const adminResponseCard = document.getElementById('adminResponseCard');
    const adminResponseText = document.getElementById('adminResponseText');
    if (adminResponseCard && adminResponseText) {
        if (complaint.admin_response && complaint.admin_response.trim()) {
            adminResponseCard.style.display = 'block';
            adminResponseText.textContent = complaint.admin_response;
            
            // Update response date if available
            const responseDate = document.getElementById('responseDate');
            if (responseDate && complaint.updated_at) {
                const date = new Date(complaint.updated_at);
                responseDate.textContent = `Last updated: ${formatDate(complaint.updated_at)}`;
            }
        } else {
            adminResponseCard.style.display = 'none';
        }
    }

    // Update ticket info card
    const ticketId = document.getElementById('ticketId');
    if (ticketId) {
        ticketId.textContent = complaint.ticket_id || complaint.id;
    }

    const ticketStatusBadge = document.getElementById('ticketStatusBadge');
    const ticketStatusText = document.getElementById('ticketStatusText');
    if (ticketStatusBadge && ticketStatusText) {
        ticketStatusText.textContent = getStatusText(complaint.status);
        ticketStatusBadge.className = `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(complaint.status)}`;
        // Find the status dot span (first child span element)
        // Cannot use span.size-1.5 directly because the period in the class name causes issues
        const statusDot = ticketStatusBadge.querySelector('span:first-child');
        if (statusDot) {
            statusDot.className = `size-1.5 rounded-full ${getStatusDotColor(complaint.status)}`;
        }
    }

    const submittedDate = document.getElementById('submittedDate');
    if (submittedDate && complaint.created_at) {
        submittedDate.textContent = formatDate(complaint.created_at);
    }

    const updatedDate = document.getElementById('updatedDate');
    if (updatedDate && complaint.updated_at) {
        updatedDate.textContent = formatDate(complaint.updated_at);
    }
}

function showError(message) {
    console.error(message);
    // Create error alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'fixed top-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 shadow-lg z-50';
    alertDiv.innerHTML = `
        <span class="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
        <p class="text-sm text-red-700 dark:text-red-300">${message}</p>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
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
        'pending': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
        'in_process': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
        'completed': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
        'rejected': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    };
    return classes[status] || classes.pending;
}

function getStatusDotColor(status) {
    const colors = {
        'pending': 'bg-amber-500',
        'in_process': 'bg-blue-500',
        'completed': 'bg-green-500',
        'rejected': 'bg-red-500'
    };
    return colors[status] || colors.pending;
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

