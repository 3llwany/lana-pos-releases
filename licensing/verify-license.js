/**
 * 🔐 License Verifier
 * ====================
 * Verifies a license file against the current machine.
 * This module will be used by the Electron app.
 *
 * Usage (standalone test): node verify-license.js <license-file-path>
 * Usage (as module):
 *   const { verifyLicense } = require('./verify-license');
 *   const result = await verifyLicense('/path/to/license.key');
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { getMachineId } = require("./get-machine-id");

// Public key - In production, this would be embedded in the app code
// For now, we read it from the keys directory
function getPublicKey() {
  // First try embedded key
  const embeddedKeyPath = path.join(__dirname, "keys", "public.key");
  if (fs.existsSync(embeddedKeyPath)) {
    return fs.readFileSync(embeddedKeyPath, "utf8");
  }
  throw new Error("Public key not found");
}

/**
 * Verify a license file
 * @param {string} licensePath - Path to the license.key file
 * @returns {Promise<{valid: boolean, error?: string, license?: object}>}
 */
async function verifyLicense(licensePath) {
  try {
    // 1. Read license file
    if (!fs.existsSync(licensePath)) {
      return {
        valid: false,
        error: "LICENSE_NOT_FOUND",
        message: "ملف الترخيص غير موجود",
      };
    }

    const licenseRaw = fs.readFileSync(licensePath, "utf8");
    let license;
    try {
      license = JSON.parse(licenseRaw);
    } catch {
      return {
        valid: false,
        error: "INVALID_FORMAT",
        message: "ملف الترخيص تالف أو بصيغة خاطئة",
      };
    }

    // 2. Extract signature and data
    const { signature, ...licenseData } = license;
    if (!signature) {
      return {
        valid: false,
        error: "NO_SIGNATURE",
        message: "ملف الترخيص غير موقع",
      };
    }

    // 3. Verify RSA signature
    const publicKey = getPublicKey();
    const dataString = JSON.stringify(licenseData, null, 0);
    const verify = crypto.createVerify("SHA256");
    verify.update(dataString);
    verify.end();

    const isSignatureValid = verify.verify(publicKey, signature, "base64");
    if (!isSignatureValid) {
      return {
        valid: false,
        error: "INVALID_SIGNATURE",
        message: "الترخيص مزور أو تم التلاعب به",
      };
    }

    // 4. Check expiry date
    const now = new Date();
    const expiresAt = new Date(license.expiresAt);
    if (now > expiresAt) {
      return {
        valid: false,
        error: "EXPIRED",
        message: `انتهت صلاحية الترخيص في ${license.expiresAt}`,
        license: licenseData,
      };
    }

    // 5. Verify machine ID
    const { machineId: currentMachineId } = await getMachineId();
    if (license.machineId !== currentMachineId) {
      return {
        valid: false,
        error: "MACHINE_MISMATCH",
        message: "هذا الترخيص خاص بجهاز آخر",
        currentMachineId,
        licenseMachineId: license.machineId,
      };
    }

    // 6. All checks passed!
    return {
      valid: true,
      license: licenseData,
      message: `مرحباً ${license.customerName}! الترخيص ساري حتى ${license.expiresAt}`,
    };
  } catch (err) {
    return { valid: false, error: "UNKNOWN_ERROR", message: err.message };
  }
}

// Run directly for testing
if (require.main === module) {
  const licensePath = process.argv[2];
  if (!licensePath) {
    console.log("Usage: node verify-license.js <license-file-path>");
    process.exit(1);
  }

  verifyLicense(licensePath).then((result) => {
    console.log("");
    if (result.valid) {
      console.log("✅ License is VALID!");
      console.log("   " + result.message);
      console.log("   Features: " + result.license.features.join(", "));
      console.log("   Max Devices: " + result.license.maxDevices);
    } else {
      console.log("❌ License is INVALID!");
      console.log("   Error: " + result.error);
      console.log("   " + result.message);
      if (result.currentMachineId) {
        console.log("   Your Machine ID: " + result.currentMachineId);
        console.log("   License Machine: " + result.licenseMachineId);
      }
    }
    console.log("");
  });
}

module.exports = { verifyLicense };
