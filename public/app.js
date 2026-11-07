/**
 * Online Pharmacy Management System
 * Frontend Application Script - app.js
 * Technology: Vanilla JavaScript, Fetch API
 */

// ========================================================
// State Management
// ========================================================
const state = {
    medicines: [],
    users: [],
    categories: [],
    cart: [], // [{ medicine_id, medicine_name, price, stock, quantity, subtotal }]
    currentEditingMedId: null
};

// ========================================================
// DOM Element References
// ========================================================
const elements = {
    // Nav & Tabs
    navLinks: document.querySelectorAll('.nav-link'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Toast Container
    toastContainer: document.getElementById('toast-container'),

    // Dashboard Stats
    statTotalMedicines: document.getElementById('stat-total-medicines'),
    statLowStock: document.getElementById('stat-low-stock'),
    statTotalOrders: document.getElementById('stat-total-orders'),
    statTotalRevenue: document.getElementById('stat-total-revenue'),
    statTotalCustomers: document.getElementById('stat-total-customers'),
    statExpiringSoon: document.getElementById('stat-expiring-soon'),
    dashboardRecentOrdersTbody: document.getElementById('dashboard-recent-orders-tbody'),

    // Quick Action Buttons
    btnQuickOrder: document.getElementById('btn-quick-order'),
    btnQuickAddMed: document.getElementById('btn-quick-add-med'),
    btnQuickAddUser: document.getElementById('btn-quick-add-user'),
    btnViewAllOrders: document.getElementById('btn-view-all-orders'),

    // Medicines Section
    medSearchInput: document.getElementById('med-search-input'),
    medCategoryFilter: document.getElementById('med-category-filter'),
    medLowStockCheck: document.getElementById('med-low-stock-check'),
    btnResetMedFilters: document.getElementById('btn-reset-med-filters'),
    medicinesTableTbody: document.getElementById('medicines-table-tbody'),
    btnOpenAddMedModal: document.getElementById('btn-open-add-med-modal'),

    // Place Order Section
    orderCustomerSelect: document.getElementById('order-customer-select'),
    orderDateInput: document.getElementById('order-date-input'),
    orderMedicineSelect: document.getElementById('order-medicine-select'),
    orderQuantityInput: document.getElementById('order-quantity-input'),
    btnAddItemToCart: document.getElementById('btn-add-item-to-cart'),
    medicineInfoPreview: document.getElementById('medicine-info-preview'),
    orderCartTbody: document.getElementById('order-cart-tbody'),
    cartTotalItems: document.getElementById('cart-total-items'),
    cartGrandTotal: document.getElementById('cart-grand-total'),
    btnClearCart: document.getElementById('btn-clear-cart'),
    btnSubmitOrder: document.getElementById('btn-submit-order'),

    // Orders Section
    ordersTableTbody: document.getElementById('orders-table-tbody'),
    btnGoToNewOrder: document.getElementById('btn-go-to-new-order'),

    // Users Section
    formRegisterUser: document.getElementById('form-register-user'),
    usersTableTbody: document.getElementById('users-table-tbody'),

    // Medicine Modal
    modalMedicine: document.getElementById('modal-medicine'),
    modalMedicineTitle: document.getElementById('modal-medicine-title'),
    modalMedicineClose: document.getElementById('modal-medicine-close'),
    btnCancelMedicineModal: document.getElementById('btn-cancel-medicine-modal'),
    formMedicine: document.getElementById('form-medicine'),
    modalMedId: document.getElementById('modal-med-id'),
    modalMedName: document.getElementById('modal-med-name'),
    modalMedCategory: document.getElementById('modal-med-category'),
    modalMedManufacturer: document.getElementById('modal-med-manufacturer'),
    modalMedPrice: document.getElementById('modal-med-price'),
    modalMedStock: document.getElementById('modal-med-stock'),
    modalMedExpiry: document.getElementById('modal-med-expiry'),

    // Order Details Modal
    modalOrderDetails: document.getElementById('modal-order-details'),
    modalOrderClose: document.getElementById('modal-order-close'),
    modalOrderBody: document.getElementById('modal-order-body'),
    btnCloseOrderModal: document.getElementById('btn-close-order-modal'),

    // Status Modal
    modalStatus: document.getElementById('modal-status'),
    modalStatusClose: document.getElementById('modal-status-close'),
    btnCancelStatusModal: document.getElementById('btn-cancel-status-modal'),
    formUpdateStatus: document.getElementById('form-update-status'),
    modalStatusOrderId: document.getElementById('modal-status-order-id'),
    modalStatusOrderDisplay: document.getElementById('modal-status-order-display'),
    modalStatusSelect: document.getElementById('modal-status-select')
};

// ========================================================
// Utility: Toast Notifications
// ========================================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'danger') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ========================================================
// Tab Switching
// ========================================================
function switchTab(tabId) {
    elements.navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-tab') === tabId);
    });

    elements.tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    // Refresh context data based on tab
    if (tabId === 'dashboard') {
        loadDashboardStats();
        loadRecentOrders();
    } else if (tabId === 'medicines') {
        loadMedicines();
        loadCategories();
    } else if (tabId === 'place-order') {
        loadCustomerSelect();
        loadMedicineSelect();
    } else if (tabId === 'orders') {
        loadOrders();
    } else if (tabId === 'users') {
        loadUsers();
    }
}

