/* ============================================
    ORDENES - GESTIÓN DE PEDIDOS
    ============================================ */

(function () {
    'use strict';

    let orders = [];
    let currentFilter = 'all';
    let currentSort = 'date-desc';
    let searchQuery = '';
    let editingOrderId = null;

    const DOM = {
        orderForm: document.getElementById('orderForm'),
        clientInput: document.getElementById('clientInput'),
        productInput: document.getElementById('productInput'),
        quantityInput: document.getElementById('quantityInput'),
        priceInput: document.getElementById('priceInput'),
        statusSelect: document.getElementById('statusSelect'),
        prioridadSelect: document.getElementById('prioridadSelect'),
        notesInput: document.getElementById('notesInput'),
        orderList: document.getElementById('orderList'),
        emptyState: document.getElementById('emptyState'),
        searchInput: document.getElementById('searchInput'),
        sortSelect: document.getElementById('sortSelect'),
        filterTabs: document.getElementById('filterTabs'),
        addBtn: document.getElementById('addBtn'),
        clearCompletedBtn: document.getElementById('clearCompletedBtn'),
        dateDisplay: document.getElementById('dateDisplay'),

        totalOrders: document.getElementById('totalOrders'),
        pendingOrders: document.getElementById('pendingOrders'),
        completedOrders: document.getElementById('completedOrders'),
        countAll: document.getElementById('countAll'),
        countPending: document.getElementById('countPending'),
        countProcessing: document.getElementById('countProcessing'),
        countCompleted: document.getElementById('countCompleted'),

        editModal: document.getElementById('editModal'),
        editClientInput: document.getElementById('editClientInput'),
        editProductInput: document.getElementById('editProductInput'),
        editQuantityInput: document.getElementById('editQuantityInput'),
        editPriceInput: document.getElementById('editPriceInput'),
        editStatusSelect: document.getElementById('editStatusSelect'),
        editPrioridadSelect: document.getElementById('editPrioridadSelect'),
        editNotesInput: document.getElementById('editNotesInput'),
        modalClose: document.getElementById('modalClose'),
        editCancelBtn: document.getElementById('editCancelBtn'),
        editSaveBtn: document.getElementById('editSaveBtn'),

        notification: document.getElementById('notification'),
    };

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    function formatTime(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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
        void DOM.notification.offsetWidth;
        DOM.notification.classList.add('show');

        setTimeout(() => {
            DOM.notification.classList.remove('show');
        }, 2500);
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };

    const statusLabels = {
        pending: '⏳ Pendiente',
        processing: '🔄 Procesando',
        completed: '✅ Completada',
        cancelled: '❌ Cancelada',
    };

    const priorityLabels = {
        high: '🔴 Alta',
        medium: '🟡 Media',
        low: '🟢 Baja',
    };

    function saveOrders() {
        localStorage.setItem('ordenes_orders', JSON.stringify(orders));
    }

    function loadOrders() {
        const stored = localStorage.getItem('ordenes_orders');
        if (stored) {
            try {
                orders = JSON.parse(stored);
            } catch (e) {
                orders = [];
            }
        }
    }

    function addOrder(client, product, quantity, price, status, priority, notes) {
        const total = quantity * price;
        const order = {
            id: generateId(),
            client: client.trim(),
            product: product.trim(),
            quantity: parseInt(quantity) || 1,
            price: parseFloat(price) || 0,
            total: total,
            status,
            priority,
            notes: notes.trim(),
            createdAt: new Date().toISOString(),
        };
        orders.unshift(order);
        saveOrders();
        render();
        showNotification('✅ Orden agregada correctamente', 'success');
    }

    function toggleOrder(id) {
        const order = orders.find((o) => o.id === id);
        if (order) {
            const statusFlow = {
                pending: 'processing',
                processing: 'completed',
                completed: 'pending',
                cancelled: 'pending',
            };
            order.status = statusFlow[order.status];
            saveOrders();
            render();
            showNotification(
                statusLabels[order.status],
                'info'
            );
        }
    }

    function deleteOrder(id) {
        const orderEl = document.querySelector(`[data-id="${id}"]`);
        if (orderEl) {
            orderEl.classList.add('removing');
            setTimeout(() => {
                orders = orders.filter((o) => o.id !== id);
                saveOrders();
                render();
                showNotification('🗑️ Orden eliminada', 'error');
            }, 300);
        }
    }

    function editOrder(id) {
        const order = orders.find((o) => o.id === id);
        if (!order) return;

        editingOrderId = id;
        DOM.editClientInput.value = order.client;
        DOM.editProductInput.value = order.product;
        DOM.editQuantityInput.value = order.quantity;
        DOM.editPriceInput.value = order.price;
        DOM.editStatusSelect.value = order.status;
        DOM.editPrioridadSelect.value = order.priority;
        DOM.editNotesInput.value = order.notes;
        DOM.editModal.classList.add('active');
        DOM.editClientInput.focus();
    }

    function saveEditedOrder() {
        const order = orders.find((o) => o.id === editingOrderId);
        if (!order) return;

        const newClient = DOM.editClientInput.value.trim();
        const newProduct = DOM.editProductInput.value.trim();
        
        if (!newClient || !newProduct) {
            showNotification('⚠️ Cliente y producto son requeridos', 'error');
            return;
        }

        const quantity = parseInt(DOM.editQuantityInput.value) || 1;
        const price = parseFloat(DOM.editPriceInput.value) || 0;

        order.client = newClient;
        order.product = newProduct;
        order.quantity = quantity;
        order.price = price;
        order.total = quantity * price;
        order.status = DOM.editStatusSelect.value;
        order.priority = DOM.editPrioridadSelect.value;
        order.notes = DOM.editNotesInput.value.trim();

        saveOrders();
        closeModal();
        render();
        showNotification('✏️ Orden actualizada', 'success');
    }

    function closeModal() {
        DOM.editModal.classList.remove('active');
        editingOrderId = null;
    }

    function clearCompleted() {
        const completedCount = orders.filter((o) => o.status === 'completed' || o.status === 'cancelled').length;
        if (completedCount === 0) {
            showNotification('ℹ️ No hay ordenes completadas para limpiar', 'info');
            return;
        }
        orders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
        saveOrders();
        render();
        showNotification(`🧹 ${completedCount} orden(es) eliminada(s)`, 'success');
    }

    function getFilteredOrders() {
        let filtered = [...orders];

        if (currentFilter === 'pending') {
            filtered = filtered.filter((o) => o.status === 'pending');
        } else if (currentFilter === 'processing') {
            filtered = filtered.filter((o) => o.status === 'processing');
        } else if (currentFilter === 'completed') {
            filtered = filtered.filter((o) => o.status === 'completed' || o.status === 'cancelled');
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (o) =>
                    o.client.toLowerCase().includes(query) ||
                    o.product.toLowerCase().includes(query) ||
                    o.status.toLowerCase().includes(query) ||
                    o.priority.toLowerCase().includes(query)
            );
        }

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
            case 'client':
                filtered.sort((a, b) => a.client.localeCompare(b.client, 'es'));
                break;
            case 'total':
                filtered.sort((a, b) => b.total - a.total);
                break;
        }

        return filtered;
    }

    function render() {
        renderStats();
        renderOrders();
    }

    function renderStats() {
        const total = orders.length;
        const pending = orders.filter((o) => o.status === 'pending').length;
        const processing = orders.filter((o) => o.status === 'processing').length;
        const completed = orders.filter((o) => o.status === 'completed' || o.status === 'cancelled').length;

        DOM.totalOrders.textContent = total;
        DOM.pendingOrders.textContent = pending;
        DOM.completedOrders.textContent = completed;

        DOM.countAll.textContent = total;
        DOM.countPending.textContent = pending;
        DOM.countProcessing.textContent = processing;
        DOM.countCompleted.textContent = completed;
    }

    function renderOrders() {
        const filtered = getFilteredOrders();

        if (filtered.length === 0) {
            DOM.orderList.innerHTML = '';
            DOM.emptyState.style.display = 'block';

            if (orders.length > 0 && searchQuery) {
                DOM.emptyState.querySelector('h3').textContent = 'Sin resultados';
                DOM.emptyState.querySelector('p').textContent =
                    'No se encontraron ordenes con "' + searchQuery + '"';
            } else if (orders.length > 0 && currentFilter !== 'all') {
                DOM.emptyState.querySelector('h3').textContent = 'No hay ordenes';
                DOM.emptyState.querySelector('p').textContent = 'Prueba con otro filtro';
            } else {
                DOM.emptyState.querySelector('h3').textContent = 'No hay ordenes aún';
                DOM.emptyState.querySelector('p').textContent =
                    'Agrega tu primera orden para comenzar';
            }
        } else {
            DOM.emptyState.style.display = 'none';
            DOM.orderList.innerHTML = filtered.map(createOrderHTML).join('');
        }
    }

    function createOrderHTML(order) {
        const statusClass = order.status;
        const totalFormatted = order.total.toFixed(2);

        return `
            <li class="task-item ${statusClass}" data-id="${order.id}">
                <div class="task-checkbox">
                    <input 
                        type="checkbox" 
                        ${order.status === 'completed' ? 'checked' : ''} 
                        onchange="window.ordenManager.toggleOrder('${order.id}')"
                        aria-label="Cambiar estado"
                    >
                    <span class="checkmark"></span>
                </div>

                <div class="task-info">
                    <div class="task-name">
                        <strong>${escapeHTML(order.client)}</strong>
                        <span style="font-weight: 400; color: var(--text-secondary);"> - ${escapeHTML(order.product)}</span>
                    </div>
                    <div class="task-meta">
                        <span class="task-priority ${order.priority}">
                            ${priorityLabels[order.priority]}
                        </span>
                        <span class="task-category">
                            ${statusLabels[order.status]}
                        </span>
                        <span class="task-category">
                            Cant: ${order.quantity} × $${order.price.toFixed(2)}
                        </span>
                        <span class="task-date">
                            📅 Total: $${totalFormatted}
                        </span>
                    </div>
                    ${order.notes ? `<div class="task-notes">📝 ${escapeHTML(order.notes)}</div>` : ''}
                </div>

                <div class="task-actions">
                    <button 
                        class="task-action-btn edit" 
                        onclick="window.ordenManager.editOrder('${order.id}')" 
                        title="Editar"
                    >
                        ✏️
                    </button>
                    <button 
                        class="task-action-btn delete" 
                        onclick="window.ordenManager.deleteOrder('${order.id}')" 
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

    function initEventListeners() {
        DOM.orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const client = DOM.clientInput.value.trim();
            const product = DOM.productInput.value.trim();
            
            if (!client || !product) {
                showNotification('⚠️Cliente y producto son requeridos', 'error');
                if (!client) DOM.clientInput.focus();
                else DOM.productInput.focus();
                return;
            }

            addOrder(
                client,
                product,
                DOM.quantityInput.value,
                DOM.priceInput.value,
                DOM.statusSelect.value,
                DOM.prioridadSelect.value,
                DOM.notesInput.value
            );

            DOM.clientInput.value = '';
            DOM.productInput.value = '';
            DOM.quantityInput.value = '1';
            DOM.priceInput.value = '0.00';
            DOM.notesInput.value = '';
            DOM.clientInput.focus();
        });

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

        DOM.sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            render();
        });

        DOM.searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            render();
        });

        DOM.clearCompletedBtn.addEventListener('click', clearCompleted);

        DOM.modalClose.addEventListener('click', closeModal);
        DOM.editCancelBtn.addEventListener('click', closeModal);
        DOM.editSaveBtn.addEventListener('click', saveEditedOrder);

        DOM.editModal.addEventListener('click', (e) => {
            if (e.target === DOM.editModal) closeModal();
        });

        DOM.editClientInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveEditedOrder();
            if (e.key === 'Escape') closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && DOM.editModal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    function init() {
        loadOrders();
        displayCurrentDate();
        initEventListeners();
        render();

        console.log('📦 Ordenes initialized with', orders.length, 'orders');
    }

    window.ordenManager = {
        toggleOrder,
        deleteOrder,
        editOrder,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();