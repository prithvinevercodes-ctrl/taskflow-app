/**
 * TaskFlow App Controller
 * Manages task list rendering, CRUD actions, filters, and statistics.
 */

let taskModalInstance = null;
let deleteModalInstance = null;
let taskToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {

    // Bootstrap Modal instances
    const taskModalEl = document.getElementById('taskModal');
    if (taskModalEl) taskModalInstance = new bootstrap.Modal(taskModalEl);

    const deleteModalEl = document.getElementById('deleteModal');
    if (deleteModalEl) deleteModalInstance = new bootstrap.Modal(deleteModalEl);

    // Filter Elements
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    // Task Form Elements
    const taskForm = document.getElementById('taskForm');
    const openCreateTaskBtn = document.getElementById('openCreateTaskBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Debounce timer for search
    let searchDebounceTimer = null;

    // Toast helper
    window.showToast = function(message, bgClass = 'bg-primary') {
        const toastEl = document.getElementById('appToast');
        const toastMsg = document.getElementById('toastMessage');
        if (toastEl && toastMsg) {
            toastMsg.textContent = message;
            toastEl.className = `toast align-items-center text-white border-0 ${bgClass}`;
            const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
            toast.show();
        }
    };

    // Main Load Tasks function
    window.loadTasks = async function() {
        const search = searchInput ? searchInput.value.trim() : '';
        const status = statusFilter ? statusFilter.value : '';
        const priority = priorityFilter ? priorityFilter.value : '';

        try {
            const tasks = await window.apiService.getTasks(status, priority, search);
            renderTasks(tasks);
            updateDashboardStats(tasks);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            window.showToast('Failed to load tasks', 'bg-danger');
        }
    };

    // Render Tasks Grid
    function renderTasks(tasks) {
        const container = document.getElementById('taskListContainer');
        const emptyState = document.getElementById('emptyState');

        if (!container) return;

        container.innerHTML = '';

        if (!tasks || tasks.length === 0) {
            emptyState.classList.remove('d-none');
            return;
        }

        emptyState.classList.add('d-none');

        tasks.forEach(task => {
            const cardCol = document.createElement('div');
            cardCol.className = 'col-12 col-md-6 col-lg-4';

            const statusClass = getStatusClass(task.status);
            const statusLabel = getStatusLabel(task.status);
            const priorityBadge = getPriorityBadge(task.priority);
            const isCompleted = task.status === 'COMPLETED';
            const formattedDate = task.dueDate ? formatDate(task.dueDate) : 'No due date';

            cardCol.innerHTML = `
                <div class="card h-100 rounded-4 shadow-sm task-card ${statusClass}">
                    <div class="card-body p-4 d-flex flex-column">
                        
                        <!-- Header Badges -->
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <span class="badge ${getStatusBadgeClass(task.status)} rounded-pill px-3 py-2 style-xs fw-semibold">
                                ${statusLabel}
                            </span>
                            <span class="badge ${priorityBadge.class} rounded-pill px-3 py-1 style-xs fw-semibold">
                                ${priorityBadge.label} Priority
                            </span>
                        </div>

                        <!-- Task Title -->
                        <h5 class="card-title fw-bold text-dark mb-2 ${isCompleted ? 'text-decoration-line-through text-muted' : ''}">
                            ${escapeHtml(task.title)}
                        </h5>

                        <!-- Task Description -->
                        <p class="card-text text-secondary small flex-grow-1 mb-3">
                            ${task.description ? escapeHtml(task.description) : '<span class="text-muted fst-italic">No description provided</span>'}
                        </p>

                        <!-- Footer Meta & Actions -->
                        <div class="pt-3 border-top d-flex align-items-center justify-content-between mt-auto">
                            <span class="text-muted style-xs d-flex align-items-center">
                                <i class="bi bi-calendar-event me-1 text-primary"></i> ${formattedDate}
                            </span>

                            <div class="btn-group btn-group-sm">
                                ${task.status !== 'COMPLETED' ? `
                                    <button class="btn btn-outline-success btn-quick-complete" data-id="${task.id}" title="Mark Complete">
                                        <i class="bi bi-check-lg"></i>
                                    </button>
                                ` : ''}
                                <button class="btn btn-outline-secondary btn-edit-task" data-id='${task.id}' title="Edit Task">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-delete-task" data-id="${task.id}" title="Delete Task">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            `;

            container.appendChild(cardCol);
        });

        attachCardEventListeners(tasks);
    }

    // Update Statistics Counter
    function updateDashboardStats(tasks) {
        const totalEl = document.getElementById('statTotal');
        const pendingEl = document.getElementById('statPending');
        const completedEl = document.getElementById('statCompleted');

        if (!totalEl) return;

        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'COMPLETED').length;
        const pending = total - completed;

        totalEl.textContent = total;
        pendingEl.textContent = pending;
        completedEl.textContent = completed;
    }

    // Attach Click Handlers to rendered buttons
    function attachCardEventListeners(tasks) {
        // Quick complete buttons
        document.querySelectorAll('.btn-quick-complete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                try {
                    await window.apiService.updateTask(id, { status: 'COMPLETED' });
                    window.showToast('Task marked as completed!', 'bg-success');
                    window.loadTasks();
                } catch (err) {
                    window.showToast('Failed to update task', 'bg-danger');
                }
            });
        });

        // Edit task buttons
        document.querySelectorAll('.btn-edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const task = tasks.find(t => t.id == id);
                if (task) {
                    openEditModal(task);
                }
            });
        });

        // Delete task buttons
        document.querySelectorAll('.btn-delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                taskToDeleteId = e.currentTarget.getAttribute('data-id');
                if (deleteModalInstance) deleteModalInstance.show();
            });
        });
    }

    // Open Modal in Edit Mode
    function openEditModal(task) {
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskStatus').value = task.status || 'TODO';
        document.getElementById('taskPriority').value = task.priority || 'MEDIUM';
        document.getElementById('taskDueDate').value = task.dueDate || '';

        document.getElementById('taskModalLabel').textContent = 'Edit Task';
        if (taskModalInstance) taskModalInstance.show();
    }

    // Reset Modal for Create Mode
    if (openCreateTaskBtn) {
        openCreateTaskBtn.addEventListener('click', () => {
            taskForm.reset();
            document.getElementById('taskId').value = '';
            document.getElementById('taskStatus').value = 'TODO';
            document.getElementById('taskPriority').value = 'MEDIUM';
            document.getElementById('taskModalLabel').textContent = 'Create New Task';
        });
    }

    // Save Task Submit Handler
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const taskId = document.getElementById('taskId').value;
            const title = document.getElementById('taskTitle').value.trim();
            const description = document.getElementById('taskDescription').value.trim();
            const status = document.getElementById('taskStatus').value;
            const priority = document.getElementById('taskPriority').value;
            const dueDate = document.getElementById('taskDueDate').value;

            const payload = { title, description, status, priority, dueDate };

            try {
                if (taskId) {
                    await window.apiService.updateTask(taskId, payload);
                    window.showToast('Task updated successfully!', 'bg-success');
                } else {
                    await window.apiService.createTask(payload);
                    window.showToast('Task created successfully!', 'bg-success');
                }

                if (taskModalInstance) taskModalInstance.hide();
                taskForm.reset();
                window.loadTasks();
            } catch (err) {
                window.showToast('Error saving task', 'bg-danger');
            }
        });
    }

    // Confirm Delete Handler
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!taskToDeleteId) return;

            try {
                await window.apiService.deleteTask(taskToDeleteId);
                window.showToast('Task deleted successfully', 'bg-secondary');
                if (deleteModalInstance) deleteModalInstance.hide();
                taskToDeleteId = null;
                window.loadTasks();
            } catch (err) {
                window.showToast('Failed to delete task', 'bg-danger');
            }
        });
    }

    // Filter Listeners
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                window.loadTasks();
            }, 300);
        });
    }

    if (statusFilter) statusFilter.addEventListener('change', window.loadTasks);
    if (priorityFilter) priorityFilter.addEventListener('change', window.loadTasks);

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (statusFilter) statusFilter.value = '';
            if (priorityFilter) priorityFilter.value = '';
            window.loadTasks();
        });
    }

    // Utility Helpers
    function getStatusClass(status) {
        switch (status) {
            case 'COMPLETED': return 'is-completed';
            case 'IN_PROGRESS': return 'is-in-progress';
            default: return 'is-todo';
        }
    }

    function getStatusBadgeClass(status) {
        return `badge-status-${status}`;
    }

    function getStatusLabel(status) {
        switch (status) {
            case 'COMPLETED': return 'Completed';
            case 'IN_PROGRESS': return 'In Progress';
            default: return 'To Do';
        }
    }

    function getPriorityBadge(priority) {
        switch (priority) {
            case 'HIGH': return { class: 'badge-priority-HIGH', label: 'High' };
            case 'LOW': return { class: 'badge-priority-LOW', label: 'Low' };
            default: return { class: 'badge-priority-MEDIUM', label: 'Medium' };
        }
    }

    function formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
});
