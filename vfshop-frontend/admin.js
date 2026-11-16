
const ADMIN_API_URL = "http://localhost:8080/api";

let allOrders = [];
let allCustomers = [];

// =====================================
// COMMON AUTH HEADERS
// =====================================

function getAdminHeaders() {

    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Login token not found. Please login again.");
    }

    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}

// =====================================
// PAGE LOAD
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    loadAdminOrders();
    loadCustomerCount();

    document.getElementById("refresh-btn")
        ?.addEventListener("click", () => {
            loadAdminOrders();
            loadCustomerCount();
        });

    document.getElementById("search-order")
        ?.addEventListener("input", filterOrders);

    document.getElementById("orders-table-body")
        ?.addEventListener("change", handleStatusChange);

    document.getElementById("orders-table-body")
        ?.addEventListener("click", handleBillClick);

    document.getElementById("download-orders-btn")
        ?.addEventListener("click", downloadOrders);

    document.getElementById("download-users-btn")
        ?.addEventListener("click", downloadUsers);

});

// =====================================
// CUSTOMER COUNT
// =====================================

async function loadCustomerCount() {

    const customerElement =
        document.getElementById("stat-customers");

    try {

        const response = await fetch(
            `${ADMIN_API_URL}/auth/count`,
            {
                method: "GET",
                headers: getAdminHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(
                `Customer count failed: ${response.status}`
            );
        }

        const data = await response.json();

        if (customerElement) {
            customerElement.textContent =
                data.customerCount ?? 0;
        }

    } catch (error) {

        console.error("Customer Count Error:", error);

        if (customerElement) {
            customerElement.textContent = "0";
        }
    }
}

// =====================================
// LOAD ALL ORDERS
// =====================================

async function loadAdminOrders() {

    const tbody =
        document.getElementById("orders-table-body");

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="loading">
                Loading orders...
            </td>
        </tr>
    `;

    showMessage("", "");

    try {

        const response = await fetch(
            `${ADMIN_API_URL}/orders/all`,
            {
                method: "GET",
                headers: getAdminHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to load orders: ${response.status}`
            );
        }

        allOrders = await response.json();

        updateStatistics();
        displayOrders(allOrders);

    } catch (error) {

        console.error("Orders Error:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="loading">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

        showMessage(error.message, "error");
    }
}

// =====================================
// ORDER STATISTICS
// =====================================

function updateStatistics() {

    const total = allOrders.length;

    const pending = allOrders.filter(order =>
        ["PLACED", "CONFIRMED"].includes(
            String(order.orderStatus).toUpperCase()
        )
    ).length;

    const shipped = allOrders.filter(order =>
        String(order.orderStatus).toUpperCase() === "SHIPPED"
    ).length;

    const delivered = allOrders.filter(order =>
        String(order.orderStatus).toUpperCase() === "DELIVERED"
    ).length;

    const cancelled = allOrders.filter(order =>
        String(order.orderStatus).toUpperCase() === "CANCELLED"
    ).length;

    const setText = (id, value) => {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    };

    setText("total-orders", total);
    setText("pending-orders", pending);
    setText("shipped-orders", shipped);
    setText("delivered-orders", delivered);
    setText("cancelled-orders", cancelled);

    const sales = allOrders
        .filter(order =>
            String(order.orderStatus).toUpperCase() !== "CANCELLED"
        )
        .reduce((sum, order) =>
            sum + Number(order.totalAmount || 0), 0
        );

    setText("stat-sales", "₹" + sales.toFixed(2));
}

// =====================================
// DISPLAY ORDERS
// =====================================

