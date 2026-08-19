/* ==========================================
   Simple File Encryptor
   Shared Utilities
========================================== */

"use strict";

/* ---------- DOM Cache ---------- */

const DOM = {

    encryptTab:
        document.getElementById("encryptTab"),

    decryptTab:
        document.getElementById("decryptTab"),

    fileInput:
        document.getElementById("fileInput"),

    chooseFile:
        document.getElementById("chooseFile"),

    pickerFiles:
        document.getElementById("pickerFiles"),

    pickerFolder:
        document.getElementById("pickerFolder"),

    dropZone:
        document.getElementById("dropZone"),

    selectedFile:
        document.getElementById("selectedFile"),

    password:
        document.getElementById("password"),

    confirmPassword:
        document.getElementById("confirmPassword"),

    showPassword:
        document.getElementById("showPassword"),

    strength:
        document.getElementById("strength"),

    actionButton:
        document.getElementById("actionButton"),

    progressBar:
        document.getElementById("progressBar"),

    status:
        document.getElementById("status"),

    outputFilename:
        document.getElementById("outputFilename"),

    downloadButton:
        document.getElementById("downloadButton")

};

/* ---------- Application State ---------- */

const State = {

    mode: "encrypt",

    selectedFiles: [],

    pickerMode: "files",

    previousEncryptPickerMode: "files",

    encryptedBlob: null,

    decryptedBlob: null,

    outputName: "",

    busy: false

};

/* ---------- Status ---------- */

function setStatus(message) {

    DOM.status.textContent = message;

}

function clearStatus() {

    setStatus("Waiting...");

}

/* ---------- Progress ---------- */

function setProgress(percent) {

    const value = Math.max(

        0,

        Math.min(

            100,

            Number(percent)

        )

    );

    DOM.progressBar.style.width =

        value + "%";

}

function resetProgress() {

    setProgress(0);

}

function completeProgress() {

    setProgress(100);

}

/* ---------- Download ---------- */

function enableDownload() {

    DOM.downloadButton.disabled = false;

}

function disableDownload() {

    DOM.downloadButton.disabled = true;

}

/* ---------- Busy State ---------- */

function setBusy(value) {

    State.busy = Boolean(value);

    DOM.actionButton.disabled =

        State.busy;

    DOM.chooseFile.disabled =

        State.busy;

    DOM.fileInput.disabled =

        State.busy;

}

/* ---------- Output ---------- */

/* ---------- Picker Mode ---------- */

function setPickerMode(mode, options = {}) {

    const nextMode = mode === "folder" ? "folder" : "files";

    if (State.mode === "encrypt") {

        State.pickerMode = nextMode;

    }

    else {

        if (options.preservePrevious !== false) {

            State.previousEncryptPickerMode = nextMode;

        }

        State.pickerMode = "files";

    }

    syncPickerInputMode();

    updatePickerModeUI();

}

function syncPickerInputMode() {

    DOM.fileInput.multiple = true;

    if (State.mode === "encrypt" && State.pickerMode === "folder") {

        DOM.fileInput.setAttribute("webkitdirectory", "");

    }

    else {

        DOM.fileInput.removeAttribute("webkitdirectory");

    }

}

function updatePickerModeUI() {

    const folderActive = State.mode === "encrypt" && State.pickerMode === "folder";
    const filesActive = !folderActive;

    if (DOM.pickerFiles) {
        DOM.pickerFiles.classList.toggle("active", filesActive);
        DOM.pickerFiles.disabled = State.busy || State.mode !== "encrypt";
    }

    if (DOM.pickerFolder) {
        DOM.pickerFolder.classList.toggle("active", folderActive);
        DOM.pickerFolder.disabled = State.busy || State.mode !== "encrypt";
    }

    if (DOM.chooseFile) {
        DOM.chooseFile.textContent = folderActive ? "Select Folder" : "Select Files";
    }

}

