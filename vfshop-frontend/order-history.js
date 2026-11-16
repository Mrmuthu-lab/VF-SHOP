
// =====================================
// VF SHOP - ORDER HISTORY
// =====================================

const API_URL = "http://localhost:8080/api";

let currentUser = null;
let token = null;
let orders = [];

// =====================================
// PAGE LOAD
// =====================================

document.addEventListener("DOMContentLoaded", async () => {

    currentUser = JSON.parse(
        localStorage.getItem("vfshopUser") || "null"
    );

    token = localStorage.getItem("token");

    if (!currentUser || !currentUser.id || !token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    await loadOrders();
});

// =====================================
// AUTH HEADERS
// =====================================

function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// =====================================
// HTML ESCAPE
// =====================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// =====================================
// LOAD ORDERS
// =====================================

async function loadOrders() {

    const container = document.getElementById("orders-container");

    try {

        const response = await fetch(
            `${API_URL}/orders/${currentUser.id}`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        if (response.status === 404) {
            orders = [];
            renderOrders();
            return;
        }

        if (!response.ok) {
            throw new Error("Unable to load order history");
        }

        const data = await response.json();

        orders = Array.isArray(data) ? data : [];

        renderOrders();

    } catch (error) {

        console.error("Order History Error:", error);

        container.innerHTML = `
            <div class="error-message">
                <h3>Unable to load orders</h3>
                <p>${escapeHTML(error.message)}</p>
                <button onclick="loadOrders()">Try Again</button>
            </div>
        `;
    }
}

// =====================================
// RENDER ORDERS
// =====================================

function renderOrders() {

    const container = document.getElementById("orders-container");

    if (orders.length === 0) {

        container.innerHTML = `
            <div class="empty-message">
                <h2>No Orders Found</h2>
                <p>You haven't placed any orders yet.</p>
                <a href="product.html">Start Shopping</a>
            </div>
        `;

        return;
    }

    container.innerHTML = orders.map(order => {

        const items = order.items || [];

        const subtotal = items.reduce(
            (sum, item) =>
                sum + Number(item.price || 0) * Number(item.quantity || 0),
            0
        );

        const discount = Number(order.discountAmount || 0);
        const total = Number(order.totalAmount || 0);

        // Delivery = Total - Subtotal + Discount
        const delivery = Math.max(
            0,
            total - subtotal + discount
        );

        const status = order.orderStatus || order.status || "PLACED";

        const orderDate = order.orderDate
            ? new Date(order.orderDate).toLocaleString("en-IN")
            : "Date not available";

        const productsHTML = items.map(item => `
            <div class="product-row">
                <div>
                    <strong>${escapeHTML(item.productName || "Product")}</strong>
                    <p>Quantity: ${Number(item.quantity || 0)}</p>
                </div>

                <strong>
                    ₹${(
                        Number(item.price || 0) *
                        Number(item.quantity || 0)
                    ).toFixed(2)}
                </strong>
            </div>
        `).join("");

        const cancelButton = status === "PLACED"
            ? `
                <button
                    class="cancel-btn"
                    onclick="cancelOrder(${Number(order.id)})">
                    Cancel Order
                </button>
            `
            : "";

        return `
            <div class="order-card">

                <div class="order-header">
                    <div>
                        <h3>Order #${escapeHTML(order.id)}</h3>
                        <p>${escapeHTML(orderDate)}</p>
                    </div>

                    <span class="status">
                        ${escapeHTML(status.replaceAll("_", " "))}
                    </span>
                </div>

                <div class="order-products">
                    ${productsHTML || "<p>No product details available.</p>"}
                </div>

                <div class="summary">

                    <div class="summary-row">
                        <span>Subtotal</span>
                        <strong>₹${subtotal.toFixed(2)}</strong>
                    </div>

                    <div class="summary-row">
                        <span>Coupon Discount</span>
                        <strong style="color:green;">
                            - ₹${discount.toFixed(2)}
                        </strong>
                    </div>

                    <div class="summary-row">
                        <span>Delivery</span>
                        <strong>
                            ${delivery === 0 ? "FREE" : "₹" + delivery.toFixed(2)}
                        </strong>
                    </div>

                    <div class="summary-row summary-total">
                        <span>Total Amount</span>
                        <strong>₹${total.toFixed(2)}</strong>
                    </div>

                </div>

                ${cancelButton}

            </div>
        `;

    }).join("");
}

// =====================================
// CANCEL ORDER
// =====================================

async function cancelOrder(orderId) {

    const confirmCancel = confirm(
        "Are you sure you want to cancel this order?"
    );

    if (!confirmCancel) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/orders/cancel/${orderId}/${currentUser.id}`,
            {
                method: "PUT",
                headers: getHeaders()
            }
        );

        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                errorText || "Unable to cancel order"
            );
        }

        alert("Order cancelled successfully!");

        await loadOrders();

    } catch (error) {

        console.error("Cancel Order Error:", error);

        alert(error.message);
    }
}