// Attach Tab Navigation Event Listeners
elements.navLinks.forEach(link => {
    link.addEventListener('click', () => {
        switchTab(link.getAttribute('data-tab'));
    });
});

// Quick action buttons
elements.btnQuickOrder?.addEventListener('click', () => switchTab('place-order'));
elements.btnQuickAddMed?.addEventListener('click', () => {
    switchTab('medicines');
    openMedicineModal();
});
elements.btnQuickAddUser?.addEventListener('click', () => switchTab('users'));
elements.btnViewAllOrders?.addEventListener('click', () => switchTab('orders'));
elements.btnGoToNewOrder?.addEventListener('click', () => switchTab('place-order'));

// ========================================================
// 1. DASHBOARD OVERVIEW & STATS
// ========================================================
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/stats');
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            elements.statTotalMedicines.textContent = data.total_medicines;
            elements.statLowStock.textContent = data.low_stock;
            elements.statTotalOrders.textContent = data.total_orders;
            elements.statTotalRevenue.innerHTML = `&#8377;${parseFloat(data.total_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
            elements.statTotalCustomers.textContent = data.total_customers;
            elements.statExpiringSoon.textContent = data.expiring_soon;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadRecentOrders() {
    try {
        const response = await fetch('/api/orders');
        const result = await response.json();

        if (!result.success || !result.data) {
            elements.dashboardRecentOrdersTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No orders available.</td></tr>`;
            return;
        }

        const recentOrders = result.data.slice(0, 5);
        if (recentOrders.length === 0) {
            elements.dashboardRecentOrdersTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No orders placed yet.</td></tr>`;
            return;
        }

        elements.dashboardRecentOrdersTbody.innerHTML = recentOrders.map(order => `
            <tr>
                <td><strong>#${order.order_id}</strong></td>
                <td>${escapeHtml(order.customer_name)}</td>
                <td>${formatDate(order.order_date)}</td>
                <td>${order.total_items} items (${order.total_quantity} pcs)</td>
                <td><strong>&#8377;${parseFloat(order.total_amount).toFixed(2)}</strong></td>
                <td>${getStatusBadge(order.status)}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="viewOrderDetails(${order.order_id})">View Invoice</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load recent orders:', error);
    }
}

