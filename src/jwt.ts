import * as jwt from 'jsonwebtoken';
import ms from 'ms';

import { Secret, SecretAlgorithm } from './secret.js';
import { KeyPair, KeyPairAlgorithm } from './keypair.js';
import { createSecretKey, KeyObject } from 'crypto';
import { Buffer } from 'buffer';

export type JwtPayload = Record<string, unknown>;

export interface JwtVerificationOptions {
	issuer?: string;
	audience?: string;
}

const tokenRejectionMessages = new Set([
	'jwt must be provided',
	'jwt must be a string',
	'jwt malformed',
	'invalid token',
	'jwt signature is required',
	'invalid algorithm',
	'invalid signature',
	'invalid nbf value',
	'invalid exp value',
	'Invalid token: payload is a string',
]);

export function isTokenValidationError(error: unknown): boolean {
	if (
		error instanceof jwt.TokenExpiredError ||
		error instanceof jwt.NotBeforeError
	) {
		return true;
	}
	// jsonwebtoken also uses JsonWebTokenError for key/configuration failures.
	return (
		error instanceof jwt.JsonWebTokenError &&
		(tokenRejectionMessages.has(error.message) ||
			/^jwt (audience|issuer) invalid\. expected: /.test(error.message))
	);
}

export type JwtSigningOptions = Secret | KeyPair;

export type JwtOptions = JwtSigningOptions & {
	expiresIn?: ms.StringValue;
	notBefore?: ms.StringValue;
};

export interface Token {
	token: string;
}

export class Jwt<TPayload extends JwtPayload = JwtPayload> {
	protected publicKey: KeyObject;
	protected privateKey: KeyObject;

	protected expiresIn?: ms.StringValue;
	protected notBefore?: ms.StringValue;
	protected algorithm: SecretAlgorithm | KeyPairAlgorithm;

	public constructor(options: JwtOptions) {
		this.expiresIn = options.expiresIn ?? this.expiresIn;
		this.notBefore = options.notBefore ?? this.notBefore;
		this.algorithm =
			options.algorithm ?? ('secret' in options ? 'HS512' : 'ES512');

		if ('secret' in options && options.secret) {
			this.privateKey = this.publicKey = createSecretKey(
				Buffer.from(options.secret)
			);
		}
		else if ('privateKey' in options && options.privateKey) {
			this.publicKey = options.publicKey;
			this.privateKey = options.privateKey;
		}
		else {
			throw new Error(
				'No valid signing key provided. Please pass a secret or a key pair'
			);
		}
	}

	protected tokenOptions(): jwt.SignOptions {
		return {
			expiresIn: this.expiresIn ?? '15m',
			notBefore: this.notBefore ?? 0,
			algorithm: this.algorithm,
		};
	}

	public async generateToken(
		data: TPayload,
		options: jwt.SignOptions = {}
	): Promise<Token> {
		options = {
			...this.tokenOptions(),
			...options,
		};

		const token = await jwt.sign(data, this.privateKey, options);

		return { token };
	}

	public async decodeToken(
		token: string,
		options: JwtVerificationOptions = {}
	): Promise<TPayload> {
		let result: string | jwt.JwtPayload;
		try {
			result = jwt.verify(token, this.publicKey, {
				issuer: options.issuer,
				audience: options.audience,
				algorithms: [this.algorithm as jwt.Algorithm],
			});
		}
		catch (error) {
			// jws exposes malformed JWT JSON as a parser error, not a JWT error.
			if (error instanceof SyntaxError) {
				throw new jwt.JsonWebTokenError('invalid token', error);
			}
			if (
				error instanceof TypeError &&
				/^"ES(?:256|384|512)" signatures must be "\d+" bytes, saw "\d+"$/.test(
					error.message
				)
			) {
				throw new jwt.JsonWebTokenError('invalid signature', error);
			}

			throw error;
		}

		if (typeof result === 'string') {
			throw new jwt.JsonWebTokenError('Invalid token: payload is a string');
		}

		delete result['iat'];
		delete result['nbf'];
		delete result['exp'];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return result as any as TPayload;
	}
}
