# Third-party notices

## Runtime cryptography

Simple File Encryptor 2.0 does not load cryptographic libraries, modules, or CDN assets at runtime. The application is self-contained and can be opened directly from `index.html`.

- **Argon2id:** RFC 9106 version 1.3 algorithm implementation included in `js/argon2id.js`.
- **AES-256-GCM:** provided by the browser's Web Crypto API.
- **Randomness:** provided by the browser's cryptographically secure `crypto.getRandomValues()` API.

The Argon2id implementation is intentionally dependency-free so the release remains portable and offline-capable.
