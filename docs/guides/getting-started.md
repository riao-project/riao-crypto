# Getting Started

Welcome to riao-crypto! This guide will help you get started with the library's core features.

## Installation

First, install the library using npm:

```bash
npm install @riao/crypto
```

## Requirements

- Node.js >= 22.0.0
- npm >= 10.8.2

## Basic Setup

Import the functions and classes you need:

```typescript
import {
  // Encryption
  Encryptor,
  Decryptor,
  encrypt,
  decrypt,
  
  // Hashing
  hashPassword,
  comparePassword,
  
  // JWT
  Jwt,
  
  // Key Pair
  generateKeyPair,
} from '@riao/crypto';
```

## Core Features

### 1. Encrypting and Decrypting Data

Use RSA encryption to securely encrypt and decrypt sensitive data.

**Generate a key pair:**

```typescript
import { generateKeyPair } from '@riao/crypto';

const { publicKey, privateKey } = await generateKeyPair();
```

**Encrypt data with the public key:**

```typescript
import { Encryptor } from '@riao/crypto';

const encryptor = new Encryptor(publicKey);
const encrypted = encryptor.encrypt('my secret message');
```

**Decrypt data with the private key:**

```typescript
import { Decryptor } from '@riao/crypto';

const decryptor = new Decryptor(privateKey);
const decrypted = decryptor.decrypt(encrypted);
console.log(decrypted.toString()); // Output: my secret message
```

### 2. Hashing Passwords

Securely hash passwords using bcrypt.

**Hash a password:**

```typescript
import { hashPassword } from '@riao/crypto';

const password = 'mySecurePassword';
const hashedPassword = await hashPassword(password);
console.log(hashedPassword);
```

**Verify a password:**

```typescript
import { comparePassword } from '@riao/crypto';

const isValid = await comparePassword('mySecurePassword', hashedPassword);
console.log(isValid); // true if password matches
```

### 3. Working with JWT Tokens

Create and verify JSON Web Tokens with automatic expiration handling.

**Using a secret key (HS256):**

```typescript
import { Jwt } from '@riao/crypto';

const jwt = new Jwt({ 
  secret: 'your-secret-key',
});

// Sign a token
const token = jwt.sign(
  { userId: 123, username: 'john' },
  { expiresIn: '1h' }
);

// Verify a token
const payload = jwt.verify(token);
console.log(payload); // { userId: 123, username: 'john' }
```

**Using a key pair (RS256):**

```typescript
import { Jwt, generateKeyPair } from '@riao/crypto';

const { publicKey, privateKey } = await generateKeyPair();

const jwt = new Jwt({
  publicKey,
  privateKey,
});

const token = jwt.sign({ userId: 456 }, { expiresIn: '24h' });
const payload = jwt.verify(token);
```

### 4. Key Pair Generation

Generate RSA key pairs for encryption and signing.

```typescript
import { generateKeyPair } from '@riao/crypto';

const { publicKey, privateKey } = await generateKeyPair();
// Share publicKey, keep privateKey secure
```

## Complete Example

Here's a complete example combining multiple features:

```typescript
import {
  generateKeyPair,
  Encryptor,
  Decryptor,
  hashPassword,
  comparePassword,
  Jwt,
} from '@riao/crypto';

async function example() {
  // 1. Generate key pair
  const { publicKey, privateKey } = await generateKeyPair();

  // 2. Encrypt a message
  const encryptor = new Encryptor(publicKey);
  const encrypted = encryptor.encrypt('confidential data');
  console.log('Encrypted:', encrypted);

  // 3. Decrypt the message
  const decryptor = new Decryptor(privateKey);
  const decrypted = decryptor.decrypt(encrypted);
  console.log('Decrypted:', decrypted.toString());

  // 4. Hash a password
  const hashedPassword = await hashPassword('userPassword');
  const isPasswordValid = await comparePassword('userPassword', hashedPassword);
  console.log('Password valid:', isPasswordValid);

  // 5. Create and verify JWT
  const jwt = new Jwt({ publicKey, privateKey });
  const token = jwt.sign(
    { userId: 1, email: 'user@example.com' },
    { expiresIn: '7d' }
  );
  const payload = jwt.verify(token);
  console.log('JWT Payload:', payload);
}

example().catch(console.error);
```

## Next Steps

- Read the [Encryption & Decryption Guide](./encryptor-decryptor-guide.md) for advanced encryption options
- Read the [Hashing Guide](./hash-guide.md) for password hashing best practices
- Read the [JWT Guide](./jwt-guide.md) for advanced JWT configuration
- Read the [Key Pair Guide](./keypair-guide.md) for key management strategies
- Check out [Architecture Overview](../architecture/overview.md) for library design details

## Troubleshooting

**"Private key required for signing"**

When using JWT with RS256, you need to provide the `privateKey` option to sign tokens.