function displayOrders(orders) {

    const tbody =
        document.getElementById("orders-table-body");

    if (!tbody) return;

    if (!orders.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9"
                    style="text-align:center;padding:30px;">
                    No orders found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = orders.map(order => {

        const status = String(
            order.orderStatus || "PLACED"
        ).toUpperCase();

        const statusClass =
            status.toLowerCase().replaceAll("_", "-");

        const products = (order.items || []).map(item => `
            ${escapeHTML(item.productName)}
            × ${Number(item.quantity) || 0}
        `).join("<br>");

        const date = order.orderDate
            ? new Date(order.orderDate).toLocaleString("en-IN")
            : "N/A";

        const isCancelled = status === "CANCELLED";

        return `
            <tr>

                <td class="order-id">
                    #${Number(order.id)}
                </td>

                <td>
                    <div class="customer-name">
                        ${escapeHTML(order.customerName)}
                    </div>

                    <small>User ID:
                        ${escapeHTML(order.userId)}
                    </small><br>

                    <small>Phone:
                        ${escapeHTML(order.phone)}
                    </small><br>

                    <small>Address:
                        ${escapeHTML(order.address)}
                    </small><br>

                    <small>City:
                        ${escapeHTML(order.city)}
                    </small><br>

                    <small>Pincode:
                        ${escapeHTML(order.pincode)}
                    </small>
                </td>

                <td class="product-list">
                    ${products || "No items"}
                </td>

                <td>
                    ${escapeHTML(date)}
                </td>

                <td>
                    <strong>
                        ₹${Number(order.totalAmount || 0).toFixed(2)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(order.paymentMethod || "N/A")}
                </td>

                <td>
                    <span class="status-badge status-${statusClass}">
                        ${escapeHTML(status.replaceAll("_", " "))}
                    </span>
                </td>

                <td>

                    <select
                        class="status-select"
                        data-order-id="${Number(order.id)}"
                        data-current-status="${escapeHTML(status)}"
                        ${isCancelled ? "disabled" : ""}>

                        <option value="PLACED"
                            ${status === "PLACED" ? "selected" : ""}>
                            Placed
                        </option>

                        <option value="CONFIRMED"
                            ${status === "CONFIRMED" ? "selected" : ""}>
                            Confirmed
                        </option>

                        <option value="SHIPPED"
                            ${status === "SHIPPED" ? "selected" : ""}>
                            Shipped
                        </option>

                        <option value="OUT_FOR_DELIVERY"
                            ${status === "OUT_FOR_DELIVERY" ? "selected" : ""}>
                            Out For Delivery
                        </option>

                        <option value="DELIVERED"
                            ${status === "DELIVERED" ? "selected" : ""}>
                            Delivered
                        </option>

                        <option value="CANCELLED"
                            disabled
                            ${isCancelled ? "selected" : ""}>
                            Cancelled
                        </option>

                    </select>

                </td>

                <td>
                    <button
                        class="bill-btn"
                        data-order-id="${Number(order.id)}">
                        🧾 Generate Bill
                    </button>
                </td>

            </tr>
        `;

    }).join("");
}

// =====================================
// SEARCH ORDERS
// =====================================

function filterOrders() {

    const search =
        document.getElementById("search-order")
            .value.toLowerCase().trim();

    const filtered = allOrders.filter(order => {

        return (
            String(order.id).includes(search) ||
            String(order.customerName || "")
                .toLowerCase().includes(search) ||
            String(order.phone || "")
                .toLowerCase().includes(search) ||
            String(order.orderStatus || "")
                .toLowerCase().includes(search)
        );

    });

    displayOrders(filtered);
}

// =====================================
// UPDATE ORDER STATUS
// =====================================

async function handleStatusChange(event) {

    const select = event.target;

    if (!select.classList.contains("status-select")) {
        return;
    }

    const orderId = select.dataset.orderId;
    const newStatus = select.value;
    const oldStatus = select.dataset.currentStatus;

    if (newStatus === oldStatus) return;

    const confirmUpdate = confirm(
        `Update Order #${orderId} status to ${newStatus.replaceAll("_", " ")}?`
    );

    if (!confirmUpdate) {

        select.value = oldStatus;
        return;
    }

    select.disabled = true;

    try {

        const response = await fetch(
            `${ADMIN_API_URL}/orders/update-status/${orderId}?status=${encodeURIComponent(newStatus)}`,
            {
                method: "PUT",
                headers: getAdminHeaders()
            }
        );

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                result.detail ||
                `Status update failed: ${response.status}`
            );
        }

        showMessage(
            `Order #${orderId} updated successfully!`,
            "success"
        );

        await loadAdminOrders();

    } catch (error) {

        console.error("Status Update Error:", error);

        showMessage(error.message, "error");

        select.disabled = false;
        select.value = oldStatus;
    }
}

