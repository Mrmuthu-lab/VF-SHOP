
// ============================================
// VF SHOP - ADMIN PRODUCT MANAGEMENT
// ============================================

const PRODUCT_API_URL = "http://localhost:8080/api/products";

const productForm = document.getElementById("product-form");
const productIdInput = document.getElementById("product-id");
const nameInput = document.getElementById("product-name");
const priceInput = document.getElementById("product-price");
const imageInput = document.getElementById("product-image");
const descriptionInput = document.getElementById("product-description");

const tableBody = document.getElementById("products-table-body");
const totalProducts = document.getElementById("total-products");
const searchInput = document.getElementById("search-product");
const refreshBtn = document.getElementById("refresh-btn");
const cancelBtn = document.getElementById("cancel-btn");
const saveBtn = document.getElementById("save-btn");
const formTitle = document.getElementById("form-title");
const message = document.getElementById("message");

let products = [];

// ============================================
// ADMIN AUTH HEADERS
// ============================================

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

// SAFE HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ============================================
// LOAD PRODUCTS
// ============================================

async function loadProducts() {

    tableBody.innerHTML = `
        <tr><td colspan="6">Loading products...</td></tr>
    `;

    message.textContent = "";

    try {

        const response = await fetch(PRODUCT_API_URL);

        if (!response.ok) {
            throw new Error(`Unable to load products: ${response.status}`);
        }

        products = await response.json();

        totalProducts.textContent = products.length;

        displayProducts(products);

    } catch (error) {

        console.error("Product Error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">Failed to load products. Check backend.</td>
            </tr>
        `;

        totalProducts.textContent = "0";
        message.textContent = error.message;
    }
}

// ============================================
// DISPLAY PRODUCTS
// ============================================

function displayProducts(data) {

    if (data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">No products found</td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = data.map(product => {

        const image = product.image
            ? escapeHTML(product.image)
            : "";

        return `
            <tr>
                <td>${Number(product.id)}</td>

                <td>
                    ${
                        image
                        ? `<img class="product-image"
                            src="${image}"
                            alt="${escapeHTML(product.name)}"
                            onerror="this.style.display='none'">`
                        : "No Image"
                    }
                </td>

                <td>${escapeHTML(product.name)}</td>

                <td>₹${Number(product.price).toFixed(2)}</td>

                <td>${escapeHTML(product.description || "-")}</td>

                <td>
                    <button
                        class="edit-btn"
                        onclick="editProduct(${Number(product.id)})">
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteProduct(${Number(product.id)})">
                        Delete
                    </button>
                </td>
            </tr>
        `;

    }).join("");
}

// ============================================
// ADD / UPDATE PRODUCT
// ============================================

productForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const id = productIdInput.value;

    const product = {
        name: nameInput.value.trim(),
        price: Number(priceInput.value),
        image: imageInput.value.trim(),
        description: descriptionInput.value.trim()
    };

    if (!product.name || !Number.isFinite(product.price) ||
        product.price <= 0) {

        message.textContent = "Enter a valid product name and price.";
        return;
    }

    const url = id
        ? `${PRODUCT_API_URL}/${id}`
        : PRODUCT_API_URL;

    const method = id ? "PUT" : "POST";

    saveBtn.disabled = true;
    saveBtn.textContent = id ? "Updating..." : "Adding...";
    message.textContent = "";

    try {

        const response = await fetch(url, {
            method: method,
            headers: getAdminHeaders(),
            body: JSON.stringify(product)
        });

        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                errorText || `Unable to save product: ${response.status}`
            );
        }

        message.style.color = "green";
        message.textContent = id
            ? "Product updated successfully!"
            : "Product added successfully!";

        resetForm();
        await loadProducts();

    } catch (error) {

        console.error("Save Product Error:", error);

        message.style.color = "#d32f2f";
        message.textContent = error.message;

    } finally {

        saveBtn.disabled = false;
        saveBtn.textContent = productIdInput.value
            ? "Update Product"
            : "Add Product";
    }
});

// ============================================
// EDIT PRODUCT
// ============================================

function editProduct(id) {

    const product = products.find(item => Number(item.id) === Number(id));

    if (!product) {
        message.textContent = "Product not found";
        return;
    }

    productIdInput.value = product.id;
    nameInput.value = product.name || "";
    priceInput.value = product.price ?? "";
    imageInput.value = product.image || "";
    descriptionInput.value = product.description || "";

    formTitle.textContent = "Edit Product";
    saveBtn.textContent = "Update Product";

    document.querySelector(".form-section")?.scrollIntoView({
        behavior: "smooth"
    });
}

// ============================================
// DELETE PRODUCT
// ============================================

async function deleteProduct(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    message.textContent = "";

    try {

        const response = await fetch(
            `${PRODUCT_API_URL}/${id}`,
            {
                method: "DELETE",
                headers: getAdminHeaders()
            }
        );

        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                errorText || `Unable to delete product: ${response.status}`
            );
        }

        message.style.color = "green";
        message.textContent = "Product deleted successfully!";

        if (productIdInput.value === String(id)) {
            resetForm();
        }

        await loadProducts();

    } catch (error) {

        console.error("Delete Product Error:", error);

        message.style.color = "#d32f2f";
        message.textContent = error.message;
    }
}

// ============================================
// RESET FORM
// ============================================

function resetForm() {

    productForm.reset();

    productIdInput.value = "";

    formTitle.textContent = "Add New Product";

    saveBtn.textContent = "Add Product";
}

// ============================================
// CLEAR BUTTON
// ============================================

cancelBtn.addEventListener("click", function() {

    resetForm();
    message.textContent = "";
});

// ============================================
// SEARCH PRODUCTS
// ============================================

searchInput.addEventListener("input", function() {

    const value = this.value.toLowerCase().trim();

    const filteredProducts = products.filter(product => {

        return (
            String(product.id).includes(value) ||
            (product.name || "").toLowerCase().includes(value) ||
            (product.description || "").toLowerCase().includes(value) ||
            String(product.price).includes(value)
        );
    });

    displayProducts(filteredProducts);
});

// ============================================
// REFRESH BUTTON
// ============================================

refreshBtn.addEventListener("click", function() {

    searchInput.value = "";
    loadProducts();
});

// ============================================
// INITIAL LOAD
// ============================================

loadProducts();
