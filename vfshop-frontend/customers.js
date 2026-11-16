
const CUSTOMER_API_URL = "http://localhost:8080/api/auth";

let customers = [];

// =====================================
// PAGE LOAD
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    loadCustomers();

    document.getElementById("refresh-customers")
        ?.addEventListener("click", loadCustomers);

    document.getElementById("search-customer")
        ?.addEventListener("input", filterCustomers);

});

// =====================================
// LOAD CUSTOMERS
// =====================================

async function loadCustomers() {

    const tableBody =
        document.getElementById("customers-table-body");

    const totalCustomers =
        document.getElementById("total-customers");

    const registeredCustomers =
        document.getElementById("registered-customers");

    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="loading">
                Loading customers...
            </td>
        </tr>
    `;

    showCustomerMessage("", "");

    try {

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Login token not found. Please login again.");
        }

        const response = await fetch(
            `${CUSTOMER_API_URL}/customers`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Unable to load customers. Status: ${response.status}`
            );
        }

        customers = await response.json();

        if (!Array.isArray(customers)) {
            throw new Error("Invalid customer response from backend");
        }

        if (totalCustomers) {
            totalCustomers.textContent = customers.length;
        }

        if (registeredCustomers) {
            registeredCustomers.textContent = customers.length;
        }

        displayCustomers(customers);

    } catch (error) {

        console.error("Customer Error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

        if (totalCustomers) {
            totalCustomers.textContent = "0";
        }

        if (registeredCustomers) {
            registeredCustomers.textContent = "0";
        }

        showCustomerMessage(error.message, "error");
    }
}

// =====================================
// DISPLAY CUSTOMERS
// =====================================

function displayCustomers(data) {

    const tableBody =
        document.getElementById("customers-table-body");

    if (!tableBody) return;

    if (!data.length) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    No customers found.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = data.map(customer => {

        return `
            <tr>
                <td>#${Number(customer.id)}</td>

                <td>
                    <strong>${escapeHTML(customer.name)}</strong>
                </td>

                <td>${escapeHTML(customer.email)}</td>

                <td>${escapeHTML(customer.phone || "-")}</td>

                <td>
                    <span class="role-badge">
                        ${escapeHTML(customer.role || "USER")}
                    </span>
                </td>
            </tr>
        `;

    }).join("");
}

// =====================================
// SEARCH CUSTOMERS
// =====================================

function filterCustomers() {

    const searchInput =
        document.getElementById("search-customer");

    if (!searchInput) return;

    const searchValue =
        searchInput.value.toLowerCase().trim();

    const filteredCustomers = customers.filter(customer => {

        return (
            String(customer.id).includes(searchValue) ||
            String(customer.name || "").toLowerCase().includes(searchValue) ||
            String(customer.email || "").toLowerCase().includes(searchValue) ||
            String(customer.phone || "").toLowerCase().includes(searchValue) ||
            String(customer.role || "").toLowerCase().includes(searchValue)
        );

    });

    displayCustomers(filteredCustomers);
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
// MESSAGE
// =====================================

function showCustomerMessage(text, type) {

    const message =
        document.getElementById("customer-message");

    if (!message) return;

    message.textContent = text;
    message.className = `message ${type}`;
}
