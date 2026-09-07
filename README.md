# SFE2 release verification

The release was verified before packaging.

## Cryptographic checks

- RFC 9106 Argon2id version 1.3 test vector: **PASS**
  - 32 KiB memory
  - 3 passes
  - 4 lanes
  - 32-byte tag
  - password/salt/secret/associated-data vector from RFC 9106 §5.3
  - derived tag: `0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659`
- 64 MiB / 3-pass / 4-lane Argon2id derivation: **PASS**
- AES-256-GCM round-trip with the SFE2 header as AAD: **PASS**
- SFE2 header authentication and ciphertext authentication are enforced by AES-GCM.
- Existing SFE1 compatibility path remains present.

## Release checks

- All JavaScript source files pass Node syntax validation.
- No runtime npm dependency, CDN, server, or module import is required.
- `index.html` is the application entry point.
- Argon2id memory choices: 12, 32, 64, 128, 256, and 500 MiB.
- Decryption takes Argon2id parameters from the authenticated SFE2 header rather than the current UI selection.
- SFE2 decryption rejects parameters above the supported 500 MiB release ceiling to limit memory-exhaustion abuse.

This is a browser application and has not undergone an independent cryptographic security audit.
