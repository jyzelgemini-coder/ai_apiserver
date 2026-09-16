/**
 * Client-Side End-to-End Encryption (E2EE) Engine
 * Implements PBKDF2 key derivation and AES-GCM 256-bit authenticated encryption
 * using the standard browser Web Crypto API (window.crypto.subtle).
 */

import { EncryptedPayload } from '../types';

// Helper: Convert ArrayBuffer to Base64 string
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 string to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive AES-GCM 256-bit key from passphrase and salt
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Compute a friendly public fingerprint from passphrase for visual key verification
export async function computeKeyFingerprint(passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(passphrase));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `SHA256:${hex.slice(0, 8)}...${hex.slice(-8)}`;
}

// Encrypt JSON serializable data using AES-GCM
export async function encryptData<T>(data: T, passphrase: string): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const plainBytes = encoder.encode(JSON.stringify(data));

  // Generate 16 bytes salt for PBKDF2
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  // Generate 12 bytes IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plainBytes
  );

  return {
    version: 1,
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(ciphertextBuffer),
    timestamp: new Date().toISOString(),
  };
}

// Decrypt AES-GCM payload using passphrase
export async function decryptData<T>(payload: EncryptedPayload, passphrase: string): Promise<T> {
  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, salt);

  const plainBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    ciphertext as BufferSource
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(plainBuffer);
  return JSON.parse(jsonString) as T;
}
