/*
 * Simple File Encryptor 2.0
 * SFE2: Argon2id + AES-256-GCM
 *
 * Argon2id is implemented locally in js/argon2id.js from RFC 9106.
 * No external module, CDN, server, or build step is required at runtime.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SFE1_HEADER = 'SFE1';
const SFE2_HEADER = new Uint8Array([0x53, 0x46, 0x45, 0x32]); // SFE2
const SFE2_VERSION = 1;
const KDF_ARGON2ID = 1;
const AES_KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const GCM_TAG_BITS = 128;
const SFE2_HEADER_LENGTH = 46;

// RFC 9106 second recommended option for memory-constrained environments.
// Keep these values versioned in the file header so future releases can tune them.
const ARGON2_DEFAULT_MEMORY_KIB = 64 * 1024;
const ARGON2_PASSES = 3;
const ARGON2_PARALLELISM = 4;
const ARGON2_MIN_MEMORY_KIB = 12 * 1024;
const ARGON2_MAX_MEMORY_KIB = 500 * 1024;

function deriveArgon2id(password, salt, memorySize, passes, parallelism) {
    const passwordBytes = encoder.encode(password);
    const result = window.SFEArgon2id.derive(
        passwordBytes,
        salt,
        { m: memorySize, t: passes, p: parallelism },
        progress => {
            if (typeof window.setKdfProgress === "function") {
                window.setKdfProgress(progress);
            }
        }
    );

    if (!(result instanceof Uint8Array) || result.length !== KEY_LENGTH) {
        throw new Error('Argon2id returned an invalid key.');
    }

    const keyPromise = crypto.subtle.importKey(
        'raw',
        result,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    passwordBytes.fill(0);
    result.fill(0);

    return keyPromise;
}

function buildSfe2Header(salt, iv, memorySize) {
    return concatBytes(
        SFE2_HEADER,
        new Uint8Array([SFE2_VERSION]),
        new Uint8Array([KDF_ARGON2ID]),
        writeU32LE(memorySize),
        writeU32LE(ARGON2_PASSES),
        writeU32LE(ARGON2_PARALLELISM),
        salt,
        iv
    );
}

function parseSfe2(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < SFE2_HEADER_LENGTH + 16) {
        throw new Error('Encrypted file is truncated.');
    }
    if (!constantTimeEqual(bytes.slice(0, 4), SFE2_HEADER)) {
        throw new Error('Invalid SFE2 file.');
    }

    const version = bytes[4];
    const kdf = bytes[5];
    const memorySize = readU32LE(bytes, 6);
    const passes = readU32LE(bytes, 10);
    const parallelism = readU32LE(bytes, 14);
    const salt = bytes.slice(18, 34);
    const iv = bytes.slice(34, 46);

    if (version !== SFE2_VERSION || kdf !== KDF_ARGON2ID) {
        throw new Error('Unsupported SFE2 version or KDF.');
    }
    if (memorySize < 8 * parallelism || memorySize < ARGON2_MIN_MEMORY_KIB || memorySize > ARGON2_MAX_MEMORY_KIB || passes < 1 || passes > 32 || parallelism < 1 || parallelism > 16) {
        throw new Error('Invalid Argon2id parameters.');
    }

    return { header: bytes.slice(0, 46), salt, iv, data: bytes.slice(46), memorySize, passes, parallelism };
}

// SFE1 remains decryptable for migration. New encryption always creates SFE2.
async function decryptSfe1(buffer, password) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4 + 16 + 12 + 16) throw new Error('Encrypted file is truncated.');
    const header = decoder.decode(bytes.slice(0, 4));
    if (header !== SFE1_HEADER) throw new Error('Invalid encrypted file.');
    const salt = bytes.slice(4, 20);
    const iv = bytes.slice(20, 32);
    const data = bytes.slice(32);

    const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 250000 },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
}

async function encryptBuffer(buffer, password, memorySize) {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const header = buildSfe2Header(salt, iv, memorySize);
    const key = await deriveArgon2id(password, salt, memorySize, ARGON2_PASSES, ARGON2_PARALLELISM);

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: header, tagLength: GCM_TAG_BITS },
        key,
        buffer
    );

    return concatBytes(header, new Uint8Array(encrypted));
}

async function decryptBuffer(buffer, password) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4) throw new Error('Encrypted file is truncated.');

    const magic = decoder.decode(bytes.slice(0, 4));
    if (magic === SFE1_HEADER) return decryptSfe1(buffer, password);
    if (magic !== 'SFE2') throw new Error('Unsupported encrypted file format.');

    const parsed = parseSfe2(buffer);
    const key = await deriveArgon2id(password, parsed.salt, parsed.memorySize, parsed.passes, parsed.parallelism);

    return crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: parsed.iv, additionalData: parsed.header, tagLength: GCM_TAG_BITS },
        key,
        parsed.data
    );
}

async function encryptFile(file, password) {
    try {
        setBusy(true);
        setStatus('Reading file...');
        resetProgress();
        const buffer = await file.arrayBuffer();
        setProgress(15);
        setStatus(`Deriving Argon2id key (${formatArgon2Memory(getSelectedArgon2Memory())})...`);
        const output = await encryptBuffer(buffer, password, getSelectedArgon2Memory());
        setProgress(85);
        const blob = new Blob([output], { type: 'application/octet-stream' });
        setOutput(blob, buildEncryptedName(getRelativePath(file)));
        completeProgress();
        setStatus('File encrypted successfully with SFE2.');
        return true;
    } catch (error) {
        console.error(error);
        clearOutput();
        setStatus('Encryption failed.');
        return false;
    } finally {
        setBusy(false);
    }
}

async function encryptFiles(files, password) {
    try {
        setBusy(true);
        setStatus('Preparing files...');
        resetProgress();
        const entries = [];
        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            setStatus(`Encrypting ${index + 1} of ${files.length}...`);
            const buffer = await file.arrayBuffer();
            const output = await encryptBuffer(buffer, password, getSelectedArgon2Memory());
            entries.push({
                name: buildEncryptedName(getRelativePath(file)),
                blob: new Blob([output], { type: 'application/octet-stream' })
            });
            setProgress(Math.round(((index + 1) / files.length) * 90));
        }
        const zipBlob = await createZipBlob(entries);
        setOutput(zipBlob, 'encrypted_files_sfe2.zip');
        completeProgress();
        setStatus('Files encrypted with SFE2 and packed into a ZIP archive.');
        return true;
    } catch (error) {
        console.error(error);
        clearOutput();
        setStatus('Encryption failed.');
        return false;
    } finally {
        setBusy(false);
    }
}

function parsedMemoryHint(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length >= SFE2_HEADER_LENGTH && decoder.decode(bytes.slice(0, 4)) === 'SFE2') {
        return readU32LE(bytes, 6);
    }
    return ARGON2_DEFAULT_MEMORY_KIB;
}

function formatArgon2Memory(kib) {
    return `${Math.round(kib / 1024)} MiB`;
}

window.setKdfProgress = progress => {
    setProgress(15 + Math.min(70, progress * 70));
};

async function decryptFile(file, password) {
    try {
        setBusy(true);
        setStatus('Reading encrypted file...');
        resetProgress();
        const buffer = await file.arrayBuffer();
        setProgress(15);
        setStatus(`Deriving Argon2id decryption key (${formatArgon2Memory(parsedMemoryHint(buffer))})...`);
        const decrypted = await decryptBuffer(buffer, password);
        setProgress(85);
        setOutput(new Blob([decrypted], { type: 'application/octet-stream' }), buildDecryptedName(file.name));
        completeProgress();
        setStatus('File decrypted successfully.');
        return true;
    } catch (error) {
        console.error(error);
        clearOutput();
        setStatus('Incorrect password or corrupted/unsupported file.');
        return false;
    } finally {
        setBusy(false);
    }
}

async function processFiles(files, password) {
    return State.mode === 'encrypt' ? encryptFiles(files, password) : decryptFile(files[0], password);
}

async function processFile(file, password) {
    return processFiles([file], password);
}

window.encryptFile = encryptFile;
window.decryptFile = decryptFile;
window.processFile = processFile;
window.processFiles = processFiles;
window.SFE2 = Object.freeze({
    version: SFE2_VERSION,
    kdf: 'Argon2id',
    memoryKiB: ARGON2_DEFAULT_MEMORY_KIB,
    passes: ARGON2_PASSES,
    parallelism: ARGON2_PARALLELISM
});
