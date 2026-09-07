SFE — Simple File Encrypter

USE: https://securefileencrypter.netlify.app/

SFE (Simple File Encrypter) is an open-source, portable file encryption tool designed to make strong file encryption simple, transparent, and easy to use.

It uses a password-based key derivation process with Argon2id, unique salts, and per-file initialization vectors (IVs) to protect encrypted files.

«Simple to use. Serious about encryption.»

---

✨ Features

- 🔐 Password-based encryption
- 🛡️ Argon2id password-based key derivation
- 🧂 Unique salts for encrypted files
- 🎲 Unique IVs for encryption operations
- 📁 Encrypt files directly from the browser interface
- 🔓 Decrypt previously encrypted files
- 👁️ Show / hide password functionality
- ⚡ Clean, lightweight interface
- 📦 Portable — no installation required
- 🌐 Designed to work locally/offline
- 🖥️ Responsive UI
- 📖 Built-in step-by-step encryption workflow
- 🔓 Open source

---

🔒 How SFE Works

SFE is designed around a simple principle:

Your password should never directly become your encryption key.

Instead, SFE derives a cryptographic key from your password using Argon2id.

The general process looks like this:

Password
   │
   ▼
Argon2id
   │
   ├── Unique Salt
   │
   ▼
Derived Encryption Key
   │
   ├── Unique IV
   │
   ▼
Encrypted File

During decryption, the information stored with the encrypted file is used to derive the same key and reverse the encryption process.

---

🧂 Salts

SFE uses a unique cryptographic salt when deriving an encryption key from a password.

A salt prevents identical passwords from producing identical derived keys across different encryption operations.

For example:

Password: mypassword

File A → Salt A → Derived Key A
File B → Salt B → Derived Key B

Even though the password is the same, the resulting derived keys are different because the salts are different.

---

🎲 Initialization Vectors

SFE also uses an initialization vector (IV) during encryption.

The IV ensures that encryption operations do not produce identical ciphertext when the same underlying data and key are used.

Conceptually:

Password
   +
Salt
   ↓
Argon2id
   ↓
Encryption Key
   +
IV
   ↓
Ciphertext

The IV is not a secret. It is stored alongside the encrypted data so that the file can be decrypted later.

---

🧭 Using SFE

SFE is intentionally structured as a simple three-step workflow.

01 — Choose Your Files

Select the file you want to encrypt or decrypt.

SFE processes the selected file locally rather than requiring you to upload it to an external encryption service.

---

02 — Set a Password

Enter the password that will be used to derive the encryption key.

You can use Show Password to verify what you've entered before starting the operation.

«Important: SFE cannot recover a forgotten password. If you lose your password, your encrypted data may be permanently inaccessible.»

---

03 — Process

Start the encryption or decryption process.

SFE derives the required key, performs the cryptographic operation, and produces the resulting file.

The interface provides feedback while the operation is being performed.

---

🛡️ Security Model

SFE is designed around the idea that encryption software should minimize unnecessary trust.

The intended model is:

Your Device
    │
    ├── Password
    │
    ├── Argon2id
    │
    ├── Salt
    │
    ├── Encryption
    │
    └── Encrypted File

There is no requirement for a remote server to receive your password or your file.

This makes SFE suitable for users who want a straightforward way to encrypt files without relying on an online file-encryption service.

---

🔑 Password Security

The security of password-based encryption depends heavily on the password you choose.

Use a password that is:

- Long
- Unique
- Difficult to guess
- Not reused on other services

Avoid:

password
123456
qwerty
yourname123

Prefer a long passphrase or randomly generated password.

For example:

correct-horse-battery-staple-example

The example above is only illustrative — do not use it as your real password.

---

⚠️ Important Security Notes

SFE is a tool for encrypting files, but encryption cannot compensate for a compromised device or an insecure password.

Keep the following in mind:

Your password matters

Argon2id makes password guessing significantly more expensive, but it cannot make a weak password strong.

Do not lose your password

There is intentionally no password recovery mechanism.

If you forget the password used to encrypt a file, SFE cannot simply reset it.

Back up important files

Encryption is not a backup system.

Keep secure backups of important encrypted files.

Verify your downloads

When distributing SFE, obtain the software from a trusted source and verify release information when available.

---

💻 Portability

SFE is designed to be portable and lightweight.

The goal is to allow users to run the application without requiring a traditional installation process.

This makes it useful for:

- Personal computers
- Portable storage
- Offline environments
- Privacy-conscious workflows
- Temporary systems

---

🌐 Offline Design

SFE is designed with local processing in mind.

Your files do not need to be sent to a third-party website simply to perform encryption.

This provides an important privacy advantage:

File
 ↓
Your Device
 ↓
Encryption
 ↓
Encrypted File

instead of:

File
 ↓
Upload to Server
 ↓
Remote Encryption
 ↓
Download

---

🧪 Project Status

SFE 2.0

This release introduces the current Argon2id-based password derivation implementation while retaining the project's lightweight interface and step-based workflow.

SFE is an open-source project and should be independently reviewed and audited before being relied upon for highly sensitive or mission-critical data.

---

🔍 Why Argon2id?

Argon2id is a password hashing / key-derivation algorithm designed to make password guessing more expensive by requiring substantial computational and memory resources.

SFE uses Argon2id specifically because password-derived encryption keys need protection against offline password-guessing attacks.

The important distinction is:

Password
   ↓
Argon2id
   ↓
Cryptographic Key
   ↓
Encryption

Argon2id is not the file encryption algorithm itself.

It is used to derive the encryption key from the user's password.

---

🧩 Project Structure

The exact structure may change between releases, but the project generally consists of:

SFE/
├── index.html
├── about.html
├── CSS / styling
├── JavaScript
├── cryptographic implementation
├── assets
└── README.md

The UI and cryptographic implementation are kept within the project so that users can inspect the source themselves.

---

🤝 Contributing

Contributions are welcome.

If you want to improve SFE:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test encryption and decryption thoroughly.
5. Test the UI on multiple browsers where possible.
6. Submit a pull request.

For cryptographic changes, please explain:

- What was changed
- Why it was changed
- What security property it improves
- How the change was tested

Do not make cryptographic changes casually.

---

🐛 Reporting Issues

If you discover a bug, open an issue with:

- Operating system
- Browser/runtime
- SFE version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Relevant console errors, if applicable

Security vulnerabilities

Please avoid publicly posting sensitive vulnerability details before they can be investigated.

If a vulnerability affects the cryptographic implementation or could compromise user data, contact the project maintainer privately where possible.

---

📜 License

SFE is open source.

See the repository's "LICENSE" file for the terms under which the project is distributed.

---

❤️ Philosophy

SFE was built around a simple idea:

«Encryption shouldn't require you to become a cryptography expert just to use it.»

The interface should be simple.

The implementation should be inspectable.

The cryptography should be taken seriously.

And the user should remain in control of their files.

---

SFE 2.0

Simple File Encrypter — Open Source • Portable • Password Based Encryption

🔐 Encrypt locally. Keep control.
