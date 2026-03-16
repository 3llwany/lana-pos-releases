/**
 * 🔐 Integrity Checksums Generator
 * =================================
 * Generates SHA-256 hashes for critical backend files
 * and saves them in an encrypted checksums.dat file.
 *
 * Run after `dotnet publish` and before `electron-builder`
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const BACKEND_DIR = path.join(__dirname, "..", "pos.Api", "bin", "Publish");
const OUTPUT_FILE = path.join(BACKEND_DIR, "checksums.dat");

// Encryption key for the checksums file (derived from a passphrase)
const INTEGRITY_PASSPHRASE = "POS_INTEGRITY_2026_SECURE";

// Critical files to protect
const CRITICAL_FILES = [
  "pos.Api.dll",
  "pos.Api.exe",
  "public.key",
  "appsettings.json",
  "appsettings.Electron.json",
  "Microsoft.EntityFrameworkCore.dll",
  "Microsoft.Data.Sqlite.dll",
];

function generateFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function encryptData(data) {
  const key = crypto
    .createHash("sha256")
    .update(INTEGRITY_PASSPHRASE)
    .digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function main() {
  console.log("🔐 Generating integrity checksums...");
  console.log("──────────────────────────────────────");

  if (!fs.existsSync(BACKEND_DIR)) {
    console.error(`❌ Backend directory not found: ${BACKEND_DIR}`);
    process.exit(1);
  }

  const checksums = {};
  let count = 0;

  for (const file of CRITICAL_FILES) {
    const fullPath = path.join(BACKEND_DIR, file);
    if (fs.existsSync(fullPath)) {
      checksums[file] = generateFileHash(fullPath);
      count++;
      console.log(
        `  ✅ ${file}: ${checksums[file].substring(0, 16)}...`,
      );
    } else {
      console.log(`  ⚠️  ${file}: not found (skipped)`);
    }
  }

  // Encrypt and save
  const jsonData = JSON.stringify(checksums);
  const encrypted = encryptData(jsonData);

  fs.writeFileSync(OUTPUT_FILE, encrypted, "utf8");

  console.log("──────────────────────────────────────");
  console.log(`✅ ${count} file(s) checksummed → checksums.dat`);
}

main();
