/**
 * 🖥️ Machine ID Generator
 * ========================
 * Generates a unique machine fingerprint from CPU + Motherboard.
 * (Hard disk is excluded so changing it won't invalidate the license)
 *
 * Usage: node get-machine-id.js
 *
 * This is used:
 *   1. By the Electron app to generate the machine ID for the customer
 *   2. By you (developer) to test locally
 */

const crypto = require("crypto");
const si = require("systeminformation");

async function getMachineId() {
  try {
    // Get hardware identifiers (CPU + Motherboard only, NOT hard disk)
    const [cpu, system, osInfo] = await Promise.all([
      si.cpu(),
      si.system(),
      si.osInfo(),
    ]);

    const rawParts = [
      cpu.manufacturer || "",
      cpu.brand || "",
      cpu.stepping || "",
      cpu.revision || "",
      system.manufacturer || "",
      system.model || "",
      system.serial || "",
      system.uuid || "",
      osInfo.serial || "",
    ];

    // Combine and hash
    const rawString = rawParts.join("|");
    const hash = crypto.createHash("sha256").update(rawString).digest("hex");

    // Format as readable code: XXXX-XXXX-XXXX-XXXX
    const machineId = hash
      .substring(0, 16)
      .toUpperCase()
      .match(/.{4}/g)
      .join("-");

    return { machineId, rawString, hash };
  } catch (err) {
    console.error("Error getting machine ID:", err.message);
    throw err;
  }
}

// Run directly
if (require.main === module) {
  getMachineId().then(({ machineId, hash }) => {
    console.log("");
    console.log("═".repeat(45));
    console.log("  🖥️  Machine Fingerprint");
    console.log("═".repeat(45));
    console.log("");
    console.log("  Machine ID:  " + machineId);
    console.log("  Full Hash:   " + hash.substring(0, 32) + "...");
    console.log("");
    console.log("  This ID is based on: CPU + Motherboard + OS Install");
    console.log("  Changing the hard disk will NOT change this ID.");
    console.log("");
  });
}

module.exports = { getMachineId };