// ========================================================
// 2. MEDICINES MANAGEMENT
// ========================================================
async function loadCategories() {
    try {
        const response = await fetch('/api/medicines/categories');
        const result = await response.json();

        if (result.success) {
            state.categories = result.data;
            const currentSelected = elements.medCategoryFilter.value;
            elements.medCategoryFilter.innerHTML = '<option value="All">All Categories</option>' +
                result.data.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
            elements.medCategoryFilter.value = currentSelected || 'All';
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function loadMedicines() {
    try {
        const search = elements.medSearchInput.value.trim();
        const category = elements.medCategoryFilter.value;
        const lowStock = elements.medLowStockCheck.checked;

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category && category !== 'All') params.append('category', category);
        if (lowStock) params.append('low_stock', 'true');

        const response = await fetch(`/api/medicines?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
            elements.medicinesTableTbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">Failed to load medicines.</td></tr>`;
            return;
        }

        state.medicines = result.data;

        if (result.data.length === 0) {
            elements.medicinesTableTbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No medicines found matching the filters.</td></tr>`;
            return;
        }

        elements.medicinesTableTbody.innerHTML = result.data.map(med => {
            const stockBadge = med.stock <= 0 
                ? '<span class="badge badge-danger">Out of Stock</span>'
                : med.stock <= 20 
                    ? `<span class="badge badge-warning">Low Stock (${med.stock})</span>`
                    : `<span class="badge badge-success">In Stock (${med.stock})</span>`;

            const isExpired = new Date(med.expiry_date) < new Date();
            const expiryBadge = isExpired 
                ? `<span class="badge badge-danger">${formatDate(med.expiry_date)} (Expired)</span>` 
                : formatDate(med.expiry_date);

            return `
                <tr>
                    <td><strong>#${med.medicine_id}</strong></td>
                    <td><strong>${escapeHtml(med.medicine_name)}</strong></td>
                    <td><span class="badge badge-info">${escapeHtml(med.category)}</span></td>
                    <td>${escapeHtml(med.manufacturer)}</td>
                    <td><strong>&#8377;${parseFloat(med.price).toFixed(2)}</strong></td>
                    <td>${med.stock}</td>
                    <td>${expiryBadge}</td>
                    <td>${stockBadge}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline" onclick="editMedicine(${med.medicine_id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteMedicine(${med.medicine_id}, '${escapeHtml(med.medicine_name)}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load medicines:', error);
        elements.medicinesTableTbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">Error loading medicines data.</td></tr>`;
    }
}

// Filter listeners for medicines
elements.medSearchInput?.addEventListener('input', debounce(() => loadMedicines(), 300));
elements.medCategoryFilter?.addEventListener('change', () => loadMedicines());
elements.medLowStockCheck?.addEventListener('change', () => loadMedicines());
elements.btnResetMedFilters?.addEventListener('click', () => {
    elements.medSearchInput.value = '';
    elements.medCategoryFilter.value = 'All';
    elements.medLowStockCheck.checked = false;
    loadMedicines();
});

// Medicine Modal Open / Close
function openMedicineModal(med = null) {
    if (med) {
        state.currentEditingMedId = med.medicine_id;
        elements.modalMedicineTitle.textContent = `Edit Medicine: ${med.medicine_name}`;
        elements.modalMedId.value = med.medicine_id;
        elements.modalMedName.value = med.medicine_name;
        elements.modalMedCategory.value = med.category;
        elements.modalMedManufacturer.value = med.manufacturer;
        elements.modalMedPrice.value = med.price;
        elements.modalMedStock.value = med.stock;
        elements.modalMedExpiry.value = med.expiry_date ? med.expiry_date.slice(0, 10) : '';
    } else {
        state.currentEditingMedId = null;
        elements.modalMedicineTitle.textContent = 'Add New Medicine';
        elements.formMedicine.reset();
        elements.modalMedId.value = '';
    }
    elements.modalMedicine.classList.add('active');
}

function closeMedicineModal() {
    elements.modalMedicine.classList.remove('active');
    elements.formMedicine.reset();
    state.currentEditingMedId = null;
}

elements.btnOpenAddMedModal?.addEventListener('click', () => openMedicineModal());
elements.modalMedicineClose?.addEventListener('click', closeMedicineModal);
elements.btnCancelMedicineModal?.addEventListener('click', closeMedicineModal);

// Save Medicine (Add / Update)
elements.formMedicine?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        medicine_name: elements.modalMedName.value.trim(),
        category: elements.modalMedCategory.value.trim(),
        manufacturer: elements.modalMedManufacturer.value.trim(),
        price: parseFloat(elements.modalMedPrice.value),
        stock: parseInt(elements.modalMedStock.value),
        expiry_date: elements.modalMedExpiry.value
    };

    const isEdit = !!state.currentEditingMedId;
    const url = isEdit ? `/api/medicines/${state.currentEditingMedId}` : '/api/medicines';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message || 'Medicine saved successfully!', 'success');
            closeMedicineModal();
            loadMedicines();
            loadCategories();
            loadDashboardStats();
        } else {
            showToast(result.message || 'Operation failed.', 'danger');
        }
    } catch (error) {
        console.error('Error saving medicine:', error);
        showToast('Network error while saving medicine.', 'danger');
    }
});

