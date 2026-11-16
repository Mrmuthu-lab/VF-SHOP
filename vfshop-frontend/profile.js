
// ========================================
// VF SHOP - USER PROFILE
// ========================================

const API_URL = "http://localhost:8080/api";

let currentUser = null;
let profileData = {};

// ========================================
// PAGE LOAD
// ========================================

document.addEventListener("DOMContentLoaded", async () => {

    currentUser = JSON.parse(
        localStorage.getItem("vfshopUser") || "null"
    );

    const token = localStorage.getItem("token");

    if (!currentUser || !currentUser.id || !token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    loadSavedProfile();

    await loadLatestOrderDetails();

    fillProfileForm();

    setFormMode(false);

    document.getElementById("editBtn")
        .addEventListener("click", () => {
            setFormMode(true);
        });

    document.getElementById("profileForm")
        .addEventListener("submit", saveProfile);

    document.getElementById("cancelBtn")
        .addEventListener("click", () => {
            fillProfileForm();
            setFormMode(false);
            showMessage("");
        });

    document.getElementById("logoutBtn")
        .addEventListener("click", logoutUser);

});

// ========================================
// LOAD SAVED PROFILE
// ========================================

function loadSavedProfile() {

    const key = "vfshop_profile_" + currentUser.id;

    profileData = JSON.parse(
        localStorage.getItem(key) || "{}"
    );

    profileData.name =
        profileData.name || currentUser.name || "";

    profileData.email =
        currentUser.email || "";

    profileData.phone =
        profileData.phone || "";

    profileData.address =
        profileData.address || "";

    profileData.city =
        profileData.city || "";

    profileData.pincode =
        profileData.pincode || "";
}

// ========================================
// LOAD LATEST ORDER DETAILS
// ========================================

async function loadLatestOrderDetails() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API_URL}/orders/${currentUser.id}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) return;

        const orders = await response.json();

        if (!Array.isArray(orders) || orders.length === 0) {
            return;
        }

        const latestOrder = orders[0];

        if (!profileData.phone) {
            profileData.phone = latestOrder.phone || "";
        }

        if (!profileData.address) {
            profileData.address = latestOrder.address || "";
        }

        if (!profileData.city) {
            profileData.city = latestOrder.city || "";
        }

        if (!profileData.pincode) {
            profileData.pincode = latestOrder.pincode || "";
        }

    } catch (error) {

        console.error("Profile details loading error:", error);

    }
}

// ========================================
// FILL FORM
// ========================================

function fillProfileForm() {

    setValue("name", profileData.name);
    setValue("email", profileData.email);
    setValue("phone", profileData.phone);
    setValue("address", profileData.address);
    setValue("city", profileData.city);
    setValue("pincode", profileData.pincode);

}

// ========================================
// EDIT / VIEW MODE
// ========================================

function setFormMode(editMode) {

    const form = document.getElementById("profileForm");

    form.querySelectorAll(
        "input:not([name='email']), textarea"
    ).forEach(element => {
        element.disabled = !editMode;
    });

    document.getElementById("editBtn").hidden = editMode;
    document.getElementById("saveBtn").disabled = !editMode;
    document.getElementById("cancelBtn").hidden = !editMode;

}

// ========================================
// SAVE PROFILE
// ========================================

function saveProfile(event) {

    event.preventDefault();

    const updatedData = {

        name: getValue("name"),
        email: currentUser.email,
        phone: getValue("phone"),
        address: getValue("address"),
        city: getValue("city"),
        pincode: getValue("pincode")

    };

    if (!updatedData.name) {
        showMessage("Please enter your name.", "error");
        return;
    }

    if (updatedData.phone &&
        !/^[0-9]{10}$/.test(updatedData.phone)) {

        showMessage("Enter a valid 10-digit phone number.", "error");
        return;
    }

    if (updatedData.pincode &&
        !/^[0-9]{6}$/.test(updatedData.pincode)) {

        showMessage("Enter a valid 6-digit pincode.", "error");
        return;
    }

    const key = "vfshop_profile_" + currentUser.id;

    localStorage.setItem(
        key,
        JSON.stringify(updatedData)
    );

    profileData = updatedData;

    setFormMode(false);

    showMessage("Profile saved successfully!", "success");

}

// ========================================
// INPUT HELPERS
// ========================================

function setValue(name, value) {

    const element = document.querySelector(
        `[name="${name}"]`
    );

    if (element) {
        element.value = value || "";
    }

}

function getValue(name) {

    const element = document.querySelector(
        `[name="${name}"]`
    );

    return element ? element.value.trim() : "";

}

// ========================================
// MESSAGE
// ========================================

function showMessage(message, type = "") {

    const element = document.getElementById(
        "profile-save-msg"
    );

    element.textContent = message;

    element.style.color =
        type === "success" ? "green" :
        type === "error" ? "red" : "";

}

// ========================================
// LOGOUT
// ========================================

function logoutUser() {

    const confirmLogout = confirm(
        "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    localStorage.removeItem("token");
    localStorage.removeItem("vfshopUser");

    window.location.href = "login.html";

}
