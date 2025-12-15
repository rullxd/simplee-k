// Reports Dashboard functionality
let trendsChart = null;

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

    // Load all report data
    await loadReports();

    // Setup event listeners
    setupEventListeners();
});

async function loadReports() {
    try {
        // Load report stats
        const reportStats = await ReportAPI.getStats();
        if (reportStats) {
            updateReportStats(reportStats);
        }

        // Load category stats
        const categories = await ReportAPI.getCategories();
        if (categories) {
            displayCategories(categories);
        }

        // Load trends
        const trends = await ReportAPI.getTrends();
        if (trends) {
            renderTrendsChart(trends);
        }

        // Load recent complaints
        const complaints = await ComplaintAPI.getAll({ page: 1, limit: 10 });
        if (complaints && complaints.data) {
            displayRecentComplaints(complaints.data);
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        showError('Failed to load report data: ' + (error.message || 'Unknown error'));
    }
    
    // Load pending count for sidebar badge (separate try-catch to ensure it always runs)
    try {
        const complaintStats = await ComplaintAPI.getStats();
        if (complaintStats) {
            updatePendingCount(complaintStats);
        }
    } catch (error) {
        console.error('Error loading pending count:', error);
    }
}

function updatePendingCount(stats) {
    const pendingCountEl = document.getElementById('pendingCount');
    if (pendingCountEl && stats && stats.pending !== undefined) {
        pendingCountEl.textContent = stats.pending;
        if (stats.pending === 0) {
            pendingCountEl.style.display = 'none';
        } else {
            pendingCountEl.style.display = 'flex';
        }
    } else {
        console.warn('Pending count badge not found or stats data incomplete:', { pendingCountEl, stats });
    }
}

function updateReportStats(stats) {
    // Format number with thousand separator
    const formatNumber = (num) => {
        return num ? num.toLocaleString('en-US') : '0';
    };

    // Update Total Complaints
    const totalEl = document.getElementById('totalComplaints');
    if (totalEl && stats.total) {
        totalEl.textContent = formatNumber(stats.total.value);
    }
    if (stats.total && stats.total.change) {
        const changeEl = document.getElementById('totalChange');
        if (changeEl) {
            const isPositive = stats.total.change >= 0;
            changeEl.innerHTML = `${isPositive ? '+' : ''}${stats.total.change.toFixed(1)}%<span class="material-symbols-outlined" style="font-size: 14px;">${isPositive ? 'arrow_upward' : 'arrow_downward'}</span>`;
            changeEl.className = `flex items-center text-xs font-medium ${isPositive ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'} px-2 py-1 rounded-full`;
        }
    }

    // Update Pending Review
    const pendingEl = document.getElementById('pendingReview');
    if (pendingEl && stats.pending) {
        pendingEl.textContent = formatNumber(stats.pending.value);
    }
    if (stats.pending && stats.pending.change) {
        const changeEl = document.getElementById('pendingChange');
        if (changeEl) {
            const isPositive = stats.pending.change >= 0;
            changeEl.innerHTML = `${isPositive ? '+' : ''}${stats.pending.change.toFixed(1)}%<span class="material-symbols-outlined" style="font-size: 14px;">${isPositive ? 'arrow_upward' : 'arrow_downward'}</span>`;
            changeEl.className = `flex items-center text-xs font-medium ${isPositive ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'} px-2 py-1 rounded-full`;
        }
    }

    // Update Resolved Issues
    const resolvedEl = document.getElementById('resolvedIssues');
    if (resolvedEl && stats.resolved) {
        resolvedEl.textContent = formatNumber(stats.resolved.value);
    }
    if (stats.resolved && stats.resolved.change) {
        const changeEl = document.getElementById('resolvedChange');
        if (changeEl) {
            const isPositive = stats.resolved.change >= 0;
            changeEl.innerHTML = `${isPositive ? '+' : ''}${stats.resolved.change.toFixed(1)}%<span class="material-symbols-outlined" style="font-size: 14px;">${isPositive ? 'arrow_upward' : 'arrow_downward'}</span>`;
            changeEl.className = `flex items-center text-xs font-medium ${isPositive ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'} px-2 py-1 rounded-full`;
        }
    }

    // Update Avg Resolution Time
    const resolutionTimeEl = document.getElementById('avgResolutionTime');
    if (resolutionTimeEl && stats.avg_resolution_time) {
        const days = stats.avg_resolution_time.days || 0;
        resolutionTimeEl.textContent = `${days.toFixed(1)} Days`;
    }
    if (stats.avg_resolution_time && stats.avg_resolution_time.change) {
        const changeEl = document.getElementById('resolutionTimeChange');
        if (changeEl) {
            const isPositive = stats.avg_resolution_time.change >= 0;
            changeEl.innerHTML = `${isPositive ? '+' : ''}${stats.avg_resolution_time.change.toFixed(1)}%<span class="material-symbols-outlined" style="font-size: 14px;">${isPositive ? 'arrow_upward' : 'arrow_downward'}</span>`;
            changeEl.className = `flex items-center text-xs font-medium ${isPositive ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-green-600 bg-green-50 dark:bg-green-900/20'} px-2 py-1 rounded-full`;
        }
    }
}

function displayCategories(categoriesData) {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList || !categoriesData.categories) return;

    const total = categoriesData.total || 1;
    let html = '';

    // Sort categories by percentage (descending)
    const sortedCategories = [...categoriesData.categories].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

    sortedCategories.forEach((category, index) => {
        const percentage = category.percentage || 0;
        const categoryName = category.category_name || 'Other';
        
        // Color mapping for categories
        const colors = [
            { bg: 'bg-primary', text: 'text-primary' },
            { bg: 'bg-blue-500', text: 'text-blue-500' },
            { bg: 'bg-purple-500', text: 'text-purple-500' },
            { bg: 'bg-slate-300 dark:bg-slate-600', text: 'text-slate-500' }
        ];
        const color = colors[Math.min(index, colors.length - 1)];
        
        html += `
            <div>
                <div class="flex items-center justify-between mb-2.5">
                    <span class="text-sm font-semibold text-slate-900 dark:text-white">${categoryName}</span>
                    <span class="text-sm font-bold text-slate-700 dark:text-slate-300">${percentage.toFixed(0)}%</span>
                </div>
                <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div class="${color.bg} h-2.5 rounded-full transition-all duration-500 ease-out" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });

    categoriesList.innerHTML = html;
}

function renderTrendsChart(trendsData) {
    const ctx = document.getElementById('trendsChart');
    if (!ctx || !trendsData) return;

    // Destroy existing chart if it exists
    if (trendsChart) {
        trendsChart.destroy();
    }

    // Prepare data
    const submissionData = trendsData.submissions || [];
    const resolvedData = trendsData.resolved || [];

    // Create date map for easier lookup
    const dateMap = {};
    submissionData.forEach(item => {
        dateMap[item.date] = { submission: item.count || 0, resolved: 0 };
    });
    resolvedData.forEach(item => {
        if (!dateMap[item.date]) {
            dateMap[item.date] = { submission: 0, resolved: 0 };
        }
        dateMap[item.date].resolved = item.count || 0;
    });

    // Get all unique dates and sort them
    const dates = Object.keys(dateMap).sort();
    
    // Format dates for display (e.g., "Oct 1")
    const formattedDates = dates.map(date => {
        // Handle date format from database (YYYY-MM-DD)
        const dateStr = date.split('T')[0]; // Remove time if present
        const [year, month, day] = dateStr.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[d.getMonth()]} ${d.getDate()}`;
    });

    const submissionValues = dates.map(date => dateMap[date].submission);
    const resolvedValues = dates.map(date => dateMap[date].resolved);

    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedDates,
            datasets: [
                {
                    label: 'Submission',
                    data: submissionValues,
                    borderColor: '#137fec',
                    backgroundColor: 'rgba(19, 127, 236, 0.1)',
                    tension: 0.4,
                    fill: true,
                },
                {
                    label: 'Resolved',
                    data: resolvedValues,
                    borderColor: '#cbd5e1',
                    backgroundColor: 'rgba(203, 213, 225, 0.1)',
                    tension: 0.4,
                    fill: true,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function displayRecentComplaints(complaints) {
    const tbody = document.getElementById('recentComplaintsTable');
    if (!tbody) return;

    if (complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-500">No complaints found</td></tr>';
        return;
    }

    tbody.innerHTML = complaints.map(complaint => {
        const statusBadge = getStatusBadge(complaint.status);
        const date = formatDate(complaint.created_at);
        const studentName = complaint.user?.name || 'Unknown';
        const studentDept = complaint.user?.student_id ? `(${complaint.user.student_id})` : '';

        return `
            <tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="py-3 px-4 text-sm font-mono text-slate-600 dark:text-slate-400">#${complaint.ticket_id}</td>
                <td class="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">${complaint.title || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">${studentName} ${studentDept}</td>
                <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">${date}</td>
                <td class="py-3 px-4">${statusBadge}</td>
                <td class="py-3 px-4">
                    <button onclick="viewComplaint(${complaint.id})" class="text-slate-400 hover:text-primary transition-colors">
                        <span class="material-symbols-outlined" style="font-size: 20px;">more_vert</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Pending</span>',
        'in_process': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">In Process</span>',
        'completed': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Completed</span>',
        'rejected': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Rejected</span>'
    };
    return badges[status] || badges.pending;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function viewComplaint(id) {
    window.location.href = `/admin/complaint/${id}`;
}

function setupEventListeners() {
    // Search complaints
    const searchInput = document.getElementById('searchComplaints');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            const search = e.target.value;
            try {
                const response = await ComplaintAPI.getAll({ search, page: 1, limit: 10 });
                if (response && response.data) {
                    displayRecentComplaints(response.data);
                }
            } catch (error) {
                console.error('Error searching complaints:', error);
            }
        }, 500));
    }

    // Logout
    const logoutLinks = document.querySelectorAll('a, button');
    logoutLinks.forEach(link => {
        const icon = link.querySelector('span.material-symbols-outlined');
        if (icon && (icon.textContent === 'logout' || link.textContent.includes('Log Out'))) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                AuthAPI.logout();
            });
        }
    });
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