// Edit Medicine Trigger
window.editMedicine = async function (id) {
    try {
        const response = await fetch(`/api/medicines/${id}`);
        const result = await response.json();
        if (result.success) {
            openMedicineModal(result.data);
        } else {
            showToast(result.message || 'Failed to fetch medicine details.', 'danger');
        }
    } catch (error) {
        console.error('Error fetching medicine for edit:', error);
    }
};

// Delete Medicine Trigger
window.deleteMedicine = async function (id, name) {
    if (!confirm(`Are you sure you want to permanently delete "${name}" (ID: ${id})?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            loadMedicines();
            loadCategories();
            loadDashboardStats();
        } else {
            showToast(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error deleting medicine:', error);
        showToast('Failed to delete medicine.', 'danger');
    }
};

// ========================================================
// 3. PLACE ORDER (TRANSACTIONAL CHECKOUT)
// ========================================================
async function loadCustomerSelect() {
    try {
        const response = await fetch('/api/users');
        const result = await response.json();

        if (result.success) {
            state.users = result.data;
            const currentSelected = elements.orderCustomerSelect.value;
            elements.orderCustomerSelect.innerHTML = '<option value="">-- Choose Customer --</option>' +
                result.data.map(u => `<option value="${u.user_id}">${escapeHtml(u.name)} (${u.email}) - ${u.role}</option>`).join('');
            if (currentSelected) elements.orderCustomerSelect.value = currentSelected;
        }
    } catch (error) {
        console.error('Failed to load customer list:', error);
    }
}

async function loadMedicineSelect() {
    try {
        const response = await fetch('/api/medicines');
        const result = await response.json();

        if (result.success) {
            state.medicines = result.data;
            elements.orderMedicineSelect.innerHTML = '<option value="">-- Choose Medicine --</option>' +
                result.data.map(m => {
                    const stockLabel = m.stock <= 0 ? ' [OUT OF STOCK]' : ` [Stock: ${m.stock}]`;
                    const disabledAttr = m.stock <= 0 ? 'disabled' : '';
                    return `<option value="${m.medicine_id}" ${disabledAttr}>${escapeHtml(m.medicine_name)} - &#8377;${parseFloat(m.price).toFixed(2)}${stockLabel}</option>`;
                }).join('');
        }
    } catch (error) {
        console.error('Failed to load medicines for ordering:', error);
    }
}

// Medicine Selection Change Preview
elements.orderMedicineSelect?.addEventListener('change', () => {
    const medId = parseInt(elements.orderMedicineSelect.value);
    const med = state.medicines.find(m => m.medicine_id === medId);

    if (med) {
        elements.medicineInfoPreview.innerHTML = `
            <strong>${escapeHtml(med.medicine_name)}</strong> &bull; Category: ${escapeHtml(med.category)} &bull; Manufacturer: ${escapeHtml(med.manufacturer)}<br>
            <strong>Price: &#8377;${parseFloat(med.price).toFixed(2)}</strong> &bull; 
            <strong>Available Stock: ${med.stock}</strong> &bull; 
            Expiry: ${formatDate(med.expiry_date)}
        `;
        elements.orderQuantityInput.max = med.stock;
        elements.orderQuantityInput.value = 1;
    } else {
        elements.medicineInfoPreview.innerHTML = `<p class="text-muted">Select a medicine above to view available stock and unit price.</p>`;
    }
});

