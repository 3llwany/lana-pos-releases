# Project Architecture & Business Rules Constitution

1. Architectural Standards:

- Layering: Strictly follow a 3-layer architecture: Web API (Controllers), Service Layer (Business Logic), and Data Access (EF Core).
- Dependency Injection: All services must be injected via constructors; no manual instantiation.
- Clean Code: Follow SOLID principles. Keep methods small and focused on a single responsibility.

2. Multi-Branch & Security Logic:

- Isolation: All branch-related entities (Sales, Purchases, Vault, Expenses) MUST use Global Query Filters based on BranchId from JWT Claims.
- Authorization: Financial and reporting endpoints must be restricted to the 'Admin' role using [Authorize(Roles = 'Admin')].

3. Financial & Accounting Rules (Non-Negotiable):

- Double-Entry Ledger: Every transaction (Sale, Purchase, Payment) must record a Debit and a Credit entry in the respective Ledger (Supplier/Customer).
- Vault Impact: Every cash-related movement must update the BranchVault.CurrentBalance and create a VaultTransaction record.
- Calculation Logic: Balance = Previous Balance + Debit - Credit. Use 'decimal' for all currency fields.

4. Data Integrity:

- Transactions: Any operation affecting multiple tables (e.g., Sale + Stock + Vault) must be wrapped in an IDbContextTransaction.
- Inventory: Stock quantities (Quantity) are local per branch; product definitions (Name, Price, Barcode) are global.

5. Database & Deployment Rules:

- Migrations: After any change to Entities or DbContext, a new Migration must be generated and the database updated (Update-Database).
- Descriptive Naming: Migration names must be descriptive (e.g., AddReportingTables, FixCustomerLedger).

6. Permissions & Access Control:

- Page Registration: Every new UI Screen or Module must be registered in the 'Permissions' system.
- Default Access: New financial or reporting modules must be linked to the 'Admin' role by default in the database seed/permission scripts.

7. Production Readiness & Cleanup:

- Temporary Files: Any 'SimulationControllers', 'TestEndpoints', or 'ManualSeedScripts' used to verify APIs or Permissions must be deleted immediately after verification.
- Production Safety: Strictly forbid hardcoded 'Delete All' scripts or 'Database Resets' in any service. All data operations must be targeted and safe for production environments.
- Permission Scripts: SQL scripts for registering permissions must use 'IF NOT EXISTS' logic to prevent duplication or accidental overwrites during deployment.
