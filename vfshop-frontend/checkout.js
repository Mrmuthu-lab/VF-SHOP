
const API_URL = "http://localhost:8080/api";

let cart = [];
let currentUser = null;
let appliedCoupon = localStorage.getItem("vfshop_coupon") || "";

document.addEventListener("DOMContentLoaded", async () => {
    currentUser = JSON.parse(
        localStorage.getItem("vfshopUser") || "null"
    );

    if (!currentUser || !currentUser.id) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    fillAddressFromProfile();

    document.getElementById("place-order-btn")
        .addEventListener("click", placeOrder);

    await loadCart();
});

function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
    };
}

function fillAddressFromProfile() {
    const name = (currentUser.name || "").trim().split(" ");

    document.getElementById("first-name").value = name[0] || "";
    document.getElementById("last-name").value =
        name.slice(1).join(" ");

    document.getElementById("email").value =
        currentUser.email || "";
}

async function loadCart() {
    try {
        const response = await fetch(
            `${API_URL}/cart/${currentUser.id}`,
            { headers: getHeaders() }
        );

        if (!response.ok) {
            throw new Error("Unable to load cart");
        }

        const data = await response.json();

        cart = (data.items || []).map(item => ({
            productId: item.productId,
            name: item.productName,
            price: Number(item.price),
            qty: Number(item.quantity),
            img: item.image
        }));

        if (cart.length === 0) {
            localStorage.removeItem("vfshop_coupon");
            appliedCoupon = "";
        }

        renderOrderSummary();

    } catch (error) {
        console.error(error);
        showError(error.message);
    }
}

function calculateDiscount(subtotal) {
    switch (appliedCoupon.toUpperCase()) {
        case "FRESH10":
            return subtotal * 0.10;

        case "VF20":
            return subtotal * 0.20;

        case "SAVE50":
            return Math.min(50, subtotal);

        default:
            return 0;
    }
}

function calculateTotal() {
    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.qty, 0
    );

    const discount = calculateDiscount(subtotal);

    const delivery = cart.length === 0
        ? 0
        : subtotal >= 500 ? 0 : 40;

    return {
        subtotal,
        discount,
        delivery,
        total: subtotal - discount + delivery
    };
}

function renderOrderSummary() {
    const itemsBox = document.getElementById("order-items");
    const button = document.getElementById("place-order-btn");

    if (cart.length === 0) {
        itemsBox.innerHTML = `
            <h3>Your Cart is Empty 🛒</h3>
            <a href="product.html">Continue Shopping</a>
        `;

        button.disabled = true;

    } else {
        itemsBox.innerHTML = cart.map(item => `
            <div class="checkout-item">
                <img src="${item.img || "assets/default.jpg"}"
                     alt="${item.name}" width="60">

                <div>
                    <h4>${item.name}</h4>
                    <p>₹${item.price.toFixed(2)} × ${item.qty}</p>
                </div>

                <strong>
                    ₹${(item.price * item.qty).toFixed(2)}
                </strong>
            </div>
        `).join("");

        button.disabled = false;
    }

    const totals = calculateTotal();

    document.getElementById("subtotal").textContent =
        "₹" + totals.subtotal.toFixed(2);

    const deliveryText = totals.delivery === 0
        ? "FREE"
        : "₹" + totals.delivery.toFixed(2);

    document.getElementById("delivery").textContent = deliveryText;
    document.getElementById("delivery-label").textContent = deliveryText;

    document.getElementById("discount-label").textContent =
        appliedCoupon
            ? `Coupon Discount (${appliedCoupon})`
            : "Coupon Discount";

    document.getElementById("discount-amount").textContent =
        "-₹" + totals.discount.toFixed(2);

    document.getElementById("total-amount").textContent =
        "₹" + totals.total.toFixed(2);
}

function getValue(id) {
    return document.getElementById(id).value.trim();
}

function showError(message) {
    const element = document.getElementById("error-msg");
    element.textContent = message;
    element.style.display = "block";
}

function hideError() {
    document.getElementById("error-msg").style.display = "none";
}

function validateForm() {
    const first = getValue("first-name");
    const last = getValue("last-name");
    const phone = getValue("phone");
    const address = getValue("address");
    const city = getValue("city");
    const pincode = getValue("pincode");

    if (!first || !last || !phone || !address || !city || !pincode) {
        showError("Please fill in all delivery address fields.");
        return false;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
        showError("Enter a valid 10-digit mobile number.");
        return false;
    }

    if (!/^\d{6}$/.test(pincode)) {
        showError("Enter a valid 6-digit pincode.");
        return false;
    }

    return true;
}

async function placeOrder() {
    hideError();

    if (cart.length === 0) {
        showError("Your cart is empty!");
        return;
    }

    if (!validateForm()) return;

    const payment = document.querySelector(
        'input[name="payment"]:checked'
    );

    if (!payment || payment.value !== "COD") {
        showError("Currently only Cash on Delivery is available.");
        return;
    }

    const orderData = {
        userId: currentUser.id,

        customerName: (
            getValue("first-name") + " " +
            getValue("last-name")
        ).trim(),

        phone: getValue("phone"),
        address: getValue("address"),
        city: getValue("city"),
        pincode: getValue("pincode"),

        paymentMethod: "COD",

        couponCode: appliedCoupon
            ? appliedCoupon.toUpperCase()
            : null
    };

    console.log("Order Payload:", orderData);

    const button = document.getElementById("place-order-btn");

    button.disabled = true;
    button.textContent = "Placing Order...";

    try {
        const response = await fetch(`${API_URL}/orders/place`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Order placement failed");
        }

        const result = await response.json();

        console.log("Order Response:", result);

        localStorage.removeItem("vfshop_coupon");

        alert("🎉 Your order has been placed successfully!");

        window.location.href =
            "order-confirmation.html?id=" + result.id;

    } catch (error) {
        console.error("Order Error:", error);

        showError(error.message);

        button.disabled = false;
        button.textContent = "Place Order ✓";
    }
}
