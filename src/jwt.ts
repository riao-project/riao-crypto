import * as jwt from 'jsonwebtoken';
import ms from 'ms';

import { Secret, SecretAlgorithm } from './secret';
import { KeyPair, KeyPairAlgorithm } from './keypair';
import { createSecretKey, KeyObject } from 'crypto';
import { Buffer } from 'buffer';

export type JwtPayload = Record<string, unknown>;

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
			notBefore: this.notBefore ?? '1s',
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

	public async decodeToken(token: string): Promise<TPayload> {
		const result = await jwt.verify(token, this.publicKey, {
			algorithms: [this.algorithm as jwt.Algorithm],
		});

		if (typeof result === 'string') {
			throw new Error('Invalid token: payload is a string');
		}

		delete result['iat'];
		delete result['nbf'];
		delete result['exp'];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return result as any as TPayload;
	}
}
