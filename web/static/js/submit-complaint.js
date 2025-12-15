// Submit Complaint form functionality
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

    // Load categories
    await loadCategories();

    // Setup form
    setupForm();
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

async function loadCategories() {
    try {
        const categories = await CategoryAPI.getAll();
        const categorySelect = document.getElementById('category');
        
        if (categorySelect && categories) {
            // Clear existing options except the first one
            const firstOption = categorySelect.querySelector('option[disabled]');
            categorySelect.innerHTML = '';
            if (firstOption) {
                categorySelect.appendChild(firstOption);
            }

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function setupForm() {
    const form = document.querySelector('form');
    const fileInput = document.querySelector('input[type="file"]');
    const fileUploadArea = fileInput?.closest('.border-dashed');

    // File upload preview
    if (fileInput && fileUploadArea) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Validate file size (5MB)
                if (file.size > 5242880) {
                    alert('File size must be less than 5MB');
                    fileInput.value = '';
                    return;
                }

                // Show file name
                const fileName = file.name;
                const uploadText = fileUploadArea.querySelector('.text-sm');
                if (uploadText) {
                    uploadText.innerHTML = `<span class="font-semibold text-primary">${fileName}</span>`;
                }
            }
        });

        // Drag and drop
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('bg-slate-100', 'dark:bg-slate-700');
        });

        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('bg-slate-100', 'dark:bg-slate-700');
        });

        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('bg-slate-100', 'dark:bg-slate-700');
            const file = e.dataTransfer.files[0];
            if (file) {
                fileInput.files = e.dataTransfer.files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('category_id', document.getElementById('category').value);
            formData.append('title', document.getElementById('title').value);
            formData.append('description', document.getElementById('description').value);

            const file = fileInput?.files[0];
            if (file) {
                formData.append('evidence', file);
            }

            // Validate
            if (!formData.get('category_id') || !formData.get('title') || !formData.get('description')) {
                alert('Please fill in all required fields');
                return;
            }

            try {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitting...';
                }

                const response = await ComplaintAPI.create(formData);

                if (response && response.id) {
                    alert('Complaint submitted successfully!');
                    window.location.href = '/student/dashboard';
                } else {
                    throw new Error(response.error || 'Failed to submit complaint');
                }
            } catch (error) {
                alert(error.message || 'Failed to submit complaint. Please try again.');
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>Submit Complaint</span><span class="material-symbols-outlined text-[18px]">send</span>';
                }
            }
        });
    }

    // Cancel button
    const cancelBtn = document.querySelector('button[type="button"]');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
                window.location.href = '/student/dashboard';
            }
        });
    }
}

