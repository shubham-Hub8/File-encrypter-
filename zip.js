/* ==========================================
   Simple File Encryptor
   ZIP Builder
========================================== */

"use strict";

const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;

const zipTextEncoder = new TextEncoder();

let zipCrcTable = null;

function buildCrc32Table() {

    if (zipCrcTable) {
        return zipCrcTable;
    }

    const table = new Uint32Array(256);

    for (let n = 0; n < 256; n += 1) {

        let c = n;

        for (let k = 0; k < 8; k += 1) {

            c = (c & 1)
                ? (0xEDB88320 ^ (c >>> 1))
                : (c >>> 1);

        }

        table[n] = c >>> 0;

    }

    zipCrcTable = table;
    return table;

}

function crc32(bytes) {

    const table = buildCrc32Table();

    let crc = 0xFFFFFFFF;

    for (let i = 0; i < bytes.length; i += 1) {

        crc = table[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);

    }

    return (crc ^ 0xFFFFFFFF) >>> 0;

}

function toUint8(value) {

    return value & 0xFF;

}

function u16(value) {

    return [toUint8(value), toUint8(value >>> 8)];

}

function u32(value) {

    return [
        toUint8(value),
        toUint8(value >>> 8),
        toUint8(value >>> 16),
        toUint8(value >>> 24)
    ];

}

function textBytes(text) {

    return zipTextEncoder.encode(text);

}

function concatBytes(chunks) {

    let total = 0;

    for (const chunk of chunks) {
        total += chunk.length;
    }

    const out = new Uint8Array(total);

    let offset = 0;

    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }

    return out;

}

async function blobToBytes(blob) {

    return new Uint8Array(await blob.arrayBuffer());

}

async function createZipBlob(entries) {

    const localChunks = [];
    const centralChunks = [];
    let offset = 0;

    for (const entry of entries) {

        const nameBytes = textBytes(entry.name);
        const dataBytes = await blobToBytes(entry.blob);
        const crc = crc32(dataBytes);
        const size = dataBytes.length;

        const localHeader = concatBytes([
            new Uint8Array(u32(ZIP_LOCAL_FILE_HEADER_SIGNATURE)),
            new Uint8Array(u16(20)),
            new Uint8Array(u16(0)),
            new Uint8Array(u16(0)),
            new Uint8Array(u16(0)),
            new Uint8Array(u16(0)),
            new Uint8Array(u32(crc)),
            new Uint8Array(u32(size)),
            new Uint8Array(u32(size)),
            new Uint8Array(u16(nameBytes.length)),
            new Uint8Array(u16(0)),
            nameBytes,
            dataBytes
        ]);

        localChunks.push(localHeader);

        const centralHeader = concatBytes([
            new Uint8Array(u32(ZIP_CENTRAL_DIRECTORY_SIGNATURE)),
            new Uint8Array(u16(20)),
            new Uint8Array(u16(20)),
            new Uint8Array(u16(0)),
            new Uint8Array(u16(0)),
            new Uint8Array(u16(0)),
            new Uint8Array(u16(0)),
            new Uint8Array(u32(crc)),
            new Uint8Array(u32(size)),
            new Uint8Array(u32(size)),
            new Uint8Array(u16(nameBytes.length)),
            new Uint8Array(u16(0)),
            new Uint8Array(u16(0)),
            new Uint8Array(u16(0)),
            new Uint8Array(u16(0)),
            new Uint8Array(u32(0)),
            new Uint8Array(u32(offset)),
            nameBytes
        ]);

        centralChunks.push(centralHeader);

        offset += localHeader.length;

    }

    const centralDirectory = concatBytes(centralChunks);

    const endRecord = concatBytes([
        new Uint8Array(u32(ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(entries.length)),
        new Uint8Array(u16(entries.length)),
        new Uint8Array(u32(centralDirectory.length)),
        new Uint8Array(u32(offset)),
        new Uint8Array(u16(0))
    ]);

    return new Blob([
        concatBytes(localChunks),
        centralDirectory,
        endRecord
    ], {
        type: "application/zip"
    });

}

window.createZipBlob = createZipBlob;
