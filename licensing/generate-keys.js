/**
 * 🔐 RSA Key Pair Generator
 * ========================
 * Run this ONCE to generate your Private/Public key pair.
 *
 * Usage: node generate-keys.js
 *
 * Output:
 *   - keys/private.key  ← SECRET! Never share this!
 *   - keys/public.key   ← Embed this in the app
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const keysDir = path.join(__dirname, "keys");

// Create keys directory
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Check if keys already exist
if (fs.existsSync(path.join(keysDir, "private.key"))) {
  console.log(
    "⚠️  Keys already exist! Delete the keys folder first if you want to regenerate.",
  );
  console.log(
    "   WARNING: Regenerating keys will invalidate ALL existing licenses!",
  );
  process.exit(1);
}

// Generate RSA 2048-bit key pair
console.log("🔐 Generating RSA 2048-bit key pair...\n");

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

// Save keys
fs.writeFileSync(path.join(keysDir, "private.key"), privateKey);
fs.writeFileSync(path.join(keysDir, "public.key"), publicKey);

console.log("✅ Keys generated successfully!\n");
console.log("📁 Files created:");
console.log("   keys/private.key  ← 🔴 SECRET! Keep this safe, never share!");
console.log("   keys/public.key   ← 🟢 Embed this in the app\n");
console.log("⚠️  IMPORTANT: Back up your private.key in a safe place!");
console.log("   If you lose it, you cannot generate new licenses.\n");
