
const MY_ORDERS_API_URL = "http://localhost:8080/api";

let currentUser = null;
let myOrders = [];

document.addEventListener("DOMContentLoaded", () => {
    loadMyOrders();
});

async function loadMyOrders() {

    currentUser = JSON.parse(
        localStorage.getItem("vfshopUser") || "null"
    );

    const container = document.getElementById("orders-container");

    if (!currentUser || !currentUser.id) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    container.innerHTML = '<p class="loading">Loading your orders...</p>';

    try {
        const response = await fetch(
            `${MY_ORDERS_API_URL}/orders/${currentUser.id}`
        );

        if (!response.ok) {
            throw new Error("Unable to load orders");
        }

        myOrders = await response.json();

        if (!Array.isArray(myOrders) || myOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-orders">
                    <h2>🛒 No Orders Found</h2>
                    <p>You haven't placed any orders yet.</p>
                    <a href="product.html" class="shop-btn">
                        Start Shopping
                    </a>
                </div>
            `;
            return;
        }

        displayOrders();

    } catch (error) {
        console.error("Orders Error:", error);

        container.innerHTML = `
            <div class="error-message">
                <h2>Unable to Load Orders</h2>
                <p>${escapeHTML(error.message)}</p>
                <button class="shop-btn" onclick="loadMyOrders()">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Safe HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Display Orders
function displayOrders() {

    const container = document.getElementById("orders-container");

    container.innerHTML = myOrders.map(order => {

        const items = Array.isArray(order.items) ? order.items : [];

        const orderDate = order.orderDate
            ? new Date(order.orderDate).toLocaleString("en-IN")
            : "Date unavailable";

        const status = String(order.orderStatus || "PLACED").toUpperCase();

        const productsHTML = items.map(item => {

            return `
                <div class="order-product">

                    <img
                        src="${escapeHTML(item.image || "assets/no-image.png")}"
                        alt="${escapeHTML(item.productName)}"
                        onerror="this.style.display='none'"
                    >

                    <div class="product-info">
                        <h3>${escapeHTML(item.productName)}</h3>
                        <p>Quantity: ${Number(item.quantity) || 0}</p>
                        <p class="product-price">
                            ₹${Number(item.price || 0).toFixed(2)}
                        </p>
                    </div>

                </div>
            `;

        }).join("");

        const cancelButton = status === "PLACED"
            ? `
                <button class="cancel-order-btn"
                    onclick="cancelOrder(${Number(order.id)})">
                    Cancel Order
                </button>
            `
            : "";

        return `
            <div class="order-card">

                <div class="order-header">
                    <div>
                        <h2>Order #${escapeHTML(order.id)}</h2>
                        <p class="order-date">${escapeHTML(orderDate)}</p>
                    </div>

                    <span class="status ${status.toLowerCase()}">
                        ${escapeHTML(status)}
                    </span>
                </div>

                ${renderTracking(status)}

                <div class="order-products">
                    ${productsHTML || "<p>No product details available.</p>"}
                </div>

                <div class="order-footer">
                    <p class="payment-method">
                        Payment: ${escapeHTML(order.paymentMethod || "N/A")}
                    </p>

                    <div class="order-total">
                        Total: ₹${Number(order.totalAmount || 0).toFixed(2)}
                    </div>
                </div>

                <div class="order-actions">
                    ${cancelButton}
                </div>

            </div>
        `;

    }).join("");
}

// Tracking Timeline
function renderTracking(status) {

    const steps = [
        "PLACED",
        "CONFIRMED",
        "SHIPPED",
        "OUT FOR DELIVERY",
        "DELIVERED"
    ];

    if (status === "CANCELLED") {
        return `
            <div class="tracking cancelled-tracking">
                <div class="tracking-step cancelled-step">
                    <span>✖</span>
                    <p>Order Cancelled</p>
                </div>
            </div>
        `;
    }

    const activeIndex = steps.indexOf(status);

    return `
        <div class="tracking">
            ${steps.map((step, index) => `
                <div class="tracking-step ${
                    index <= activeIndex ? "completed" : ""
                }">
                    <span>${index <= activeIndex ? "✓" : index + 1}</span>
                    <p>${escapeHTML(step)}</p>
                </div>
            `).join("")}
        </div>
    `;
}

// Cancel Order
async function cancelOrder(orderId) {

    const order = myOrders.find(item => Number(item.id) === orderId);

    if (!order) {
        alert("Order not found!");
        return;
    }

    if (order.orderStatus !== "PLACED") {
        alert("This order cannot be cancelled!");
        return;
    }

    const confirmCancel = confirm(
        `Are you sure you want to cancel Order #${orderId}?`
    );

    if (!confirmCancel) return;

    try {

        const response = await fetch(
            `${MY_ORDERS_API_URL}/orders/cancel/${orderId}/${currentUser.id}`,
            {
                method: "PUT"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || result.detail || "Order cancellation failed"
            );
        }

        // Update without page refresh
        order.orderStatus = result.orderStatus;

        displayOrders();

        alert("Order cancelled successfully! ❌");

    } catch (error) {

        console.error("Cancel Error:", error);
        alert(error.message);
    }
}