function clearOutput() {

    State.encryptedBlob = null;

    State.decryptedBlob = null;

    State.outputName = "";

    DOM.outputFilename.textContent =

        "No file generated.";

    disableDownload();

    resetProgress();

}

/* ---------- File Size ---------- */

function bytesToSize(bytes) {

    if (bytes === 0) {

        return "0 Bytes";

    }

    const units = [

        "Bytes",

        "KB",

        "MB",

        "GB",

        "TB"

    ];

    const index = Math.floor(

        Math.log(bytes) /

        Math.log(1024)

    );

    return (

        bytes /

        Math.pow(1024, index)

    ).toFixed(2)

    + " "

    + units[index];

}

/* ---------- Escape HTML ---------- */

function escapeHTML(text) {

    const div =

        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}

/* ---------- Random ID ---------- */

function randomID(length = 8) {

    return crypto

        .getRandomValues(

            new Uint32Array(length)

        )

        .reduce(

            (id, value) =>

                id +

                (value % 36)
                .toString(36),

            ""

        );

}

/* ---------- File Names ---------- */

function removeExtension(filename) {

    const index =

        filename.lastIndexOf(".");

    if (index === -1) {

        return filename;

    }

    return filename.substring(

        0,

        index

    );

}

function getExtension(filename) {

    const index =

        filename.lastIndexOf(".");

    if (index === -1) {

        return "";

    }

    return filename.substring(index);

}

function buildEncryptedName(filename) {

    return filename + ".sfe";

}

function buildDecryptedName(filename) {

    if (

        filename.endsWith(".sfe")

    ) {

        return filename.slice(0, -4);

    }

    return removeExtension(filename) + "_decrypted";

}

function getRelativePath(file) {

    if (

        file &&
        typeof file.webkitRelativePath === "string" &&
        file.webkitRelativePath.length > 0

    ) {

        return file.webkitRelativePath;

    }

    return file.name;

}

function getFolderNameFromSelection(files) {

    if (!Array.isArray(files) || files.length === 0) {

        return "";

    }

    const first = files[0];

    if (
        !first ||
        typeof first.webkitRelativePath !== "string" ||
        first.webkitRelativePath.length === 0
    ) {

        return "";

    }

    const parts = first.webkitRelativePath.split("/");

    return parts.length > 1 ? parts[0] : "";

}

function getSelectionCountLabel(files) {

    const count = Array.isArray(files) ? files.length : 0;

    return count === 1 ? "1 file selected" : `${count} files selected`;

}

/* ---------- Reset Helpers ---------- */

function resetInterface() {

    clearOutput();

    clearStatus();

    setBusy(false);

}

/* ---------- Browser Support ---------- */

function browserSupported() {

    return (

        window.isSecureContext &&

        window.crypto &&

        window.crypto.subtle &&

        window.File &&

        window.Blob &&

        window.TextEncoder &&

        window.TextDecoder

    );

}

function requireBrowserSupport() {

    if (browserSupported()) {

        return true;

    }

    setStatus(

        "Your browser does not support the required Web Crypto features."

    );

    DOM.actionButton.disabled = true;

    DOM.chooseFile.disabled = true;

    DOM.fileInput.disabled = true;

    return false;

}

/* ---------- Output Helpers ---------- */

function setOutput(blob, filename) {

    if (State.mode === "encrypt") {

        State.encryptedBlob = blob;

        State.decryptedBlob = null;

    }

    else {

        State.decryptedBlob = blob;

        State.encryptedBlob = null;

    }

    State.outputName = filename;

    DOM.outputFilename.textContent = filename;

    enableDownload();

}

/* ---------- Active Blob ---------- */

function getOutputBlob() {

    return (

        State.mode === "encrypt"

            ? State.encryptedBlob

            : State.decryptedBlob

    );

}

/* ---------- Startup ---------- */

resetInterface();

requireBrowserSupport();
