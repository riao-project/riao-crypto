import * as crypto from 'crypto';
import { Buffer } from 'buffer';

const OAEP_PADDING = crypto.constants.RSA_PKCS1_OAEP_PADDING;
const OAEP_HASH = 'sha256';

export function encrypt(
	publicKey: crypto.KeyObject,
	data: string | Buffer
): Buffer {
	data = Buffer.isBuffer(data) ? data : Buffer.from(data);
	return crypto.publicEncrypt(
		{
			key: publicKey,
			padding: OAEP_PADDING,
			oaepHash: OAEP_HASH,
		},
		data
	);
}

export function decrypt(
	privateKey: crypto.KeyObject,
	encryptedData: Buffer
): Buffer {
	return crypto.privateDecrypt(
		{
			key: privateKey,
			padding: OAEP_PADDING,
			oaepHash: OAEP_HASH,
		},
		encryptedData
	);
}

export class Encryptor {
	private publicKey: crypto.KeyObject;

	constructor(publicKey: crypto.KeyObject) {
		this.publicKey = publicKey;
	}

	encrypt(data: string | Buffer): Buffer {
		return encrypt(this.publicKey, data);
	}
}

export class Decryptor {
	private privateKey: crypto.KeyObject;

	constructor(privateKey: crypto.KeyObject) {
		this.privateKey = privateKey;
	}

	decrypt(encryptedData: Buffer): Buffer {
		return decrypt(this.privateKey, encryptedData);
	}
}
