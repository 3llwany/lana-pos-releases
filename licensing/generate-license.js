/**
 * 🔐 License Generator CLI
 * ========================
 * Generate signed license files for customers.
 *
 * Usage:
 *   node generate-license.js --machine "XK7F-9M2P-4RTS" --name "محل أبو أحمد" --months 12
 *
 * Options:
 *   --machine, -m    Machine ID from the customer (required)
 *   --name, -n       Customer name (required)
 *   --months         License duration in months (default: 12)
 *   --devices, -d    Max allowed devices/connections (default: 3)
 *   --features, -f   Comma-separated features (default: all)
 *   --output, -o     Output file path (default: ./licenses/<name>.key)
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const chalk = require("chalk");

program
  .requiredOption("-m, --machine <id>", "Machine ID from the customer")
  .requiredOption("-n, --name <name>", "Customer name")
  .option("--months <number>", "License duration in months", "12")
  .option("-d, --devices <number>", "Max allowed devices/connections", "3")
  .option(
    "-f, --features <list>",
    "Comma-separated features",
    "pos,inventory,employees,accounting,reports,customers",
  )
  .option("-o, --output <path>", "Output file path")
  .parse();

const opts = program.opts();

// Load private key
const privateKeyPath = path.join(__dirname, "keys", "private.key");
if (!fs.existsSync(privateKeyPath)) {
  console.log(
    chalk.red('❌ Private key not found! Run "node generate-keys.js" first.'),
  );
  process.exit(1);
}
const privateKey = fs.readFileSync(privateKeyPath, "utf8");

// Generate license ID
const licenseId = `LIC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

// Calculate dates
const issuedAt = new Date().toISOString().split("T")[0];
const expiresAt = new Date(
  Date.now() + parseInt(opts.months) * 30 * 24 * 60 * 60 * 1000,
)
  .toISOString()
  .split("T")[0];

// Build license data
const licenseData = {
  licenseId,
  customerName: opts.name,
  machineId: opts.machine,
  maxDevices: parseInt(opts.devices),
  features: opts.features.split(",").map((f) => f.trim()),
  issuedAt,
  expiresAt,
};

// Sign the license data
const dataString = JSON.stringify(licenseData, null, 0); // Compact JSON for signing
const sign = crypto.createSign("SHA256");
sign.update(dataString);
sign.end();
const signature = sign.sign(privateKey, "base64");

// Final license object
const license = {
  ...licenseData,
  signature,
};

// Create licenses directory
const licensesDir = path.join(__dirname, "licenses");
if (!fs.existsSync(licensesDir)) {
  fs.mkdirSync(licensesDir, { recursive: true });
}

// Save license file
const safeName = opts.name
  .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, "")
  .replace(/\s+/g, "_");
const outputPath = opts.output || path.join(licensesDir, `${safeName}.key`);
fs.writeFileSync(outputPath, JSON.stringify(license, null, 2), "utf8");

// Display summary
console.log("");
console.log(chalk.green("═".repeat(50)));
console.log(chalk.green.bold("  ✅ License Generated Successfully!"));
console.log(chalk.green("═".repeat(50)));
console.log("");
console.log(chalk.white("  License ID:    ") + chalk.cyan(licenseId));
console.log(chalk.white("  Customer:      ") + chalk.cyan(opts.name));
console.log(chalk.white("  Machine ID:    ") + chalk.cyan(opts.machine));
console.log(chalk.white("  Max Devices:   ") + chalk.cyan(opts.devices));
console.log(chalk.white("  Features:      ") + chalk.cyan(opts.features));
console.log(chalk.white("  Issued:        ") + chalk.cyan(issuedAt));
console.log(chalk.white("  Expires:       ") + chalk.cyan(expiresAt));
console.log("");
console.log(chalk.white("  📁 File: ") + chalk.yellow(outputPath));
console.log("");
console.log(chalk.gray("  Send this .key file to the customer."));
console.log("");
