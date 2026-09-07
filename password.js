/* ==========================================
   Simple File Encryptor
   Password Management
========================================== */

"use strict";

/* ---------- Constants ---------- */

const MIN_PASSWORD_LENGTH = 8;

/* ---------- Toggle Password Visibility ---------- */

DOM.showPassword.addEventListener("change", () => {

    const type = DOM.showPassword.checked
        ? "text"
        : "password";

    DOM.password.type = type;
    DOM.confirmPassword.type = type;

});

/* ---------- Live Password Check ---------- */

DOM.password.addEventListener("input", updatePasswordStrength);

DOM.confirmPassword.addEventListener("input", validatePasswordMatch);

/* ---------- Password Strength ---------- */

function updatePasswordStrength() {

    const password = DOM.password.value;

    const strength = calculateStrength(password);

    DOM.strength.textContent =
        `Strength: ${strength.label}`;

    DOM.strength.style.color =
        strength.color;

    validatePasswordMatch();

}

/* ---------- Password Matching ---------- */

function validatePasswordMatch() {

    const password = DOM.password.value;

    const confirm = DOM.confirmPassword.value;

    if (confirm.length === 0) {

        DOM.confirmPassword.style.borderColor = "";

        return true;

    }

    if (password === confirm) {

        DOM.confirmPassword.style.borderColor =
            "var(--success)";

        return true;

    }

    DOM.confirmPassword.style.borderColor =
        "var(--danger)";

    return false;

}

/* ---------- Strength Algorithm ---------- */

function calculateStrength(password) {

    let score = 0;

    if (password.length >= 8)
        score++;

    if (password.length >= 12)
        score++;

    if (/[A-Z]/.test(password))
        score++;

    if (/[a-z]/.test(password))
        score++;

    if (/\d/.test(password))
        score++;

    if (/[^A-Za-z0-9]/.test(password))
        score++;

    if (score <= 2) {

        return {

            label: "Weak",

            color: "var(--danger)"

        };

    }

    if (score <= 4) {

        return {

            label: "Medium",

            color: "var(--warning)"

        };

    }

    return {

        label: "Strong",

        color: "var(--success)"

    };

}

/* ---------- Final Validation ---------- */

function validatePassword() {

    const password = DOM.password.value;
    const confirm = DOM.confirmPassword.value;

    if (password.length === 0) {

        setStatus("Please enter a password.");
        DOM.password.focus();

        return false;

    }

    if (password.length < MIN_PASSWORD_LENGTH) {

        setStatus(
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
        );

        DOM.password.focus();

        return false;

    }

    // Only require confirmation while encrypting
    if (State.mode === "encrypt" && password !== confirm) {

        setStatus("Passwords do not match.");

        DOM.confirmPassword.focus();

        return false;

    }

    return true;

}

/* ---------- Getter ---------- */

function getPassword() {

    return DOM.password.value;

}