// =====================================
// DOWNLOAD ORDERS CSV
// =====================================

function downloadOrders() {

    if (!allOrders.length) {

        alert("No orders available to download.");
        return;
    }

    const rows = [[
        "Order ID",
        "Customer Name",
        "User ID",
        "Phone",
        "Address",
        "City",
        "Pincode",
        "Products",
        "Order Date",
        "Amount",
        "Payment Method",
        "Order Status"
    ]];

    allOrders.forEach(order => {

        const products = (order.items || []).map(item =>
            `${item.productName || ""} x ${item.quantity || 0}`
        ).join("; ");

        rows.push([
            order.id,
            order.customerName,
            order.userId,
            order.phone,
            order.address,
            order.city,
            order.pincode,
            products,
            order.orderDate,
            order.totalAmount,
            order.paymentMethod,
            order.orderStatus
        ]);

    });

    downloadCSV(rows, "VF_SHOP_Orders.csv");

    showMessage(
        "Orders downloaded successfully!",
        "success"
    );
}

// =====================================
// DOWNLOAD USERS CSV
// =====================================

async function downloadUsers() {

    try {

        const response = await fetch(
            `${ADMIN_API_URL}/auth/customers`,
            {
                method: "GET",
                headers: getAdminHeaders()
            }
        );

        if (!response.ok) {

            throw new Error(
                `Users download failed: ${response.status}`
            );
        }

        allCustomers = await response.json();

        if (!Array.isArray(allCustomers) ||
            !allCustomers.length) {

            alert("No customers available to download.");
            return;
        }

        const rows = [[
            "Customer ID",
            "Customer Name",
            "Email",
            "Phone",
            "Role"
        ]];

        allCustomers.forEach(customer => {

            rows.push([
                customer.id,
                customer.name,
                customer.email,
                customer.phone,
                customer.role
            ]);

        });

        downloadCSV(rows, "VF_SHOP_Users.csv");

        showMessage(
            "Users downloaded successfully!",
            "success"
        );

    } catch (error) {

        console.error("Users Download Error:", error);

        showMessage(error.message, "error");
        alert(error.message);
    }
}

// =====================================
// COMMON CSV DOWNLOAD
// =====================================

