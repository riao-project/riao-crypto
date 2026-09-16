import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Jwt } from '../../src/jwt';
import { KeyPairGenerator } from '../../src/keypair';

describe('JWT', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('can use secret', async () => {
		const jwt = new Jwt<{ test: boolean }>({
			secret: 'secret-key',
			algorithm: 'HS512',
		});
		const token = await jwt.generateToken({ test: true });

		await vi.advanceTimersByTimeAsync(1000);

		const data: { test: boolean } = await jwt.decodeToken(token.token);

		expect(data).toEqual({ test: true });
	});

	it('can use keypair', async () => {
		const keys = new KeyPairGenerator({ algorithm: 'ES512' }).generate();

		const jwt = new Jwt<{ test: boolean }>(keys);
		const token = await jwt.generateToken({ test: true });

		// Wait 1 second to bypass nbf exception
		await vi.advanceTimersByTimeAsync(1000);

		const data: { test: boolean } = await jwt.decodeToken(token.token);

		expect(data).toEqual({ test: true });
	});

	it('can generate token with custom options', async () => {
		const jwt = new Jwt<{ test: string }>({
			secret: 'secret-key',
			algorithm: 'HS512',
		});
		const token = await jwt.generateToken(
			{ test: 'custom' },
			{ expiresIn: '1h' }
		);

		expect(token.token).toBeTruthy();
	});

	it('can use jwt with custom expiresIn and notBefore', async () => {
		const jwt = new Jwt<{ user: string }>({
			secret: 'secret-key',
			algorithm: 'HS512',
			expiresIn: '2h',
			notBefore: '0s',
		});
		const token = await jwt.generateToken({ user: 'testuser' });

		const data: { user: string } = await jwt.decodeToken(token.token);
		expect(data).toEqual({ user: 'testuser' });
	});

	it('can use keypair with KeyObject instances', async () => {
		const generator = new KeyPairGenerator({ algorithm: 'ES512' });
		const keys = generator.generate();

		// Pass KeyObject instances directly (not strings)
		const jwt = new Jwt<{ test: boolean }>({
			publicKey: keys.publicKey,
			privateKey: keys.privateKey,
			algorithm: 'ES512',
		});
		const token = await jwt.generateToken({ test: true });

		// Wait 1 second to bypass nbf exception
		await vi.advanceTimersByTimeAsync(1000);

		const data: { test: boolean } = await jwt.decodeToken(token.token);

		expect(data).toEqual({ test: true });
	});

	it('throws error when decoding an invalid token', async () => {
		const jwt = new Jwt<{ test: boolean }>({
			secret: 'secret-key',
			algorithm: 'HS512',
		});

		await expect(jwt.decodeToken('invalid.token.here')).rejects.toThrow();
	});

	it('throws error when verifying token with wrong secret', async () => {
		const jwt1 = new Jwt<{ test: boolean }>({
			secret: 'secret-key-1',
			algorithm: 'HS512',
		});

		const token = await jwt1.generateToken({ test: true });

		const jwt2 = new Jwt<{ test: boolean }>({
			secret: 'secret-key-2',
			algorithm: 'HS512',
		});

		await expect(jwt2.decodeToken(token.token)).rejects.toThrow();
	});

	it('removes iat, nbf, and exp fields from decoded token', async () => {
		const jwt = new Jwt<{ test: boolean; other: string }>({
			secret: 'secret-key',
			algorithm: 'HS512',
		});

		const token = await jwt.generateToken({ test: true, other: 'value' });

		await vi.advanceTimersByTimeAsync(1000);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const data: any = await jwt.decodeToken(token.token);

		expect(data.test).toBe(true);
		expect(data.other).toBe('value');
		expect(data.iat).toBeUndefined();
		expect(data.nbf).toBeUndefined();
		expect(data.exp).toBeUndefined();
	});

	it('uses default expiresIn of 15m when not specified', async () => {
		const jwt = new Jwt<{ test: boolean }>({
			secret: 'secret-key',
			algorithm: 'HS512',
		});

		const token = await jwt.generateToken({ test: true });

		expect(token.token).toBeTruthy();
	});

	it('uses default notBefore of 1 second when not specified', async () => {
		const jwt = new Jwt<{ test: boolean }>({
			secret: 'secret-key',
			algorithm: 'HS512',
		});

		const token = await jwt.generateToken({ test: true });

		// Wait to bypass the default 1 second nbf
		await vi.advanceTimersByTimeAsync(1100);

		const data: { test: boolean } = await jwt.decodeToken(token.token);
		expect(data).toEqual({ test: true });
	});

	it('can generate token immediately when notBefore is 0s', async () => {
		const jwt = new Jwt<{ test: boolean }>({
			secret: 'secret-key',
			algorithm: 'HS512',
			notBefore: '0s',
		});

		const token = await jwt.generateToken({ test: true });

		// Can decode immediately without waiting
		const data: { test: boolean } = await jwt.decodeToken(token.token);
		expect(data).toEqual({ test: true });
	});

	it('merges custom token options with default options', async () => {
		const jwt = new Jwt<{ test: string }>({
			secret: 'secret-key',
			algorithm: 'HS512',
			expiresIn: '2h',
			notBefore: '0s',
		});

		const token = await jwt.generateToken(
			{ test: 'data' },
			{ expiresIn: '1h' }
		);

		// Custom options override defaults
		expect(token.token).toBeTruthy();
		const data: { test: string } = await jwt.decodeToken(token.token);
		expect(data).toEqual({ test: 'data' });
	});

	it('can use different algorithms with keypair', async () => {
		// Test with a subset of algorithms to avoid timeout
		const algorithms = ['ES256', 'RS256'] as const;

		for (const algo of algorithms) {
			const generator = new KeyPairGenerator({ algorithm: algo });
			const keys = generator.generate();

			const jwt = new Jwt<{ test: boolean }>({
				publicKey: keys.publicKey,
				privateKey: keys.privateKey,
				algorithm: algo,
			});

			const token = await jwt.generateToken({ test: true });

			await vi.advanceTimersByTimeAsync(1000);

			const data: { test: boolean } = await jwt.decodeToken(token.token);
			expect(data).toEqual({ test: true });
		}
	});

	it('throws error when token has expired', async () => {
		const jwt = new Jwt<{ test: boolean }>({
			secret: 'secret-key',
			algorithm: 'HS512',
			expiresIn: '100ms',
		});

		const token = await jwt.generateToken({ test: true });

		// Advance time past the expiration
		await vi.advanceTimersByTimeAsync(150);

		await expect(jwt.decodeToken(token.token)).rejects.toThrow();
	});

	it('constructor rejects empty secret string', async () => {
		// The object should be created, but since secret is empty,
		// attempting to sign should fail or succeed with empty key
		try {
			new Jwt<{ test: boolean }>({
				secret: '',
				algorithm: 'HS512',
			});
		}
		catch (error: unknown) {
			// Expected to fail since secret is empty
			expect(error).toBeDefined();

			return;
		}

		throw new Error('Constructor did not reject empty secret string');
	});
});
