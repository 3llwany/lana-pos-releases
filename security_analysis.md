# 🔐 Security Measures - Lana POS System
> تحليل شامل لكل وسائل الأمان المستخدمة في النظام (Web & Electron)

---

## 1. 🔑 Authentication (المصادقة)

### JWT Token Authentication
- **Algorithm:** `HMAC-SHA256` لتوقيع التوكن
- **Validation:** يتم التحقق من `Issuer`, `Audience`, و `Signing Key` عند كل ريكوست
- **Expiry:** التوكن بيتنهي بعد **12 ساعة** (`DateTime.UtcNow.AddHours(12)`)
- **ClockSkew:** مضبوط على `TimeSpan.Zero` (مفيش تسامح في الوقت)
- **Claims المخزنة:**
  - `userId` - معرف المستخدم
  - `username` - اسم المستخدم
  - `role` - الدور
  - `roleId` - معرف الدور
  - `isSystemAdmin` - هل مدير نظام
  - `branchId` - الفرع الحالي

### Password Hashing
- **Algorithm:** `SHA-256` + Fixed Salt (`LanaSoft_POS_Secure_Salt_2026`)
- الباسورد **مش بيتخزن نص عادي** أبداً، بيتخزن كـ Hash

### Auto-Logout on Token Expiry
- الفرونت إند بيتشيك صلاحية التوكن عن طريق فحص `exp` claim
- لو التوكن expired → logout تلقائي ورجوع لصفحة Login

---

## 2. 🛡️ Authorization (التفويض والصلاحيات)

### طبقات التحكم في الصلاحيات

