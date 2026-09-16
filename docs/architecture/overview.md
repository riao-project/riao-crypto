# Architecture Overview

## Overview

riao-crypto is a modular TypeScript cryptography library built on Node.js native cryptographic APIs. It provides a high-level, type-safe interface for common cryptographic operations including encryption, hashing, JWT management, and key generation.

The library is organized into focused modules, each handling a specific cryptographic concern while maintaining a consistent API design.

## Design Principles

- **Modularity**: Each cryptographic function is isolated in its own module with a single responsibility
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Abstraction**: High-level classes wrap low-level cryptographic operations to reduce complexity
- **Flexibility**: Support for multiple algorithms and configuration options
- **Security**: Uses industry-standard algorithms (RSA, ECDSA, bcrypt) with secure defaults

## Module Structure

```
src/
├── index.ts          # Public API exports
├── crypto.ts         # RSA encryption/decryption
├── hash.ts           # Password hashing with bcrypt
├── jwt.ts            # JSON Web Token management
├── keypair.ts        # RSA/EC key pair generation
└── secret.ts         # Secret and algorithm types
```

## Core Modules

### 1. Crypto Module (`crypto.ts`)

**Purpose**: Provides RSA-based public-key encryption and decryption.

**Key Components**:

- `encrypt()` - Function to encrypt data with a public key
- `decrypt()` - Function to decrypt data with a private key
- `Encryptor` - Class wrapper for encryption operations
- `Decryptor` - Class wrapper for decryption operations

**Algorithm Details**:

- Encryption: RSA with OAEP padding and SHA-256 hashing
- Uses Node.js `crypto` module's `publicEncrypt()` and `privateDecrypt()` APIs

**Data Flow**:

```
Data (string/Buffer)
  → Convert to Buffer
  → Encrypt with public key (OAEP + SHA256)
  → Return encrypted Buffer
```

### 2. Hash Module (`hash.ts`)

**Purpose**: Provides secure password hashing and verification using bcrypt.

**Key Components**:

- `Hash` class with configurable salt rounds
- `make()` - Hash a password or string
- `check()` - Verify a string against a hash

**Configuration**:

- Default rounds: 12 (configurable per operation)
- Uses bcrypt library for secure hashing

**Data Flow**:

```
Password (string)
  → Generate salt (12 rounds by default)
  → Hash with bcrypt
  → Return hash string
```

### 3. JWT Module (`jwt.ts`)

**Purpose**: Manages JSON Web Token creation, signing, and verification.

**Key Components**:

- `Jwt<TPayload>` - Generic class for JWT operations
- `JwtOptions` - Configuration interface (supports Secret or KeyPair)
- `JwtPayload` - Type alias for token payload
- `Token` - Return type with token string

**Supported Algorithms**:

- **HS256, HS384, HS512**: HMAC with SHA (uses Secret)
- **RS256, RS384, RS512**: RSA with SHA (uses KeyPair)
- **ES256, ES384, ES512**: ECDSA with SHA (uses KeyPair)

**Key Methods**:

- `sign()` / `generateToken()` - Create and sign a JWT
- `verify()` / `decodeToken()` - Verify and decode a JWT

**Configuration Options**:

- `expiresIn` - Token expiration time (default: '15m')
- `notBefore` - Token not valid before time (default: '1s')
- `algorithm` - Signing algorithm (auto-selected based on key type)

**Data Flow**:

```
Payload (object)
  → Select algorithm (HS512 for secret, ES512 for key pair)
  → Sign with private key/secret
  → Return signed token

Token (string)
  → Verify signature with public key/secret
  → Check expiration and claims
  → Return decoded payload
```

### 4. KeyPair Module (`keypair.ts`)

**Purpose**: Generates and manages RSA and ECDSA key pairs.

**Key Components**:

- `KeyPairGenerator` - Class for generating key pairs
- `KeyPair` interface - Contains publicKey, privateKey, and algorithm
- `KeyPairAlgorithm` - Type for supported algorithms

**Supported Algorithms & Key Sizes**:

- **RSA**: RS256 (2048-bit), RS384 (3072-bit), RS512 (4096-bit)
- **ECDSA**: ES256 (prime256v1), ES384 (secp384r1), ES512 (secp521r1)

**Key Methods**:

- `generate()` - Generate a new key pair
- `save()` - Save keys to files (PEM format)
- `load()` - Load keys from files

**Data Flow**:

```
Algorithm selection (RS256 | ES256 | etc.)
  → Generate key pair with appropriate parameters
  → Return KeyPair object with public/private keys
```

### 5. Secret Module (`secret.ts`)

**Purpose**: Defines types for HMAC secret-based operations.

**Key Components**:

- `Secret` interface - Contains secret string and algorithm
- `SecretAlgorithm` - Type for HS256, HS384, HS512

**Usage**: Used primarily by the JWT module for secret-key operations.

## Data Type Relationships

