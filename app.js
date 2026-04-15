/* ============================================
   TASK MANAGER - APLICACIÓN COMPLETA
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    //  ESTADO DE LA APLICACIÓN
    // ==========================================
    let tasks = [];
    let currentFilter = 'all';
    let currentSort = 'date-desc';
    let searchQuery = '';
    let editingTaskId = null;

    // ==========================================
    //  ELEMENTOS DEL DOM
    // ==========================================
    const DOM = {
        taskForm: document.getElementById('taskForm'),
        taskInput: document.getElementById('taskInput'),
        prioritySelect: document.getElementById('prioritySelect'),
        categorySelect: document.getElementById('categorySelect'),
        dueDateInput: document.getElementById('dueDateInput'),
        taskList: document.getElementById('taskList'),
        emptyState: document.getElementById('emptyState'),
        searchInput: document.getElementById('searchInput'),
        sortSelect: document.getElementById('sortSelect'),
        filterTabs: document.getElementById('filterTabs'),
        addBtn: document.getElementById('addBtn'),
        clearCompletedBtn: document.getElementById('clearCompletedBtn'),
        dateDisplay: document.getElementById('dateDisplay'),

        // Estadísticas
        totalTasks: document.getElementById('totalTasks'),
        pendingTasks: document.getElementById('pendingTasks'),
        completedTasks: document.getElementById('completedTasks'),
        countAll: document.getElementById('countAll'),
        countPending: document.getElementById('countPending'),
        countCompleted: document.getElementById('countCompleted'),

        // Modal
        editModal: document.getElementById('editModal'),
        editTaskInput: document.getElementById('editTaskInput'),
        editPrioritySelect: document.getElementById('editPrioritySelect'),
        editCategorySelect: document.getElementById('editCategorySelect'),
        editDueDateInput: document.getElementById('editDueDateInput'),
        modalClose: document.getElementById('modalClose'),
        editCancelBtn: document.getElementById('editCancelBtn'),
        editSaveBtn: document.getElementById('editSaveBtn'),

        // Notificación
        notification: document.getElementById('notification'),
    };

    // ==========================================
    //  UTILIDADES
    // ==========================================
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    function isOverdue(dateStr) {
        if (!dateStr) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dateStr + 'T00:00:00');
        return due < today;
    }

    function displayCurrentDate() {
        const now = new Date();
        const options = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        };
        const formatted = now.toLocaleDateString('es-ES', options);
        DOM.dateDisplay.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    function showNotification(message, type = 'info') {
        DOM.notification.textContent = message;
        DOM.notification.className = 'notification ' + type;
        // Forzar reflow para reiniciar la animación
        void DOM.notification.offsetWidth;
        DOM.notification.classList.add('show');

        setTimeout(() => {
            DOM.notification.classList.remove('show');
        }, 2500);
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };

    const categoryLabels = {
        personal: '👤 Personal',
        work: '💼 Trabajo',
        study: '📚 Estudio',
        health: '🏥 Salud',
        other: '📌 Otro',
    };

    const priorityLabels = {
        high: '🔴 Alta',
        medium: '🟡 Media',
        low: '🟢 Baja',
    };

    // ==========================================
    //  LOCAL STORAGE
    // ==========================================
    function saveTasks() {
        localStorage.setItem('taskmanager_tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const stored = localStorage.getItem('taskmanager_tasks');
        if (stored) {
            try {
                tasks = JSON.parse(stored);
            } catch (e) {
                tasks = [];
            }
        }
    }

    // ==========================================
    //  OPERACIONES CRUD
    // ==========================================
    function addTask(name, priority, category, dueDate) {
        const task = {
            id: generateId(),
            name: name.trim(),
            priority,
            category,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString(),
        };
        tasks.unshift(task);
        saveTasks();
        render();
        showNotification('✅ Tarea agregada correctamente', 'success');
    }

    function toggleTask(id) {
        const task = tasks.find((t) => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            render();
            showNotification(
                task.completed ? '🎉 ¡Tarea completada!' : '🔄 Tarea marcada como pendiente',
                'info'
            );
        }
    }

    function deleteTask(id) {
        const taskEl = document.querySelector(`[data-id="${id}"]`);
        if (taskEl) {
            taskEl.classList.add('removing');
            setTimeout(() => {
                tasks = tasks.filter((t) => t.id !== id);
                saveTasks();
                render();
                showNotification('🗑️ Tarea eliminada', 'error');
            }, 300);
        }
    }

    function editTask(id) {
        const task = tasks.find((t) => t.id === id);
        if (!task) return;

        editingTaskId = id;
        DOM.editTaskInput.value = task.name;
        DOM.editPrioritySelect.value = task.priority;
        DOM.editCategorySelect.value = task.category;
        DOM.editDueDateInput.value = task.dueDate;
        DOM.editModal.classList.add('active');
        DOM.editTaskInput.focus();
    }

    function saveEditedTask() {
        const task = tasks.find((t) => t.id === editingTaskId);
        if (!task) return;

        const newName = DOM.editTaskInput.value.trim();
        if (!newName) {
            showNotification('⚠️ El nombre no puede estar vacío', 'error');
            return;
        }

        task.name = newName;
        task.priority = DOM.editPrioritySelect.value;
        task.category = DOM.editCategorySelect.value;
        task.dueDate = DOM.editDueDateInput.value;

        saveTasks();
        closeModal();
        render();
        showNotification('✏️ Tarea actualizada', 'success');
    }

    function closeModal() {
        DOM.editModal.classList.remove('active');
        editingTaskId = null;
    }

    function clearCompleted() {
        const completedCount = tasks.filter((t) => t.completed).length;
        if (completedCount === 0) {
            showNotification('ℹ️ No hay tareas completadas para limpiar', 'info');
            return;
        }
        tasks = tasks.filter((t) => !t.completed);
        saveTasks();
        render();
        showNotification(`🧹 ${completedCount} tarea(s) eliminada(s)`, 'success');
    }

    // ==========================================
    //  FILTRADO Y ORDENAMIENTO
    // ==========================================
    function getFilteredTasks() {
        let filtered = [...tasks];

        // Filtrar por estado
        if (currentFilter === 'pending') {
            filtered = filtered.filter((t) => !t.completed);
        } else if (currentFilter === 'completed') {
            filtered = filtered.filter((t) => t.completed);
        }

        // Filtrar por búsqueda
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    t.name.toLowerCase().includes(query) ||
                    t.category.toLowerCase().includes(query) ||
                    t.priority.toLowerCase().includes(query)
            );
        }

        // Ordenar
        switch (currentSort) {
            case 'date-desc':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'date-asc':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'priority':
                filtered.sort(
                    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
                );
                break;
            case 'alpha':
                filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'));
                break;
            case 'due-date':
                filtered.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
        }

        return filtered;
    }

    // ==========================================
    //  RENDERIZADO
    // ==========================================
    function render() {
        renderStats();
        renderTasks();
    }

    function renderStats() {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.completed).length;
        const pending = total - completed;

        DOM.totalTasks.textContent = total;
        DOM.pendingTasks.textContent = pending;
        DOM.completedTasks.textContent = completed;

        DOM.countAll.textContent = total;
        DOM.countPending.textContent = pending;
        DOM.countCompleted.textContent = completed;
    }

    function renderTasks() {
        const filtered = getFilteredTasks();

        // Mostrar/ocultar estado vacío
        if (filtered.length === 0) {
            DOM.taskList.innerHTML = '';
            DOM.emptyState.style.display = 'block';

            if (tasks.length > 0 && searchQuery) {
                DOM.emptyState.querySelector('h3').textContent = 'Sin resultados';
                DOM.emptyState.querySelector('p').textContent =
                    'No se encontraron tareas con "' + searchQuery + '"';
            } else if (tasks.length > 0 && currentFilter !== 'all') {
                DOM.emptyState.querySelector('h3').textContent =
                    'No hay tareas ' + (currentFilter === 'pending' ? 'pendientes' : 'completadas');
                DOM.emptyState.querySelector('p').textContent =
                    'Prueba con otro filtro';
            } else {
                DOM.emptyState.querySelector('h3').textContent = 'No hay tareas aún';
                DOM.emptyState.querySelector('p').textContent =
                    'Agrega tu primera tarea para comenzar a organizarte';
            }
        } else {
            DOM.emptyState.style.display = 'none';
            DOM.taskList.innerHTML = filtered.map(createTaskHTML).join('');
        }
    }

    function createTaskHTML(task) {
        const completedClass = task.completed ? 'completed' : '';
        const checkedAttr = task.completed ? 'checked' : '';
        const overdueClass = !task.completed && isOverdue(task.dueDate) ? 'overdue' : '';
        const dateDisplay = task.dueDate ? formatDate(task.dueDate) : '';
        const overdueText = overdueClass ? ' ⚠️ Vencida' : '';

        return `
            <li class="task-item ${completedClass}" data-id="${task.id}">
                <div class="task-checkbox">
                    <input 
                        type="checkbox" 
                        ${checkedAttr} 
                        onchange="window.taskManager.toggleTask('${task.id}')"
                        aria-label="Marcar como completada"
                    >
                    <span class="checkmark"></span>
                </div>

                <div class="task-info">
                    <div class="task-name">${escapeHTML(task.name)}</div>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">
                            ${priorityLabels[task.priority]}
                        </span>
                        <span class="task-category">
                            ${categoryLabels[task.category]}
                        </span>
                        ${
                            dateDisplay
                                ? `<span class="task-date ${overdueClass}">
                                    📅 ${dateDisplay}${overdueText}
                                  </span>`
                                : ''
                        }
                    </div>
                </div>

                <div class="task-actions">
                    <button 
                        class="task-action-btn edit" 
                        onclick="window.taskManager.editTask('${task.id}')" 
                        title="Editar"
                    >
                        ✏️
                    </button>
                    <button 
                        class="task-action-btn delete" 
                        onclick="window.taskManager.deleteTask('${task.id}')" 
                        title="Eliminar"
                    >
                        🗑️
                    </button>
                </div>
            </li>
        `;
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==========================================
    //  EVENT LISTENERS
    // ==========================================
    function initEventListeners() {
        // Agregar tarea
        DOM.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = DOM.taskInput.value.trim();
            if (!name) {
                showNotification('⚠️ Escribe el nombre de la tarea', 'error');
                DOM.taskInput.focus();
                return;
            }

            addTask(
                name,
                DOM.prioritySelect.value,
                DOM.categorySelect.value,
                DOM.dueDateInput.value
            );

            DOM.taskInput.value = '';
            DOM.dueDateInput.value = '';
            DOM.taskInput.focus();
        });

        // Filtros
        DOM.filterTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.filter-tab');
            if (!tab) return;

            document.querySelectorAll('.filter-tab').forEach((t) =>
                t.classList.remove('active')
            );
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            render();
        });

        // Ordenamiento
        DOM.sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            render();
        });

        // Búsqueda
        DOM.searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            render();
        });

        // Limpiar completadas
        DOM.clearCompletedBtn.addEventListener('click', clearCompleted);

        // Modal
        DOM.modalClose.addEventListener('click', closeModal);
        DOM.editCancelBtn.addEventListener('click', closeModal);
        DOM.editSaveBtn.addEventListener('click', saveEditedTask);

        DOM.editModal.addEventListener('click', (e) => {
            if (e.target === DOM.editModal) closeModal();
        });

        DOM.editTaskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveEditedTask();
            if (e.key === 'Escape') closeModal();
        });

        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && DOM.editModal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // ==========================================
    //  INICIALIZACIÓN
    // ==========================================
    function init() {
        loadTasks();
        displayCurrentDate();
        initEventListeners();
        render();

        // Establecer fecha mínima en el input de fecha
        const today = new Date().toISOString().split('T')[0];
        DOM.dueDateInput.setAttribute('min', today);

        console.log('📋 Task Manager initialized with', tasks.length, 'tasks');
    }

    // Exponer funciones necesarias al scope global para los onclick inline
    window.taskManager = {
        toggleTask,
        deleteTask,
        editTask,
    };

    // Arrancar la aplicación
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();