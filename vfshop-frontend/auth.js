
const API_BASE = "https://vfshop-backend.onrender.com/api/auth";

// ===============================
// LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        const loginBtn = document.getElementById("loginBtn");
        const message = document.getElementById("message");

        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in...";

        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed!");
            }

            if (!data.token) {
                throw new Error("JWT token missing in login response!");
            }

            // Save JWT Token
            localStorage.setItem("token", data.token);

            // Save User Details
            const user = {
                id: data.id,
                name: data.name,
                email: data.email,
                role: String(data.role || "USER").toUpperCase()
            };

            localStorage.setItem("vfshopUser", JSON.stringify(user));

            message.textContent = "Login successful!";
            message.style.color = "green";

            // ROLE BASED REDIRECT
            if (user.role === "ADMIN") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "index.html";
            }

        } catch (error) {
            console.error("Login Error:", error);

            message.textContent = error.message;
            message.style.color = "red";

        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = "Login";
        }
    });
}

// ===============================
// REGISTER
// ===============================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value.trim();

        const registerBtn = document.getElementById("registerBtn");
        const message = document.getElementById("message");

        if (!name || !email || !phone || !password) {
            message.textContent = "Please fill all fields!";
            message.style.color = "red";
            return;
        }

        registerBtn.disabled = true;
        registerBtn.textContent = "Registering...";

        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed!");
            }

            message.textContent = "Registration successful! Please login.";
            message.style.color = "green";

            registerForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {
            console.error("Register Error:", error);

            message.textContent = error.message;
            message.style.color = "red";

        } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = "Register";
        }
    });
}
