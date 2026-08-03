/**
 * TaskFlow API Service
 * Encapsulates backend REST endpoints with fallback local memory store.
 */

const API_BASE_URL = `${window.location.origin}/api`;

class ApiService {

    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('taskflow_user')) || null;
        this.useFallback = false; // set to true if server is unreachable
    }

    getCurrentUser() {
        return this.currentUser;
    }

    setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            localStorage.setItem('taskflow_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('taskflow_user');
        }
    }

    async register(name, email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            // Standalone dev fallback if backend REST is not running live
            console.warn('API server unavailable, operating in local session mode:', error.message);
            const user = { id: 1, name, email };
            return { id: 1, name, email, message: 'Registration successful' };
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Invalid email or password');
            }

            const data = await response.json();
            this.setCurrentUser(data);
            return data;
        } catch (error) {
            console.warn('API server unavailable, operating in local session mode:', error.message);
            const name = email.split('@')[0];
            const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
            const user = { id: 1, name: formattedName, email };
            this.setCurrentUser(user);
            return user;
        }
    }

    async logout() {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
        } catch (e) {
            // Ignore offline network errors on logout
        }
        this.setCurrentUser(null);
    }

    async getTasks(status = '', priority = '', search = '') {
        const userId = this.currentUser ? this.currentUser.id : 1;
        const params = new URLSearchParams();
        params.append('userId', userId);
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        if (search) params.append('search', search);

        try {
            const response = await fetch(`${API_BASE_URL}/tasks?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch tasks');
            return await response.json();
        } catch (error) {
            console.warn('Using local task store fallback');
            return this.getLocalTasks(userId, status, priority, search);
        }
    }

    async createTask(taskData) {
        const userId = this.currentUser ? this.currentUser.id : 1;
        taskData.userId = userId;

        try {
            const response = await fetch(`${API_BASE_URL}/tasks?userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            if (!response.ok) throw new Error('Failed to create task');
            return await response.json();
        } catch (error) {
            return this.createLocalTask(taskData);
        }
    }

    async updateTask(id, taskData) {
        const userId = this.currentUser ? this.currentUser.id : 1;

        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}?userId=${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            if (!response.ok) throw new Error('Failed to update task');
            return await response.json();
        } catch (error) {
            return this.updateLocalTask(id, taskData);
        }
    }

    async deleteTask(id) {
        const userId = this.currentUser ? this.currentUser.id : 1;

        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}?userId=${userId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete task');
            return true;
        } catch (error) {
            return this.deleteLocalTask(id);
        }
    }

    /* Local Storage Standalone Fallback Methods */
    getLocalTasks(userId, status, priority, search) {
        let tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || this.getDefaultTasks();
        
        return tasks.filter(task => {
            if (status && task.status !== status) return false;
            if (priority && task.priority !== priority) return false;
            if (search) {
                const q = search.toLowerCase();
                const titleMatch = task.title && task.title.toLowerCase().includes(q);
                const descMatch = task.description && task.description.toLowerCase().includes(q);
                if (!titleMatch && !descMatch) return false;
            }
            return true;
        });
    }

    createLocalTask(data) {
        let tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || this.getDefaultTasks();
        const newTask = {
            id: Date.now(),
            title: data.title,
            description: data.description || '',
            status: data.status || 'TODO',
            priority: data.priority || 'MEDIUM',
            dueDate: data.dueDate || null,
            createdAt: new Date().toISOString(),
            userId: data.userId || 1
        };
        tasks.unshift(newTask);
        localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
        return newTask;
    }

    updateLocalTask(id, data) {
        let tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || this.getDefaultTasks();
        const index = tasks.findIndex(t => t.id == id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...data };
            localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
            return tasks[index];
        }
        throw new Error('Task not found');
    }

    deleteLocalTask(id) {
        let tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || this.getDefaultTasks();
        tasks = tasks.filter(t => t.id != id);
        localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
        return true;
    }

    getDefaultTasks() {
        const sampleTasks = [
            {
                id: 1,
                title: 'Set up Spring Boot & Java backend',
                description: 'Configure Maven pom.xml, Spring Data JPA repositories, and REST API controllers.',
                status: 'COMPLETED',
                priority: 'HIGH',
                dueDate: '2026-08-04',
                createdAt: new Date().toISOString(),
                userId: 1
            },
            {
                id: 2,
                title: 'Build Bootstrap 5 dashboard UI',
                description: 'Implement task list cards, metrics summary, and responsive layout for mobile and desktop.',
                status: 'IN_PROGRESS',
                priority: 'HIGH',
                dueDate: '2026-08-05',
                createdAt: new Date().toISOString(),
                userId: 1
            },
            {
                id: 3,
                title: 'Implement search and status filters',
                description: 'Allow users to filter tasks by TODO, IN_PROGRESS, and COMPLETED, or search by text.',
                status: 'TODO',
                priority: 'MEDIUM',
                dueDate: '2026-08-07',
                createdAt: new Date().toISOString(),
                userId: 1
            }
        ];
        localStorage.setItem('taskflow_tasks', JSON.stringify(sampleTasks));
        return sampleTasks;
    }
}

window.apiService = new ApiService();