```
KeyObject (from Node.js crypto)
  ├── Used by: Encryptor, Decryptor, Jwt, KeyPair
  └── Represents: Public/private cryptographic keys

Buffer
  ├── Input/output type for encrypted data
  └── Used by: encrypt(), decrypt(), Encryptor, Decryptor

JwtPayload (Record<string, unknown>)
  ├── Generic payload type for JWT tokens
  └── Used by: Jwt class

KeyPair Interface
  ├── Contains: publicKey, privateKey, algorithm
  └── Used by: JWT and Encryption operations

Secret Interface
  ├── Contains: secret (string), algorithm (SecretAlgorithm)
  └── Used by: Jwt for HMAC operations
```

## Interaction Patterns

### Pattern 1: Key Generation → Encryption

```typescript
// 1. Generate keys
const { publicKey, privateKey } = await generateKeyPair();

// 2. Encrypt with public key
const encryptor = new Encryptor(publicKey);
const encrypted = encryptor.encrypt(data);

// 3. Decrypt with private key
const decryptor = new Decryptor(privateKey);
const decrypted = decryptor.decrypt(encrypted);
```

### Pattern 2: Key Generation → JWT Signing

```typescript
// 1. Generate keys
const { publicKey, privateKey } = await generateKeyPair();

// 2. Create JWT instance
const jwt = new Jwt({ publicKey, privateKey });

// 3. Sign and verify
const token = jwt.sign(payload);
const verified = jwt.verify(token);
```

### Pattern 3: Password Hashing Flow

```typescript
// 1. Hash password on registration
const hash = await hashPassword(password);

// 2. Verify password on login
const isValid = await comparePassword(input, hash);
```

## Security Considerations

### Encryption Module

- Uses RSA OAEP padding (optimal asymmetric encryption padding) for security against padding oracle attacks
- Employs SHA-256 for OAEP hash function
- Supports variable key sizes (2048, 3072, 4096 bits)

### Hashing Module

- Uses bcrypt with 12 salt rounds by default
- Automatically handles salt generation
- Resistant to rainbow table and GPU attacks due to bcrypt's design

### JWT Module

- Supports multiple secure algorithms (HMAC, RSA, ECDSA)
- Enforces token expiration validation
- Type-safe payload handling
- Automatically selects appropriate algorithm based on key type

### KeyPair Module

- Supports industry-standard key sizes:
  - RSA: 2048, 3072, 4096 bits
  - ECDSA: prime256v1, secp384r1, secp521r1
- Keys stored in PEM format with optional encryption

## Public API Surface

The library exports all public functions and classes through `src/index.ts`:

```typescript
export * from './crypto'; // Encryptor, Decryptor, encrypt, decrypt
export * from './hash'; // Hash, hashPassword, comparePassword
export * from './jwt'; // Jwt, JwtPayload, JwtOptions, Token
export * from './keypair'; // KeyPairGenerator, generateKeyPair, KeyPair
export * from './secret'; // Secret, SecretAlgorithm
```

See [Public Exports Guide](../contributing/public-exports.md) for detailed conventions.

## Testing Architecture

Tests are organized by module:

```
test/
├── unit/
│   ├── crypto.spec.ts         # Encryption/decryption tests
│   ├── hash.spec.ts           # Password hashing tests
│   ├── jwt.spec.ts            # JWT operations tests
│   ├── keypair.spec.ts        # Key generation tests
│   └── index.spec.ts          # Integration tests
├── setup-file.ts              # Test file setup
└── setup-global.ts            # Global test configuration
```

**Test Framework**: Vitest with code coverage reporting

## Build & Distribution

### Build System

- **Bundler**: Vite
- **Output Formats**: ESM (.mjs) and CommonJS (.cjs)
- **Type Declarations**: Generated automatically (.d.ts files)

### Package Configuration

- Dual package export (ESM + CommonJS)
- TypeScript declarations included
- Node.js >= 22.0.0 required

See [Package.json Configuration](../contributing/public-exports.md) for details.

## Dependency Graph

```
crypto.ts
  ├── Node.js crypto module
  └── buffer module

hash.ts
  ├── bcrypt (npm package)

jwt.ts
  ├── jsonwebtoken (npm package)
  ├── ms (npm package for time parsing)
  ├── Node.js crypto module
  ├── secret.ts
  └── keypair.ts

keypair.ts
  ├── Node.js crypto module
  └── fs/promises module

secret.ts
  └── (No external dependencies)

index.ts
  ├── crypto.ts
  ├── hash.ts
  ├── jwt.ts
  ├── keypair.ts
  └── secret.ts
```

## Extension Points

Future extensions could include:

1. **Additional Hash Algorithms**: SHA-3, Argon2
2. **Additional Cipher Modes**: AES-GCM, ChaCha20-Poly1305
3. **Hardware Security Module (HSM) Support**: For key management
4. **Key Rotation Policies**: Automated key rotation utilities
5. **Certificate Management**: X.509 certificate handling
