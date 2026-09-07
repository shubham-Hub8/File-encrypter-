/* ==========================================
   Simple File Encryptor
   User Interface
========================================== */

"use strict";

/* ---------- Encrypt Mode ---------- */

DOM.encryptTab.addEventListener(

    "click",

    () => {

        setMode("encrypt");

    }

);

/* ---------- Decrypt Mode ---------- */

DOM.decryptTab.addEventListener(

    "click",

    () => {

        setMode("decrypt");

    }

);

/* ---------- Picker Mode ---------- */

if (DOM.pickerFiles) {

    DOM.pickerFiles.addEventListener("click", () => {

        setPickerMode("files");

        DOM.fileInput.value = "";

    });

}

if (DOM.pickerFolder) {

    DOM.pickerFolder.addEventListener("click", () => {

        setPickerMode("folder");

        DOM.fileInput.value = "";

    });

}


if (DOM.argonMemory) {

    DOM.argonMemory.addEventListener("change", () => {
        const value = Number.parseInt(DOM.argonMemory.value, 10);
        if (Number.isFinite(value)) State.argonMemoryKib = value;
        updateArgonMemoryUI();
    });

}

/* ---------- Mode ---------- */

function setMode(mode) {

    if (

        State.mode === mode

    ) {

        return;

    }

    State.mode = mode;

    if (mode === "decrypt") {

        State.previousEncryptPickerMode = State.pickerMode;
        State.pickerMode = "files";

    }

    else if (State.previousEncryptPickerMode === "folder") {

        State.pickerMode = "folder";

    }

    else {

        State.pickerMode = "files";

    }

    clearFile();

    updateTabs();

    updateActionButton();

    updatePickerButton();

    updatePickerModeUI();

    syncPickerInputMode();

    updatePasswordSection();
    updateArgonMemoryUI();

    clearOutput;

    resetProgress();

    setStatus(

        mode === "encrypt"

            ? "Encryption mode selected."

            : "Decryption mode selected."

    );

}

/* ---------- Tabs ---------- */

function updateTabs() {

    DOM.encryptTab.classList.toggle(

        "active",

        State.mode === "encrypt"

    );

    DOM.decryptTab.classList.toggle(

        "active",

        State.mode === "decrypt"

    );

}

/* ---------- Action Button ---------- */

function updateActionButton() {

    DOM.actionButton.textContent =

        State.mode === "encrypt"

            ? "Encrypt Files"

            : "Decrypt File";

}

function updatePickerButton() {

    if (State.mode === "encrypt") {

        DOM.chooseFile.textContent =

            State.pickerMode === "folder"

                ? "Select Folder"

                : "Select Files";

    }

    else {

        DOM.chooseFile.textContent = "Select Encrypted File";

    }

}

/* ---------- Confirm Password ---------- */

function updatePasswordSection() {

    const label =

        DOM.confirmPassword
            .previousElementSibling;

    const visible =

        State.mode === "encrypt";

    label.hidden = !visible;

    DOM.confirmPassword.hidden = !visible;

    if (!visible) {

        DOM.confirmPassword.value = "";

        DOM.confirmPassword.style.borderColor = "";

    }

}

/* ---------- Reset ---------- */

function resetUI() {

    DOM.password.value = "";

    DOM.confirmPassword.value = "";

    DOM.showPassword.checked = false;

    DOM.password.type = "password";

    DOM.confirmPassword.type = "password";

    DOM.strength.textContent =

        "Strength: —";

    DOM.strength.style.color =

        "";

    DOM.selectedFile.textContent =

        "No files selected";

    updatePickerButton();

    updatePickerModeUI();

    syncPickerInputMode();

    clearOutput();

    resetProgress();

    updateTabs();

    updateActionButton();

    updatePasswordSection();
    updateArgonMemoryUI();

    setStatus("Waiting...");

}

/* ---------- Startup ---------- */

resetUI();