| الطبقة | الوصف | الملف |
|--------|-------|-------|
| **Backend `[Authorize]`** | كل الـ Controllers محمية بـ JWT authentication | كل Controllers |
| **`RequirePermissionAttribute`** | Custom attribute للتحقق من صلاحيات محددة على مستوى كل endpoint | [RequirePermissionAttribute.cs](file:///w:/WEB/sales/pos.Api/Features/Auth/Attributes/RequirePermissionAttribute.cs) |
| **`RequireAdminRole` Policy** | بوليسي مخصصة للأدمن فقط | [Program.cs](file:///w:/WEB/sales/pos.Api/Program.cs#L83-L86) |
| **Frontend Route Guards** | 6 أنواع مختلفة من ال Guards | [auth.guard.ts](file:///w:/WEB/sales/pos-ui/src/app/core/guards/auth.guard.ts) |
| **UI Permission Directive** | `*hasPermission` directive لإخفاء عناصر واجهة المستخدم | [has-permission.directive.ts](file:///w:/WEB/sales/pos-ui/src/app/core/directives/has-permission.directive.ts) |

### Route Guards (حماية الراوتات) - Frontend

```
1. authGuard          → هل المستخدم مسجل دخول؟
2. guestGuard         → إعادة توجيه المسجلين عن صفحة Login
3. permissionGuard    → هل عنده الصلاحيات المطلوبة؟
4. routeAccessGuard   → هل مسموحله يدخل الشاشة دي؟
5. adminGuard         → هل هو أدمن؟
6. branchSelectedGuard → هل اختار فرع؟
```

### نظام الصلاحيات (RBAC - Role-Based Access Control)
- كل مستخدم مربوط بـ **Role**
- كل Role فيه مجموعة **Permissions**
- كل Permission مربوط بـ **Screen** معينة
- الأدمن (`isSystemAdmin`) عنده كل الصلاحيات تلقائياً
- **Dynamic Menu:** القوائم بتظهر بناءً على `allowedScreens` فقط

---

## 3. 🌐 HTTP Security

### Auth Interceptor (Frontend)
- كل HTTP request (ماعدا `/auth/login`) بيتبعت معاه `Authorization: Bearer <token>` header
- لو السيرفر رجّع `401` → Logout تلقائي وتوجيه لـ Login
- لو السيرفر رجّع `403` → توجيه لصفحة Unauthorized

### Error Interceptor (Frontend)
- معالجة **كل** أنواع الأخطاء HTTP مع رسائل مناسبة
- عدم تسريب تفاصيل أخطاء تقنية للمستخدم
- في `Release mode` الأخطاء الداخلية مش بتظهر للمستخدم

### Global Exception Middleware (Backend)
- **Central error handler** بيحمي كل الـ API
- الأخطاء المتوقعة بيرجعها بـ status codes صحيحة
- الأخطاء الغير متوقعة (**500**) → رسالة عامة + logging
- في `DEBUG` mode فقط بيرجع stack trace

### CORS Protection
- الـ CORS مضبوط على origins **محددة** (مش `*`)
- Default: `http://localhost:3200`, `http://localhost:5173`
- قابل للتعديل من `appsettings.json → Cors:AllowedOrigins`

---

## 4. 📋 Audit Trail (سجل المراجعة)

### Automatic Entity Auditing
- كل **Create, Update, Delete** على أي entity بيتسجل تلقائي
- البيانات المسجلة:
  - `UserId` + `Username` - مين عمل التغيير
  - `BranchId` - من أي فرع
  - `Action` - Create / Update / Delete
  - `EntityName` + `EntityId` - مين الكيان اللي اتأثر
  - `OldValues` + `NewValues` - القيم القديمة والجديدة
  - `ChangedColumns` - الأعمدة اللي اتغيرت
  - `Timestamp` - التوقيت بالضبط

### Login/Logout Auditing
- كل عملية Login بتتسجل بـ `UserId`, `Username`, `BranchId`, `Timestamp`
- كل عملية Logout برضو بتتسجل

---

## 5. 🔒 Electron-Specific Security (نسخة الديسكتوب)

### Context Isolation & Sandbox
```javascript
webPreferences: {
  nodeIntegration: false,      // ❌ مفيش وصول لـ Node.js من الـ Renderer
  contextIsolation: true,      // ✅ العزل الكامل بين الـ contexts
  preload: 'preload.js'        // ✅ Preload script آمن
}
```

### Preload Script (Safe IPC Bridge)
- Renderer process **مش بيقدر يوصل** لـ Node.js مباشرة
- الاتصال عبر `contextBridge.exposeInMainWorld()` فقط
- الـ API المتاحة محدودة (update functions فقط)

### Single Instance Lock
- التطبيق **مش بيفتح أكتر من مرة** على نفس الجهاز
- `app.requestSingleInstanceLock()` بيمنع الـ duplicate instances

---

## 6. 📜 License Protection (حماية الترخيص - Electron فقط)

### RSA Digital Signature
- ملف الرخصة **موقّع رقمياً** بـ RSA + SHA-256
- التحقق بيتم بالمفتاح العام (`public.key`)
- أي تعديل على ملف الرخصة → الـ signature هيكون invalid

### Machine-Locked License
- الرخصة مربوطة بـ **Machine ID** فريد لكل جهاز
- Machine ID بيتحسب من:
  - **CPU:** Manufacturer, Name, Stepping, Revision
  - **Motherboard:** Manufacturer, Product, SerialNumber
  - **System:** UUID
  - **OS:** Serial Number
- الكل بيتجمع ويتحسب منه `SHA-256 Hash`

### Anti-Tamper Storage (4 مستويات)
بيانات الترخيص بتتخزن في **4 أماكن مختلفة** للحماية من التلاعب:

| المستوى | المكان | الملاحظة |
|---------|--------|----------|
| 1️⃣ | **License File** | `system_auth.key` (اسم مموّه) |
| 2️⃣ | **Windows Registry** | تحت CLSID مموّه |
| 3️⃣ | **SQLite Database** | جدول `_SystemDiagnostics` |
| 4️⃣ | **Hidden Cache File** | `cache_0x8f23.dat` في LocalAppData |

- **Self-healing:** لو أي مستوى ناقص بيتملي تلقائي من المستويات التانية
- جميع أسماء المفاتيح **مموّهة** (مثلاً `WinDiag_X01` بدل `sys_lic`)

### Anti-Clock Tamper (مكافحة التلاعب بالوقت)
- بيخزن آخر وقت تشغيل مشفّر
- لو المستخدم رجّع الساعة أكتر من 1 ساعة → **يقفل النظام فوراً**
- الحماية دي موجودة في **النسخة التجريبية** و**الرخصة الشهرية**

### Trial Protection
- التجربة المجانية محمية بنفس نظام التخزين المتعدد
- بيانات التجربة مشفرة بـ **XOR encryption** مع Machine ID كـ key
- **15 يوم** مدة التجربة (قابلة للتعديل من الإعدادات)

---

## 7. 🛡️ File Integrity Check (فحص سلامة الملفات - Electron فقط)

### SHA-256 Checksums
- عند البناء، بيتعمل **checksum** لكل الملفات الحرجة
- الـ checksums مشفرة بـ **AES-256-CBC**
- عند كل تشغيل بيتم مطابقة checksums الملفات الحالية بالمخزنة
- لو أي ملف اتعدل أو اتحذف → **النظام يرفض يشتغل**

### Integrity Check Middleware
- بيشتغل كـ Middleware في الـ HTTP pipeline
- أي request هيتعمله **block** لو الملفات اتلاعب فيها

---

## 8. 🌍 Branch Isolation (عزل الفروع)

- كل مستخدم مربوط **بفروع محددة** مسموحله يدخلها
- لو المستخدم عنده فرع واحد → يتدخله تلقائي
- لو عنده أكتر من فرع → لازم يختار
- الـ `branchId` محفوظ في الـ JWT Token → كل العمليات مرتبطة بالفرع

---

## 9. 🔄 Auto-Update Security (Electron)

- النظام بيتشيك على تحديثات تلقائياً
- التحديثات بتنزل من سيرفر محدد
- `autoDownload: false` → المستخدم لازم يوافق على التحديث أولاً
- `electron-updater` بيتحقق من **code signing** تلقائياً

---

## 10. 📊 ملخص سريع للعميل

| الميزة الأمنية | Web | Electron |
|---------------|:---:|:--------:|
| JWT Authentication | ✅ | ✅ |
| Password Hashing (SHA-256) | ✅ | ✅ |
| RBAC (Role-Based Access Control) | ✅ | ✅ |
| Route Guards (6 أنواع) | ✅ | ✅ |
| API-Level Permission Checks | ✅ | ✅ |
| CORS Protection | ✅ | ✅ |
| Global Error Handling | ✅ | ✅ |
| Audit Trail (سجل مراجعة كامل) | ✅ | ✅ |
| Branch Isolation | ✅ | ✅ |
| Context Isolation | ❌ | ✅ |
| RSA License Verification | ❌ | ✅ |
| Machine-Lock Licensing | ❌ | ✅ |
| Anti-Clock Tamper | ❌ | ✅ |
| File Integrity Check (AES-256) | ❌ | ✅ |
| Anti-Tamper Storage (4 levels) | ❌ | ✅ |
| Auto-Update System | ❌ | ✅ |
| Single Instance Lock | ❌ | ✅ |

---

> [!TIP]
> **للعميل:** النظام يستخدم **معايير أمان صناعية** مثل JWT, SHA-256, RSA, AES-256 مع نظام صلاحيات متعدد الطبقات وسجل مراجعة شامل. نسخة Electron فيها طبقات حماية إضافية ضد التلاعب بالملفات والترخيص.