// Add Item to Order Cart
elements.btnAddItemToCart?.addEventListener('click', () => {
    const medId = parseInt(elements.orderMedicineSelect.value);
    const quantity = parseInt(elements.orderQuantityInput.value);

    if (isNaN(medId) || !medId) {
        showToast('Please select a medicine.', 'warning');
        return;
    }

    if (isNaN(quantity) || quantity <= 0) {
        showToast('Please enter a valid quantity of 1 or more.', 'warning');
        return;
    }

    const med = state.medicines.find(m => m.medicine_id === medId);
    if (!med) {
        showToast('Selected medicine not found.', 'danger');
        return;
    }

    // Check against current stock
    const existingIndex = state.cart.findIndex(i => i.medicine_id === medId);
    const existingQty = existingIndex > -1 ? state.cart[existingIndex].quantity : 0;
    const totalDesiredQty = existingQty + quantity;

    if (totalDesiredQty > med.stock) {
        showToast(`Cannot add ${quantity} units. Available stock is only ${med.stock} (Already in cart: ${existingQty}).`, 'danger');
        return;
    }

    if (existingIndex > -1) {
        state.cart[existingIndex].quantity = totalDesiredQty;
        state.cart[existingIndex].subtotal = totalDesiredQty * parseFloat(med.price);
    } else {
        state.cart.push({
            medicine_id: med.medicine_id,
            medicine_name: med.medicine_name,
            price: parseFloat(med.price),
            stock: med.stock,
            quantity: quantity,
            subtotal: quantity * parseFloat(med.price)
        });
    }

    renderCart();
    showToast(`Added ${quantity} &times; ${med.medicine_name} to cart.`, 'success');

    // Reset inputs
    elements.orderMedicineSelect.value = '';
    elements.orderQuantityInput.value = 1;
    elements.medicineInfoPreview.innerHTML = `<p class="text-muted">Select a medicine above to view available stock and unit price.</p>`;
});

