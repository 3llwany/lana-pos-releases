# Technical Blueprint: Reporting Dashboard & Expense Analytics

**Goal**: Architect the Reporting Dashboard and Expense Analytics module adhering to the Project Constitution.

## 1. Backend Architecture (pos.Api)

We will follow the **Feature-based 3-Layer Architecture** observed in the codebase (e.g., `Sales` feature), which aligns with the Constitution's logic separation requirements.

**Location**: `w:\WEB\sales\pos.Api\Features\Reports`

### A. Data Transfer Objects (DTOs)

Create a `DTOs` folder within `Reports`.

1.  **`FinancialSummaryDto.cs`**
    - `TotalSales` (decimal)
    - `TotalPurchases` (decimal)
    - `TotalExpenses` (decimal)
    - `NetProfit` (decimal)
    - `Currency` (string)

2.  **`DailySalesDto.cs`**
    - `Date` (DateTime)
    - `TotalAmount` (decimal)
    - `TransactionCount` (int)

3.  **`ExpenseBreakdownDto.cs`**
    - `CategoryName` (string)
    - `TotalAmount` (decimal)
    - `Percentage` (double)

4.  **`LowStockDto.cs`**
    - `ProductId` (int)
    - `ProductName` (string)
    - `CurrentStock` (decimal)
    - `MinStockLevel` (decimal)

### B. Service Layer (Business Logic)

This layer handles the calculation logic, specifically the "Net Profit" rule and "Data Integrity".

**File**: `IReportsService.cs`

- `Task<FinancialSummaryDto> GetFinancialSummaryAsync(DateTime startDate, DateTime endDate);`
- `Task<List<DailySalesDto>> GetDailySalesAsync(DateTime startDate, DateTime endDate);`
- `Task<List<ExpenseBreakdownDto>> GetExpenseBreakdownAsync(DateTime startDate, DateTime endDate);`
- `Task<List<LowStockDto>> GetLowStockAlertsAsync(int branchId);`

**File**: `ReportsService.cs`

- **Dependencies**: `PosDbContext` (injected).
- **Logic**:
  - **Net Profit**:
    - Sum `SaleInvoice` (Credits) where `!IsDeleted`.
    - Sum `PurchaseInvoice` (Debits) where `!IsDeleted`.
    - Sum `Expense` (Debits).
    - Result = `TotalSales - (TotalPurchases + TotalExpenses)`.
  - **Security**: Ensure all DB queries implicitly use the Global Query Filter for `BranchId`.
  - **Low Stock**: Query `BranchProductStock` joined with `Product` where `Quantity <= MinStockLevel`.

### C. Web API (Controllers)

**File**: `ReportsController.cs`

- **Dependencies**: `IReportsService` (injected).
- **Security**: Apply `[Authorize(Roles = "Admin")]` to the entire controller or specific financial methods.
- **Endpoints**:
  - `GET /api/reports/financial-summary?start=...&end=...`
  - `GET /api/reports/daily-sales?start=...&end=...`
  - `GET /api/reports/expenses-breakdown?start=...&end=...`
  - `GET /api/reports/low-stock`

---

## 2. Frontend Architecture (pos-ui)

**Location**: `w:\WEB\sales\pos-ui\src\app\features\reports`

### A. Services

**File**: `reports.service.ts`

- Methods matching the API endpoints.
- Use `HttpClient` to fetch data.

### B. Components hierarchy

1.  **`ReportsLayoutComponent`** (Existing or New Wrapper)
    - Tabs/Navigation: "Dashboard", "Sales", "Inventory", "Financials".

2.  **`DashboardComponent`** (The main view)
    - **Layout**: CSS Grid/Flexbox (Tailwind).
    - **Sub-Components**:
      - `SummaryCardsComponent`: Displays 4 cards (Sales, Purchases, Expenses, Profit).
      - `SalesChartComponent`: PrimeNG Chart (Line/Bar) for Daily Sales.
      - `ExpensesPieChartComponent`: PrimeNG Chart (Pie/Doughnut) for Breakdown.
      - `LowStockTableComponent`: `p-table` listing low stock items.

### C. Routing

Ensure `reports.routes.ts` includes specific routes for the Dashboard.

---

## 3. Implementation Steps

1.  **Backend - DTOs & Interface**: Define the data contracts first.
2.  **Backend - Service Implementation**: Write the EF Core queries and Profit calculation logic.
3.  **Backend - Controller**: Expose the endpoints with Admin security.
4.  **Frontend - Service**: Create the Angular service.
5.  **Frontend - Components**: Build the UI components using PrimeNG and Tailwind.
6.  **Integration**: Connect UI to API and verify "Admin" access restrictions.
