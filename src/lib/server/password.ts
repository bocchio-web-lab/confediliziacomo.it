import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

const deriveKey = (password: string, salt: Buffer) =>
    new Promise<Buffer>((resolve, reject) => {
        scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, key) =>
            error ? reject(error) : resolve(key),
        );
    });

/** Returns a self-describing hash: `scrypt$<salt hex>$<key hex>`. */
export async function hashPassword(password: string) {
    const salt = randomBytes(16);
    const key = await deriveKey(password, salt);
    return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
    const [scheme, saltHex, keyHex] = storedHash.split("$");
    if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

    const expectedKey = Buffer.from(keyHex, "hex");
    const actualKey = await deriveKey(password, Buffer.from(saltHex, "hex"));
    return expectedKey.length === actualKey.length && timingSafeEqual(expectedKey, actualKey);
}
