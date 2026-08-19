/* ==========================================
   Simple File Encryptor
   Cryptography
========================================== */

"use strict";

/* ---------- Configuration ---------- */

const PBKDF2_ITERATIONS = 250000;

const AES_KEY_LENGTH = 256;

const IV_LENGTH = 12;

const SALT_LENGTH = 16;

const HEADER = "SFE1";

/* ---------- Text Helpers ---------- */

const encoder = new TextEncoder();

const decoder = new TextDecoder();

/* ---------- Random Bytes ---------- */

function randomBytes(length) {

    return crypto.getRandomValues(

        new Uint8Array(length)

    );

}

/* ---------- Read File ---------- */

async function readFile(file) {

    return await file.arrayBuffer();

}

/* ---------- Password Key ---------- */

async function importPassword(password) {

    return crypto.subtle.importKey(

        "raw",

        encoder.encode(password),

        "PBKDF2",

        false,

        [

            "deriveKey"

        ]

    );

}

/* ---------- Derive AES Key ---------- */

async function deriveKey(password, salt) {

    const passwordKey =

        await importPassword(password);

    return crypto.subtle.deriveKey(

        {

            name: "PBKDF2",

            hash: "SHA-256",

            salt,

            iterations:

                PBKDF2_ITERATIONS

        },

        passwordKey,

        {

            name: "AES-GCM",

            length:

                AES_KEY_LENGTH

        },

        false,

        [

            "encrypt",

            "decrypt"

        ]

    );

}

/* ---------- Merge Buffers ---------- */

function mergeBuffers(...arrays) {

    let totalLength = 0;

    arrays.forEach(array => {

        totalLength += array.length;

    });

    const merged =

        new Uint8Array(totalLength);

    let offset = 0;

    arrays.forEach(array => {

        merged.set(

            array,

            offset

        );

        offset += array.length;

    });

    return merged;

}

/* ---------- Build Encrypted File ---------- */

function buildEncryptedFile(

    salt,

    iv,

    encrypted

) {

    return mergeBuffers(

        encoder.encode(HEADER),

        salt,

        iv,

        new Uint8Array(encrypted)

    );

}

/* ---------- Parse Encrypted File ---------- */

function parseEncryptedFile(buffer) {

    const bytes =

        new Uint8Array(buffer);

    const header =

        decoder.decode(

            bytes.slice(0, 4)

        );

    if (header !== HEADER) {

        throw new Error(

            "Invalid encrypted file."

        );

    }

    const salt =

        bytes.slice(

            4,

            4 + SALT_LENGTH

        );

    const iv =

        bytes.slice(

            4 + SALT_LENGTH,

            4 + SALT_LENGTH + IV_LENGTH

        );

    const data =

        bytes.slice(

            4 + SALT_LENGTH + IV_LENGTH

        );

    return {

        salt,

        iv,

        data

    };

}

/* ---------- Shared Encrypt Helper ---------- */

async function encryptBuffer(buffer, password) {

    const salt = randomBytes(SALT_LENGTH);

    const iv = randomBytes(IV_LENGTH);

    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(

        {

            name: "AES-GCM",

            iv

        },

        key,

        buffer

    );

    return buildEncryptedFile(salt, iv, encrypted);

}

/* ---------- Encrypt Single File ---------- */

async function encryptFile(file, password) {

    try {

        setBusy(true);

        setStatus(

            "Reading file..."

        );

        resetProgress();

        const buffer =

            await readFile(file);

        setProgress(20);

        setStatus(

            "Generating encryption key..."

        );

        const output = await encryptBuffer(buffer, password);

        setProgress(80);

        const blob =

            new Blob(

                [output],

                {

                    type:

                    "application/octet-stream"

                }

            );

        const filename =

            buildEncryptedName(

                getRelativePath(file)

            );

        setOutput(

            blob,

            filename

        );

        completeProgress();

        setStatus(

            "File encrypted successfully."

        );

        return true;

    }

    catch (error) {

        console.error(error);

        clearOutput();

        setStatus(

            "Encryption failed."

        );

        return false;

    }

    finally {

        setBusy(false);

    }

}

/* ---------- Encrypt Multiple Files to ZIP ---------- */

async function encryptFiles(files, password) {

    try {

        setBusy(true);

        setStatus("Preparing files...");

        resetProgress();

        const entries = [];
        const total = files.length;

        for (let index = 0; index < total; index += 1) {

            const file = files[index];

            setStatus(
                `Encrypting ${index + 1} of ${total}...`
            );

            const buffer = await readFile(file);
            const output = await encryptBuffer(buffer, password);

            entries.push({

                name: buildEncryptedName(getRelativePath(file)),

                blob: new Blob([output], {

                    type: "application/octet-stream"

                })

            });

            setProgress(Math.round(((index + 1) / total) * 90));

        }

        const zipBlob = await createZipBlob(entries);

        setOutput(zipBlob, "encrypted_files.zip");

        completeProgress();

        setStatus("Files encrypted and packed into a ZIP archive.");

        return true;

    }

    catch (error) {

        console.error(error);

        clearOutput();

        setStatus("Encryption failed.");

        return false;

    }

    finally {

        setBusy(false);

    }

}

/* ---------- Decrypt ---------- */

async function decryptFile(file, password) {

    try {

        setBusy(true);

        setStatus(

            "Reading encrypted file..."

        );

        resetProgress();

        const buffer =

            await readFile(file);

        setProgress(20);

        const {

            salt,

            iv,

            data

        } = parseEncryptedFile(buffer);

        setStatus(

            "Generating decryption key..."

        );

        const key =

            await deriveKey(

                password,

                salt

            );

        setProgress(45);

        setStatus(

            "Decrypting..."

        );

        const decrypted =

            await crypto.subtle.decrypt(

                {

                    name: "AES-GCM",

                    iv

                },

                key,

                data

            );

        setProgress(80);

        const blob =

            new Blob(

                [decrypted],

                {

                    type:

                    "application/octet-stream"

                }

            );

        const filename =

            buildDecryptedName(

                file.name

            );

        setOutput(

            blob,

            filename

        );

        completeProgress();

        setStatus(

            "File decrypted successfully."

        );

        return true;

    }

    catch (error) {

        console.error(error);

        clearOutput();

        setStatus(

            "Incorrect password or corrupted file."

        );

        return false;

    }

    finally {

        setBusy(false);

    }

}

/* ---------- Mode Helper ---------- */

async function processFiles(files, password) {

    if (State.mode === "encrypt") {

        return encryptFiles(files, password);

    }

    return decryptFile(files[0], password);

}

async function processFile(file, password) {

    return processFiles([file], password);

}

/* ---------- Validation ---------- */

function isEncryptedFile(file) {

    return file.name.endsWith(

        ".sfe"

    );

}

/* ---------- Cleanup ---------- */

function clearCryptoState() {

    State.encryptedBlob = null;

    State.decryptedBlob = null;

}

/* ---------- Export ---------- */

window.encryptFile = encryptFile;

window.decryptFile = decryptFile;

window.processFile = processFile;

window.processFiles = processFiles;
