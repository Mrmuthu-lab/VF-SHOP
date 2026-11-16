
const API_URL = "http://localhost:8080/api/auth";

let userEmail = "";
let resetToken = "";

const emailForm = document.getElementById("emailForm");
const otpForm = document.getElementById("otpForm");
const resetForm = document.getElementById("resetForm");

const stepTitle = document.getElementById("stepTitle");
const stepDescription = document.getElementById("stepDescription");

// COMMON API RESPONSE HANDLER
async function handleResponse(response) {

    const text = await response.text();

    let data = {};

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(
                `Invalid server response (${response.status}). Check backend logs.`
            );
        }
    }

    if (!response.ok) {
        throw new Error(
            data.message || data.error || `Server error: ${response.status}`
        );
    }

    if (!text) {
        throw new Error("Server returned an empty response.");
    }

    return data;
}

// STEP 1 - SEND OTP
emailForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    userEmail = document.getElementById("email").value.trim();

    const button = document.getElementById("sendBtn");
    const message = document.getElementById("message1");

    button.disabled = true;
    button.textContent = "Sending...";
    message.textContent = "";

    try {

        const response = await fetch(`${API_URL}/forgot-password`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: userEmail
            })
        });

        const data = await handleResponse(response);

        message.textContent = data.message || "OTP request completed.";

        emailForm.style.display = "none";
        otpForm.style.display = "block";

        stepTitle.textContent = "Verify OTP";

        stepDescription.textContent =
            "Enter the 6-digit OTP sent to your email.";

    } catch (error) {

        message.textContent = error.message;

    } finally {

        button.disabled = false;
        button.textContent = "Send OTP";
    }
});

// STEP 2 - VERIFY OTP
otpForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const otp = document.getElementById("otp").value.trim();

    const message = document.getElementById("message2");

    message.textContent = "";

    try {

        const response = await fetch(`${API_URL}/verify-otp`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: userEmail,
                otp: otp
            })
        });

        const data = await handleResponse(response);

        resetToken = data.resetToken;

        if (!resetToken) {
            throw new Error("Reset token was not received.");
        }

        otpForm.style.display = "none";
        resetForm.style.display = "block";

        stepTitle.textContent = "Create New Password";

        stepDescription.textContent =
            "Enter your new password below.";

    } catch (error) {

        message.textContent = error.message;
    }
});

// STEP 3 - RESET PASSWORD
resetForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const message = document.getElementById("message3");

    message.textContent = "";

    if (newPassword.length < 8) {
        message.textContent =
            "Password must contain at least 8 characters.";
        return;
    }

    if (newPassword !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        return;
    }

    try {

        const response = await fetch(`${API_URL}/reset-password`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: userEmail,
                resetToken: resetToken,
                newPassword: newPassword
            })
        });

        const data = await handleResponse(response);

        stepTitle.textContent = "Password Changed!";

        stepDescription.textContent =
            data.message || "Your password has been reset successfully.";

        resetForm.style.display = "none";

        document.querySelector(".switch-text").innerHTML =
            '<a href="login.html">Go to Login</a>';

    } catch (error) {

        message.textContent = error.message;
    }
});