// Render Cart Table & Totals
function renderCart() {
    if (state.cart.length === 0) {
        elements.orderCartTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No items in order yet.</td></tr>`;
        elements.cartTotalItems.textContent = '0';
        elements.cartGrandTotal.innerHTML = '&#8377;0.00';
        return;
    }

    let totalQty = 0;
    let grandTotal = 0;

    elements.orderCartTbody.innerHTML = state.cart.map((item, index) => {
        totalQty += item.quantity;
        grandTotal += item.subtotal;

        return `
            <tr>
                <td><strong>${escapeHtml(item.medicine_name)}</strong></td>
                <td>&#8377;${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td><strong>&#8377;${item.subtotal.toFixed(2)}</strong></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">&times;</button>
                </td>
            </tr>
        `;
    }).join('');

    elements.cartTotalItems.textContent = `${totalQty} units (${state.cart.length} distinct item${state.cart.length > 1 ? 's' : ''})`;
    elements.cartGrandTotal.innerHTML = `&#8377;${grandTotal.toFixed(2)}`;
}

window.removeFromCart = function (index) {
    state.cart.splice(index, 1);
    renderCart();
};

elements.btnClearCart?.addEventListener('click', () => {
    state.cart = [];
    renderCart();
    showToast('Cart cleared.', 'info');
});

// Submit Order (Execute Transaction)
elements.btnSubmitOrder?.addEventListener('click', async () => {
    const userId = elements.orderCustomerSelect.value;
    const orderDate = elements.orderDateInput.value;

    if (!userId) {
        showToast('Please select a customer for this order.', 'warning');
        elements.orderCustomerSelect.focus();
        return;
    }

    if (!orderDate) {
        showToast('Please select an order date.', 'warning');
        elements.orderDateInput.focus();
        return;
    }

    if (state.cart.length === 0) {
        showToast('Cart is empty! Add at least one medicine item to place order.', 'warning');
        return;
    }

    const payload = {
        user_id: parseInt(userId),
        order_date: orderDate,
        items: state.cart.map(i => ({ medicine_id: i.medicine_id, quantity: i.quantity }))
    };

    try {
        elements.btnSubmitOrder.disabled = true;
        elements.btnSubmitOrder.textContent = 'Processing Order...';

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            showToast(`Order #${result.data.order_id} placed successfully! Total: &#8377;${result.data.total_amount}`, 'success');
            state.cart = [];
            renderCart();
            loadMedicineSelect();
            loadDashboardStats();
            switchTab('orders');
        } else {
            showToast(result.message || 'Failed to place order.', 'danger');
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        showToast('Network error while placing order.', 'danger');
    } finally {
        elements.btnSubmitOrder.disabled = false;
        elements.btnSubmitOrder.textContent = 'Confirm & Place Order';
    }
});

// Set default order date to today
if (elements.orderDateInput) {
    elements.orderDateInput.value = new Date().toISOString().slice(0, 10);
}

// ========================================================
// 4. ORDERS & INVOICES MANAGEMENT (SQL JOINS)
// ========================================================
async function loadOrders() {
    try {
        const response = await fetch('/api/orders');
        const result = await response.json();

        if (!result.success) {
            elements.ordersTableTbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Failed to load orders.</td></tr>`;
            return;
        }

        if (result.data.length === 0) {
            elements.ordersTableTbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No orders recorded yet.</td></tr>`;
            return;
        }

        elements.ordersTableTbody.innerHTML = result.data.map(order => `
            <tr>
                <td><strong>#${order.order_id}</strong></td>
                <td>
                    <strong>${escapeHtml(order.customer_name)}</strong><br>
                    <small class="text-muted">${escapeHtml(order.customer_email)}</small>
                </td>
                <td>${escapeHtml(order.customer_phone)}</td>
                <td>${formatDate(order.order_date)}</td>
                <td>${order.total_items} items (${order.total_quantity} pcs)</td>
                <td><strong>&#8377;${parseFloat(order.total_amount).toFixed(2)}</strong></td>
                <td>${getStatusBadge(order.status)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-primary" onclick="viewOrderDetails(${order.order_id})">Invoice</button>
                        <button class="btn btn-sm btn-outline" onclick="openStatusModal(${order.order_id}, '${order.status}')">Status</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteOrder(${order.order_id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load orders:', error);
        elements.ordersTableTbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Error loading orders.</td></tr>`;
    }
}

// View Detailed Order Invoice (JOIN orders, users, order_items, medicines)
window.viewOrderDetails = async function (orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        const result = await response.json();

        if (!result.success) {
            showToast(result.message || 'Failed to fetch order details.', 'danger');
            return;
        }

        const { order, items } = result.data;

        elements.modalOrderBody.innerHTML = `
            <div class="invoice-box">
                <div class="invoice-meta">
                    <div>
                        <p><strong>Order Number:</strong> #${order.order_id}</p>
                        <p><strong>Order Date:</strong> ${formatDate(order.order_date)}</p>
                        <p><strong>Status:</strong> ${getStatusBadge(order.status)}</p>
                    </div>
                    <div>
                        <p><strong>Customer Name:</strong> ${escapeHtml(order.customer_name)}</p>
                        <p><strong>Email:</strong> ${escapeHtml(order.customer_email)}</p>
                        <p><strong>Phone:</strong> ${escapeHtml(order.customer_phone)}</p>
                    </div>
                </div>

                <h4 style="margin-bottom: 0.75rem;">Itemized Medicines Breakdown (SQL JOIN Result)</h4>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Item #</th>
                                <th>Medicine Name</th>
                                <th>Category</th>
                                <th>Manufacturer</th>
                                <th>Unit Price</th>
                                <th>Qty</th>
                                <th>Subtotal (&#8377;)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((item, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td><strong>${escapeHtml(item.medicine_name)}</strong></td>
                                    <td>${escapeHtml(item.category)}</td>
                                    <td>${escapeHtml(item.manufacturer)}</td>
                                    <td>&#8377;${parseFloat(item.unit_price).toFixed(2)}</td>
                                    <td>${item.quantity}</td>
                                    <td><strong>&#8377;${parseFloat(item.subtotal).toFixed(2)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="6" style="text-align: right; font-size: 1rem;">Total Invoice Amount:</th>
                                <th style="font-size: 1.1rem; color: var(--primary);">&#8377;${parseFloat(order.total_amount).toFixed(2)}</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

        elements.modalOrderDetails.classList.add('active');
    } catch (error) {
        console.error('Error fetching order details:', error);
        showToast('Failed to retrieve order details.', 'danger');
    }
};

function closeOrderModal() {
    elements.modalOrderDetails.classList.remove('active');
}

elements.modalOrderClose?.addEventListener('click', closeOrderModal);
elements.btnCloseOrderModal?.addEventListener('click', closeOrderModal);

// Update Status Modal
window.openStatusModal = function (orderId, currentStatus) {
    elements.modalStatusOrderId.value = orderId;
    elements.modalStatusOrderDisplay.textContent = `#${orderId}`;
    elements.modalStatusSelect.value = currentStatus;
    elements.modalStatus.classList.add('active');
};

function closeStatusModal() {
    elements.modalStatus.classList.remove('active');
}

elements.modalStatusClose?.addEventListener('click', closeStatusModal);
elements.btnCancelStatusModal?.addEventListener('click', closeStatusModal);

elements.formUpdateStatus?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = elements.modalStatusOrderId.value;
    const newStatus = elements.modalStatusSelect.value;

    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            closeStatusModal();
            loadOrders();
            loadDashboardStats();
            loadMedicines(); // Refresh stock in case of cancellation
        } else {
            showToast(result.message || 'Status update failed.', 'danger');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Failed to update status.', 'danger');
    }
});

