# riao-crypto

A comprehensive TypeScript cryptography library providing secure encryption, hashing, JWT management, and key generation utilities.

## Features

- **Encryption & Decryption**: RSA public-key encryption with OAEP padding and SHA-256 hashing
- **Hashing**: Secure password and data hashing with bcrypt
- **JWT Management**: Sign and verify JSON Web Tokens with HS256 and RS256 algorithms
- **Key Pair Generation**: Generate and manage RSA key pairs
- **Secret Management**: Flexible secret handling for different cryptographic algorithms
- **TypeScript Support**: Fully typed API with comprehensive type safety

## Installation

```bash
npm install @riao/crypto
```

## Getting Started

Read the [Getting Started Guide](./docs/guides/getting-started.md) to get started.

## Usage

### Encryption & Decryption

```typescript
import { generateKeyPair } from '@riao/crypto';
import { Encryptor, Decryptor } from '@riao/crypto';

const { publicKey, privateKey } = await generateKeyPair();

const encryptor = new Encryptor(publicKey);
const encrypted = encryptor.encrypt('secret message');

const decryptor = new Decryptor(privateKey);
const decrypted = decryptor.decrypt(encrypted);
```

### Hashing

```typescript
import { hashPassword, comparePassword } from '@riao/crypto';

const hashed = await hashPassword('myPassword');
const isMatch = await comparePassword('myPassword', hashed);
```

### JWT

```typescript
import { Jwt } from '@riao/crypto';

const jwt = new Jwt({ secret: 'your-secret-key' });
const token = jwt.sign({ userId: 123 }, { expiresIn: '1h' });
const payload = jwt.verify(token);
```

### Key Pair Generation

```typescript
import { generateKeyPair } from '@riao/crypto';

const { publicKey, privateKey } = await generateKeyPair();
```

For detailed guides on each module, see:

- [Encryption & Decryption Guide](./docs/guides/encryptor-decryptor-guide.md)
- [Hashing Guide](./docs/guides/hash-guide.md)
- [JWT Guide](./docs/guides/jwt-guide.md)
- [Key Pair Guide](./docs/guides/keypair-guide.md)
- [Crypto Guide](./docs/guides/crypto-guide.md)

## Documentation

- [Architecture Overview](./docs/architecture/overview.md)

## Contributing

- [Contributing Guide](./CONTRIBUTING.md)
- [Setup Guide](./docs/contributing/setup.md)
- [Development Guide](./docs/contributing/development.md)

## License

Licensed under the [MIT](LICENSE.md).
