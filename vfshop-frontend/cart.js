
// =====================================
// VF SHOP - CART MANAGEMENT
// =====================================

const API_URL = "https://vfshop-backend.onrender.com/api";

let cart = [];
let currentUser = null;
let token = null;

let appliedCoupon = null;
let discountAmount = 0;

// =====================================
// PAGE LOAD
// =====================================

document.addEventListener("DOMContentLoaded", async () => {

    currentUser = JSON.parse(
        localStorage.getItem("vfshopUser") || "null"
    );

    token = localStorage.getItem("token");

    if (!currentUser || !currentUser.id || !token) {
        alert("Session expired! Please login again.");
        window.location.href = "login.html";
        return;
    }

    appliedCoupon = localStorage.getItem("vfshop_coupon");

    const checkoutButton = document.getElementById("checkout-btn");

    if (checkoutButton) {
        checkoutButton.addEventListener("click", goToCheckout);
    }

    await loadCart();
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
// LOAD CART
// =====================================

async function loadCart() {

    try {

        const response = await fetch(
            `${API_URL}/cart/${currentUser.id}`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );

        if (response.status === 404) {
            cart = [];
            localStorage.removeItem("vfshop_coupon");
            appliedCoupon = null;
            renderCart();
            return;
        }

        if (!response.ok) {
            throw new Error("Unable to load cart");
        }

        const data = await response.json();

        cart = (data.items || []).map(item => ({
            id: item.id,
            productId: item.productId,
            name: item.productName,
            price: Number(item.price),
            qty: Number(item.quantity),
            img: item.image
        }));

        renderCart();

    } catch (error) {

        console.error("Cart Error:", error);

        const container = document.querySelector(".cart-items");

        if (container) {
            container.innerHTML =
                "<p>Unable to load cart. Please refresh the page.</p>";
        }
    }
}

// =====================================
// RENDER CART
// =====================================

function renderCart() {

    const container = document.querySelector(".cart-items");

    if (!container) {
        console.error("Cart container .cart-items not found");
        return;
    }

    if (cart.length === 0) {

        appliedCoupon = null;
        discountAmount = 0;
        localStorage.removeItem("vfshop_coupon");

        container.innerHTML = `
            <h2>Cart Items</h2>

            <div class="empty-cart">
                <h3>🛒 Your Cart is Empty</h3>
                <p>Add fresh products to continue shopping.</p>
                <a href="product.html">Continue Shopping</a>
            </div>
        `;

    } else {

        container.innerHTML = `
            <h2>Cart Items (${cart.length})</h2>

            ${cart.map(item => `
                <div class="cart-item">

                    <img
                        src="${item.img || 'assets/freshveg.jpg'}"
                        alt="${item.name}"
                        onerror="this.src='assets/freshveg.jpg'">

                    <div class="cart-item-info">

                        <h3>${item.name}</h3>

                        <p>₹${item.price.toFixed(2)} / item</p>

                        <div class="quantity-controls">

                            <button onclick="updateQuantity(${item.id}, ${item.qty - 1})">−</button>

                            <span>${item.qty}</span>

                            <button onclick="updateQuantity(${item.id}, ${item.qty + 1})">+</button>

                        </div>

                        <button
                            class="remove-btn"
                            onclick="removeItem(${item.id})">
                            Remove
                        </button>

                    </div>

                    <div class="cart-item-price">
                        ₹${(item.price * item.qty).toFixed(2)}
                    </div>

                </div>
            `).join("")}
        `;
    }

    updateSummary();
}

// =====================================
// APPLY COUPON
// =====================================

function applyCoupon() {

    const input = document.getElementById("couponCode");
    const message = document.getElementById("coupon-message");

    if (!input || !message) {
        alert("Coupon section not found!");
        return;
    }

    const code = input.value.trim().toUpperCase();

    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
    );

    if (cart.length === 0) {
        message.textContent = "Your cart is empty!";
        message.style.color = "red";
        return;
    }

    if (!code) {
        message.textContent = "Please enter a coupon code!";
        message.style.color = "red";
        return;
    }

    if (code === "FRESH10") {
        discountAmount = subtotal * 0.10;
    }
    else if (code === "VF20") {
        discountAmount = subtotal * 0.20;
    }
    else if (code === "SAVE50") {
        discountAmount = Math.min(50, subtotal);
    }
    else {

        appliedCoupon = null;
        discountAmount = 0;

        localStorage.removeItem("vfshop_coupon");

        message.textContent = "Invalid coupon code!";
        message.style.color = "red";

        updateSummary();
        return;
    }

    appliedCoupon = code;
    localStorage.setItem("vfshop_coupon", code);

    message.textContent = `${code} applied successfully!`;
    message.style.color = "green";

    updateSummary();
}

// =====================================
// REMOVE COUPON
// =====================================

function removeCoupon() {

    appliedCoupon = null;
    discountAmount = 0;

    localStorage.removeItem("vfshop_coupon");

    const input = document.getElementById("couponCode");
    const message = document.getElementById("coupon-message");

    if (input) input.value = "";

    if (message) {
        message.textContent = "Coupon removed.";
        message.style.color = "red";
    }

    updateSummary();
}

// =====================================
// UPDATE ORDER SUMMARY
// =====================================

function updateSummary() {

    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
    );

    const delivery = cart.length === 0
        ? 0
        : subtotal >= 500 ? 0 : 40;

    if (cart.length === 0) {
        discountAmount = 0;
        appliedCoupon = null;
        localStorage.removeItem("vfshop_coupon");
    }

    if (appliedCoupon === "FRESH10") {
        discountAmount = subtotal * 0.10;
    }
    else if (appliedCoupon === "VF20") {
        discountAmount = subtotal * 0.20;
    }
    else if (appliedCoupon === "SAVE50") {
        discountAmount = Math.min(50, subtotal);
    }
    else {
        discountAmount = 0;
    }

    const total = Math.max(0, subtotal + delivery - discountAmount);

    const subtotalElement = document.querySelector(".summary-subtotal");
    const deliveryElement = document.querySelector(".summary-delivery");
    const discountElement = document.querySelector(".summary-discount");
    const totalElement = document.querySelector(".summary-total-amount");
    const checkoutButton = document.getElementById("checkout-btn");

    if (subtotalElement) {
        subtotalElement.textContent = "₹" + subtotal.toFixed(2);
    }

    if (deliveryElement) {
        deliveryElement.textContent =
            delivery === 0 && cart.length > 0
                ? "FREE"
                : "₹" + delivery.toFixed(2);
    }

    if (discountElement) {
        discountElement.textContent =
            "- ₹" + discountAmount.toFixed(2);
    }

    if (totalElement) {
        totalElement.textContent = "₹" + total.toFixed(2);
    }

    if (checkoutButton) {
        checkoutButton.disabled = cart.length === 0;
    }
}

// =====================================
// UPDATE QUANTITY
// =====================================

async function updateQuantity(itemId, quantity) {

    if (quantity < 1) {
        await removeItem(itemId);
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/cart/update/${itemId}?quantity=${quantity}`,
            {
                method: "PUT",
                headers: getHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Quantity update failed");
        }

        await loadCart();

    } catch (error) {

        alert(error.message);
    }
}

// =====================================
// REMOVE CART ITEM
// =====================================

async function removeItem(itemId) {

    try {

        const response = await fetch(
            `${API_URL}/cart/remove/${itemId}`,
            {
                method: "DELETE",
                headers: getHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Unable to remove product");
        }

        await loadCart();

    } catch (error) {

        alert(error.message);
    }
}

// =====================================
// GO TO CHECKOUT
// =====================================

function goToCheckout() {

    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    window.location.href = "checkout.html";
}