function downloadCSV(rows, filename) {

    const csvContent = "\uFEFF" + rows.map(row => {

        return row.map(value => {

            let cell = String(value ?? "");

            if (/^[\s]*[=+\-@]/.test(cell)) {
                cell = "'" + cell;
            }

            return `"${cell.replace(/"/g, '""')}"`;

        }).join(",");

    }).join("\r\n");

    const blob = new Blob(
        [csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =====================================
// GENERATE BILL BUTTON
// =====================================

function handleBillClick(event) {

    const button = event.target.closest(".bill-btn");

    if (!button) return;

    const orderId = Number(button.dataset.orderId);

    const order = allOrders.find(
        item => Number(item.id) === orderId
    );

    if (!order) {

        alert("Order not found!");
        return;
    }

    generateOrderBill(order);
}

// =====================================
// GENERATE ORDER BILL
// =====================================

function generateOrderBill(order) {

    const billWindow = window.open(
        "",
        "_blank",
        "width=900,height=750"
    );

    if (!billWindow) {

        alert("Please allow pop-ups to generate the bill.");
        return;
    }

    const orderDate = order.orderDate
        ? new Date(order.orderDate).toLocaleString("en-IN")
        : "N/A";

    const items = order.items || [];

    const productRows = items.map((item, index) => {

        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const total = quantity * price;

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHTML(item.productName)}</td>
                <td>${quantity}</td>
                <td>₹${price.toFixed(2)}</td>
                <td>₹${total.toFixed(2)}</td>
            </tr>
        `;

    }).join("");

    const totalAmount = Number(order.totalAmount || 0);

    const safeOrderId = Number(order.id);

    billWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">

        <head>

            <meta charset="UTF-8">

            <meta name="viewport"
                content="width=device-width, initial-scale=1.0">

            <title>VF SHOP Invoice #${safeOrderId}</title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    padding: 35px;
                    max-width: 850px;
                    margin: auto;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 3px solid #228b55;
                    padding-bottom: 15px;
                }

                .logo {
                    color: #228b55;
                    font-size: 30px;
                    font-weight: bold;
                }

                .invoice-title {
                    text-align: right;
                }

                .details {
                    display: flex;
                    justify-content: space-between;
                    margin: 30px 0;
                    gap: 20px;
                }

                .details div {
                    line-height: 1.8;
                    overflow-wrap: anywhere;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 25px;
                }

                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }

                th {
                    background: #228b55;
                    color: white;
                }

                .total {
                    text-align: right;
                    margin-top: 25px;
                    font-size: 21px;
                    color: #228b55;
                }

                .footer {
                    text-align: center;
                    margin-top: 55px;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                }

                .print-btn {
                    background: #228b55;
                    color: white;
                    padding: 12px 25px;
                    border: none;
                    cursor: pointer;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    font-size: 15px;
                }

                .print-btn:hover {
                    background: #176b40;
                }

                @media print {

                    .print-btn {
                        display: none;
                    }

                    body {
                        padding: 0;
                    }

                }

                @page {
                    size: A4;
                    margin: 15mm;
                }

            </style>

        </head>

        <body>

            <button class="print-btn"
                onclick="window.print()">
                📥 Download / Print Bill
            </button>

            <div class="header">

                <div>
                    <div class="logo">VF SHOP</div>
                    <p>Fresh Fruits & Vegetables</p>
                </div>

                <div class="invoice-title">
                    <h2>INVOICE</h2>
                    <strong>Invoice: VF-INV-${safeOrderId}</strong>
                </div>

            </div>

            <div class="details">

                <div>

                    <h3>Bill To</h3>

                    <strong>
                        ${escapeHTML(order.customerName)}
                    </strong><br>

                    Phone:
                    ${escapeHTML(order.phone)}<br>

                    Address:
                    ${escapeHTML(order.address)}<br>

                    City:
                    ${escapeHTML(order.city)}<br>

                    Pincode:
                    ${escapeHTML(order.pincode)}

                </div>

                <div>

                    <h3>Order Details</h3>

                    Order ID: #${safeOrderId}<br>

                    Date:
                    ${escapeHTML(orderDate)}<br>

                    Payment:
                    ${escapeHTML(order.paymentMethod || "N/A")}<br>

                    Status:
                    ${escapeHTML(order.orderStatus || "PLACED")}

                </div>

            </div>

            <h3>Product Details</h3>

            <table>

                <thead>
                    <tr>
                        <th>S.No</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>

                <tbody>
                    ${productRows || `
                        <tr>
                            <td colspan="5">No products found</td>
                        </tr>
                    `}
                </tbody>

            </table>

            <div class="total">
                <strong>
                    Grand Total: ₹${totalAmount.toFixed(2)}
                </strong>
            </div>

            <div class="footer">

                <h3>
                    Thank You for Shopping with VF SHOP!
                </h3>

                <p>We appreciate your order.</p>

                <small>
                    This is a computer-generated invoice.
                </small>

            </div>

        </body>
        </html>
    `);

    billWindow.document.close();
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
// SHOW MESSAGE
// =====================================

function showMessage(message, type) {

    const element =
        document.getElementById("message");

    if (!element) return;

    element.textContent = message;
    element.className = `message ${type}`;
}
