import { rm, mkdir } from 'fs/promises';
import { join } from 'path';

// {{ remrg:task Global setup and teardown for Vitest }}

export async function setup() {
	// Recreate test/keys directory for test isolation
	const keysDir = join(process.cwd(), 'test', 'keys');

	await rm(keysDir, { recursive: true, force: true });

	await mkdir(keysDir, { recursive: true });
}

export async function teardown() {
	// Global teardown
}