// Delete Order
window.deleteOrder = async function (orderId) {
    if (!confirm(`Are you sure you want to delete Order #${orderId}? This will remove its associated order items.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            loadOrders();
            loadDashboardStats();
        } else {
            showToast(result.message, 'danger');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        showToast('Failed to delete order.', 'danger');
    }
};

// ========================================================
// 5. USERS & CUSTOMERS MANAGEMENT
// ========================================================
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const result = await response.json();

        if (!result.success) {
            elements.usersTableTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Failed to load users.</td></tr>`;
            return;
        }

        state.users = result.data;

        if (result.data.length === 0) {
            elements.usersTableTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No users found.</td></tr>`;
            return;
        }

        elements.usersTableTbody.innerHTML = result.data.map(user => `
            <tr>
                <td><strong>#${user.user_id}</strong></td>
                <td><strong>${escapeHtml(user.name)}</strong></td>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.phone)}</td>
                <td>
                    <span class="badge ${user.role === 'admin' ? 'badge-primary' : 'badge-gray'}">
                        ${escapeHtml(user.role)}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load users:', error);
        elements.usersTableTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Error loading users.</td></tr>`;
    }
}

// Register User Form Submit
elements.formRegisterUser?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        name: document.getElementById('user-name').value.trim(),
        email: document.getElementById('user-email').value.trim(),
        password: document.getElementById('user-password').value,
        phone: document.getElementById('user-phone').value.trim(),
        role: document.getElementById('user-role').value
    };

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            elements.formRegisterUser.reset();
            loadUsers();
            loadDashboardStats();
            loadCustomerSelect();
        } else {
            showToast(result.message || 'Registration failed.', 'danger');
        }
    } catch (error) {
        console.error('Error registering user:', error);
        showToast('Network error while registering user.', 'danger');
    }
});

// ========================================================
// Helper Utilities
// ========================================================
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getStatusBadge(status) {
    switch (status) {
        case 'Completed':
            return '<span class="badge badge-success">Completed</span>';
        case 'Processing':
            return '<span class="badge badge-info">Processing</span>';
        case 'Pending':
            return '<span class="badge badge-warning">Pending</span>';
        case 'Cancelled':
            return '<span class="badge badge-danger">Cancelled</span>';
        default:
            return `<span class="badge badge-gray">${escapeHtml(status)}</span>`;
    }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Close modals when clicking outside modal-content
window.addEventListener('click', (e) => {
    if (e.target === elements.modalMedicine) closeMedicineModal();
    if (e.target === elements.modalOrderDetails) closeOrderModal();
    if (e.target === elements.modalStatus) closeStatusModal();
});

// ========================================================
// Initial Application Load
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadRecentOrders();
    loadMedicines();
    loadCategories();
    loadCustomerSelect();
    loadMedicineSelect();
    loadUsers();
});

