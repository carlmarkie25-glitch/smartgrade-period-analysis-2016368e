# Lumini – School Management SaaS
## Product Requirements Document & Implementation Memory

> **FOR AI AGENTS (Claude Code):** This is your persistent memory file. Before writing any code, read this document top to bottom. Update the phase tracker checkboxes as work completes. Never deviate from the architecture defined here without flagging it first.

---

## 1. Product Overview

| Field | Value |
|---|---|
| **Product Name** | Lumini – School Management System |
| **Model** | Enterprise B2B Micro-SaaS |
| **Target Market** | K-12 schools in Liberia (and West Africa broadly) |
| **Current Stage** | Pre-build. Phase 1 starting. |
| **Last Updated** | 2026-04-17 |

### Mission
Give every Liberian school — from a small rural primary to a large city secondary — an affordable, modern management platform. Pricing is intentionally tiered to match local economic realities. The platform is **offline-first**: all core functionality works without internet, and changes sync automatically when connectivity is available. Mobile is the primary interface.

---

## 2. Pricing & Feature Tiers

> **Philosophy:** Pricing is designed for schools that operate in low-income contexts. Even the highest tier is just $2 per student per year — affordable enough that no school should be left behind on cost alone.

| Plan | Price | Effective Monthly | Billing Unit | Target School |
|---|---|---|---|---|
| **Basic** | **$0.799 / student / year** | ~$0.067 / student | Active enrolled students at time of renewal | Very small/rural schools, extremely tight budgets |
| **Standard** | **$1.299 / student / year** | ~$0.108 / student | Active enrolled students at time of renewal | Mid-size schools |
| **Premium** | **$2.00 / student / year** | ~$0.167 / student | Active enrolled students at time of renewal | Full-feature schools |

### Example Annual Cost (for context)
| School Size | Basic ($0.799) | Standard ($1.299) | Premium ($2.00) |
|---|---|---|---|
| 100 students | $79.90 / yr | $129.90 / yr | $200 / yr |
| 300 students | $239.70 / yr | $389.70 / yr | $600 / yr |
| 500 students | $399.50 / yr | $649.50 / yr | $1,000 / yr |

### Feature Gate Matrix

| Feature | Basic | Standard | Premium |
|---|---|---|---|
| Student biodata (basic fields only) | ✅ Limited | ✅ Full | ✅ Full |
| Class & teacher management | ✅ | ✅ | ✅ |
| Gradebook / Report cards | ✅ Limited | ✅ | ✅ |
| Attendance tracking | ❌ Locked | ❌ Locked | ✅ |
| Finance (Fees / Expenses / Payments) | ❌ Locked | ❌ Locked | ✅ |
| Messaging & Notifications | ❌ Locked | ❌ Locked | ✅ |
| Schedule builder | ❌ Locked | ❌ Locked | ✅ |
| Academic Calendar | ❌ Locked | ❌ Locked | ✅ |
| Analytics & Reports | ❌ Very limited | ✅ Standard | ✅ Full |
| API Access | ❌ | ❌ | ✅ |
| Custom logo/branding | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |
| **Offline mode** | ✅ All tiers | ✅ All tiers | ✅ All tiers |
| **Auto background sync** | ✅ All tiers | ✅ All tiers | ✅ All tiers |

### Billing Rules
- Billing is **annual** — schools are invoiced once per year via Stripe.
- The billable student count = **active enrolled students** at the time the annual invoice is generated (snapshot billing — not averaged over the year).
- The annual invoice amount = `active_student_count × annual_price_per_student`.
- A 14-day **free trial** is available on registration (no credit card required at signup, but card must be added before trial ends to continue).
- **No mid-year adjustments by default.** Difference reconciled at renewal time (next annual invoice).
- **Optional mid-year top-up** (Premium tier only): School admins can optionally trigger a prorated charge if they add more than 20% new students mid-year. This is manual and initiated from the billing settings page.
- **Account locking:** If the annual payment fails, the school enters a 14-day grace period with a banner warning. After 14 days with no payment, all write access is revoked (read-only mode). After 45 days, the account is suspended (login blocked). **Offline data is still accessible in read-only mode during lockout — schools never lose access to their records locally.**
- **Renewals:** Stripe automatically attempts the annual renewal charge 7 days before the subscription anniversary. A renewal reminder email is sent 30 days before renewal.
- Downgrading a plan takes effect at the **next annual renewal**, not immediately.
- Upgrading a plan takes effect **immediately** with a prorated charge for the remainder of the current annual period.

---

## 3. Technical Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | React + Vite + TypeScript | Shadcn UI components, Tailwind CSS |
| **State / Data fetching** | React Query (TanStack Query v5) | All Supabase calls go through React Query hooks |
| **Offline Storage** | **IndexedDB via Dexie.js** | Primary local data store — all writes go here first |
| **Sync Engine** | **Custom sync layer (Dexie + Supabase)** | Bidirectional sync with conflict resolution |
| **Service Worker** | **Workbox** | App shell caching, asset caching, background sync |
| **PWA** | **vite-plugin-pwa** | Installable on Android/iOS/desktop, works offline |
| **Backend / DB** | Supabase (PostgreSQL) | Use RLS for all data isolation |
| **Auth** | Supabase Auth | JWT contains `school_id` in `user_metadata`. Token cached locally for offline auth. |
| **Payments** | Stripe | Annual per-seat billing + Customer Portal + Webhooks |
| **Edge Functions** | Supabase Edge Functions (Deno) | Used for Stripe webhooks and scheduled jobs |
| **File storage** | Supabase Storage | Profile photos, school logos, documents. Cached locally via service worker. |
| **Hosting** | Vercel (frontend) | Environment vars for Supabase + Stripe keys |
| **Email** | Resend | Transactional emails (welcome, payment alerts, etc.) |
| **Error tracking** | Sentry | Frontend + Edge Function error capture |

### Key Offline-First Dependencies
```
dexie               # IndexedDB wrapper — local data store
dexie-syncable      # Sync protocol support (optional, may use custom)
workbox-webpack-plugin  # Service worker generation
vite-plugin-pwa     # PWA manifest + service worker integration
idb-keyval          # Simple key-value offline storage for settings/auth tokens
```

### Environment Variables Required
```
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # Edge Functions only, never expose to frontend

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=             # Edge Functions only
STRIPE_WEBHOOK_SECRET=         # For webhook signature verification

# Resend
RESEND_API_KEY=

# App
VITE_APP_URL=                  # e.g. https://lumini.app
```

---

## 4. Offline-First Architecture

> **Core Principle:** The app must work completely without internet. Every action a user takes (add student, mark attendance, record a grade, log a payment) is written to local IndexedDB first, then synced to Supabase when connectivity is available. Users should never see a "no connection" error blocking their work.

### 4.1 Data Flow Architecture

```
USER ACTION
    │
    ▼
IndexedDB (Dexie)          ← PRIMARY write target, always
    │
    ├── Immediate UI update (optimistic, React Query cache)
    │
    ▼
Sync Queue (pending_changes table in IndexedDB)
    │
    ├── Online?  ──YES──► Supabase (flush queue, mark synced)
    │
    └── Offline? ──────► Queue persists. Retry on reconnect.
```

### 4.2 Local Database Schema (IndexedDB via Dexie)

All data is mirrored locally. Dexie schema mirrors Supabase schema with added sync metadata:

```typescript
// src/lib/db.ts
import Dexie, { Table } from 'dexie';

export interface SyncRecord {
  _syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  _localId: string;       // Local UUID (used before server confirms)
  _updatedAt: number;     // Unix timestamp for conflict resolution
  _serverId?: string;     // UUID assigned by Supabase after sync
}

class LuminiDB extends Dexie {
  schools!: Table<School & SyncRecord>;
  students!: Table<Student & SyncRecord>;
  classes!: Table<Class & SyncRecord>;
  teachers!: Table<Profile & SyncRecord>;
  grades!: Table<Grade & SyncRecord>;
  attendance!: Table<Attendance & SyncRecord>;
  feeStructures!: Table<FeeStructure & SyncRecord>;
  feePayments!: Table<FeePayment & SyncRecord>;
  messages!: Table<Message & SyncRecord>;
  scheduleSlots!: Table<ScheduleSlot & SyncRecord>;
  academicYears!: Table<AcademicYear & SyncRecord>;
  subjects!: Table<Subject & SyncRecord>;
  pendingChanges!: Table<PendingChange>;  // Sync queue

  constructor() {
    super('LuminiDB');
    this.version(1).stores({
      schools:        '_localId, school_id, name, subscription_tier, _syncStatus',
      students:       '_localId, school_id, class_id, status, last_name, _syncStatus',
      classes:        '_localId, school_id, academic_year_id, _syncStatus',
      teachers:       '_localId, school_id, role, _syncStatus',
      grades:         '_localId, school_id, student_id, teaching_assignment_id, term, _syncStatus',
      attendance:     '_localId, school_id, student_id, class_id, date, _syncStatus',
      feeStructures:  '_localId, school_id, academic_year_id, _syncStatus',
      feePayments:    '_localId, school_id, student_id, _syncStatus',
      messages:       '_localId, school_id, sender_id, _syncStatus',
      scheduleSlots:  '_localId, school_id, class_id, day_of_week, _syncStatus',
      academicYears:  '_localId, school_id, is_current, _syncStatus',
      subjects:       '_localId, school_id, _syncStatus',
      pendingChanges: '++id, table_name, local_id, operation, created_at, retry_count',
    });
  }
}

export const db = new LuminiDB();
```

### 4.3 Pending Changes Queue

Every write operation adds an entry to `pendingChanges`:

```typescript
interface PendingChange {
  id?: number;                              // Auto-increment
  table_name: string;                       // e.g. 'students'
  local_id: string;                         // _localId of the affected record
  server_id?: string;                       // _serverId if known
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;         // The full record data
  created_at: number;                       // Timestamp
  retry_count: number;                      // Incremented on failed sync attempts
  last_error?: string;                      // Last sync error message
}
```

### 4.4 Sync Engine

```typescript
// src/lib/sync.ts

class SyncEngine {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flush();  // Sync immediately when connection restored
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Background sync every 60 seconds when online
    setInterval(() => {
      if (this.isOnline) this.flush();
    }, 60_000);
  }

  async flush() {
    if (!this.isOnline || this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const pending = await db.pendingChanges
        .orderBy('created_at')
        .filter(c => c.retry_count < 5)
        .toArray();

      for (const change of pending) {
        await this.pushChange(change);
      }

      // Pull server changes (records updated on server since last pull)
      await this.pull();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async pushChange(change: PendingChange) {
    try {
      const { data, error } = await supabase
        .from(change.table_name)
        [change.operation === 'DELETE' ? 'delete' : change.operation === 'INSERT' ? 'insert' : 'upsert'](
          change.payload
        );

      if (error) throw error;

      // Mark as synced
      await db.pendingChanges.delete(change.id!);
      await db[change.table_name as keyof LuminiDB].update(
        change.local_id,
        { _syncStatus: 'synced', _serverId: data?.[0]?.id }
      );
    } catch (err) {
      await db.pendingChanges.update(change.id!, {
        retry_count: change.retry_count + 1,
        last_error: String(err),
      });
    }
  }

  private async pull() {
    const lastPull = await idbKeyval.get('last_pull_timestamp') ?? 0;

    // Pull all tables updated since last pull
    const tables = ['students', 'classes', 'grades', 'attendance', 'feePayments', 'messages'];
    for (const table of tables) {
      const { data } = await supabase
        .from(table)
        .select('*')
        .gt('updated_at', new Date(lastPull).toISOString());

      if (data?.length) {
        // Conflict resolution: server wins if both modified (last-write-wins by updated_at)
        for (const record of data) {
          const local = await db[table].get(record.id);
          if (!local || record.updated_at > local._updatedAt) {
            await db[table].put({ ...record, _syncStatus: 'synced', _localId: record.id });
          }
        }
      }
    }

    await idbKeyval.set('last_pull_timestamp', Date.now());
  }
}

export const syncEngine = new SyncEngine();
```

### 4.5 Conflict Resolution Strategy

| Scenario | Resolution |
|---|---|
| User edits record offline, no server change | Local wins — pushed to server on reconnect |
| User edits offline, server also changed | **Last-write-wins** by `updated_at` timestamp |
| Two users on same school edit same record offline | Server record wins on next pull; user notified |
| DELETE vs UPDATE conflict | DELETE wins |
| Sync error after 5 retries | Record flagged `_syncStatus: 'error'`; admin notified in UI |

> **Note:** For most school management scenarios (single admin, teachers in their own classes), true conflicts are rare. Last-write-wins is sufficient for v1.

### 4.6 Offline Auth

Auth tokens (JWT) are cached locally so users stay logged in for up to 7 days offline:

```typescript
// On login: cache session token
await idbKeyval.set('auth_session', session);

// On app load: restore session from cache if offline
const cachedSession = await idbKeyval.get('auth_session');
if (!navigator.onLine && cachedSession) {
  supabase.auth.setSession(cachedSession);
}
```

Users see a soft banner "You're offline — changes saved locally" but can continue working normally.

### 4.7 Service Worker & Asset Caching (Workbox)

```typescript
// vite.config.ts (VitePWA plugin config)
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
        handler: 'NetworkFirst',          // Try server, fall back to cache
        options: { cacheName: 'supabase-cache', networkTimeoutSeconds: 3 },
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/,
        handler: 'CacheFirst',            // Photos/logos: prefer local cache
        options: { cacheName: 'storage-cache', expiration: { maxAgeSeconds: 86400 * 30 } },
      },
    ],
    backgroundSync: {
      name: 'lumini-bg-sync',
      options: { maxRetentionTime: 24 * 60 },  // Retry failed syncs for 24hrs
    },
  },
  manifest: {
    name: 'Lumini – School Management',
    short_name: 'Lumini',
    description: 'School management system for Liberian schools',
    theme_color: '#1a56db',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'any',                   // Works portrait AND landscape
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
})
```

### 4.8 Low-Bandwidth Optimizations

Since Liberia has poor and expensive internet, every design decision must minimize data usage:

| Optimization | Implementation |
|---|---|
| **Compressed requests** | Enable Brotli/gzip on Vercel edge; all API responses compressed |
| **Partial sync** | Pull only `updated_at > last_pull_timestamp` — never re-download full dataset |
| **Image optimization** | All photos resized to max 400×400px, compressed to WebP on upload before storage |
| **Lazy loading** | Heavy modules (analytics, schedule builder) loaded on demand, not at startup |
| **No auto-refresh** | Data is NOT auto-refreshed on timer — only re-fetched on manual action or reconnect |
| **Pagination** | All lists paginated (default 25 per page) — no infinite scroll loading 1000 records |
| **Delta sync only** | Never send full records — only changed fields on UPDATE |
| **Font subsetting** | Only load Latin character set for fonts |
| **Bundle size target** | App shell under 200KB gzipped. Use `vite-bundle-visualizer` to audit. |
| **Supabase select** | Always use `select('specific,columns')` — never `select('*')` in production |

### 4.9 Connectivity Status UI

A persistent but unobtrusive indicator appears at the top of every screen:

```
🟢 Live  — Connected, all changes synced
🟡 Syncing… — Pushing local changes (animated)
🔴 Offline — Working offline, N changes pending
⚠️  Sync Error — X records failed to sync (tap for details)
```

---

## 5. Database Architecture

> **Rule:** Every table that contains school-owned data MUST have a `school_id UUID NOT NULL REFERENCES schools(id)` column. No exceptions.

### 5.1 Core Schema

```sql
-- TENANTS
CREATE TABLE schools (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  subdomain           TEXT UNIQUE,
  logo_url            TEXT,
  country             TEXT DEFAULT 'Liberia',
  contact_email       TEXT,
  contact_phone       TEXT,
  address             TEXT,
  stripe_customer_id  TEXT UNIQUE,
  subscription_tier   TEXT CHECK (subscription_tier IN ('basic','standard','premium')) DEFAULT 'basic',
  subscription_status TEXT CHECK (subscription_status IN ('trialing','active','past_due','locked','suspended','canceled')) DEFAULT 'trialing',
  trial_ends_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  stripe_subscription_id       TEXT UNIQUE,
  stripe_subscription_item_id  TEXT UNIQUE,
  subscription_renewal_date    DATE,
  student_count_at_billing     INT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- USERS (extend Supabase auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id   UUID NOT NULL REFERENCES schools(id),
  full_name   TEXT NOT NULL,
  role        TEXT CHECK (role IN ('super_admin','school_admin','teacher','student','parent')) NOT NULL,
  avatar_url  TEXT,
  phone       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ACADEMIC YEARS
CREATE TABLE academic_years (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id),
  name        TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_current  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- CLASSES / GRADES
CREATE TABLE classes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES schools(id),
  academic_year_id UUID REFERENCES academic_years(id),
  name             TEXT NOT NULL,
  grade_level      TEXT,
  homeroom_teacher_id UUID REFERENCES profiles(id),
  capacity         INT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE students (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES schools(id),
  student_number   TEXT,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  date_of_birth    DATE,
  gender           TEXT CHECK (gender IN ('male','female','other')),
  class_id         UUID REFERENCES classes(id),
  enrollment_date  DATE,
  status           TEXT CHECK (status IN ('active','inactive','graduated','transferred','expelled')) DEFAULT 'active',
  photo_url        TEXT,
  address          TEXT,
  guardian_name    TEXT,
  guardian_phone   TEXT,
  guardian_email   TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- SUBJECTS
CREATE TABLE subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id),
  name        TEXT NOT NULL,
  code        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TEACHER-SUBJECT-CLASS assignments
CREATE TABLE teaching_assignments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES schools(id),
  teacher_id       UUID NOT NULL REFERENCES profiles(id),
  class_id         UUID NOT NULL REFERENCES classes(id),
  subject_id       UUID NOT NULL REFERENCES subjects(id),
  academic_year_id UUID REFERENCES academic_years(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, class_id, subject_id, academic_year_id)
);

-- ATTENDANCE (Premium only)
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id),
  student_id  UUID NOT NULL REFERENCES students(id),
  class_id    UUID NOT NULL REFERENCES classes(id),
  date        DATE NOT NULL,
  status      TEXT CHECK (status IN ('present','absent','late','excused')) NOT NULL,
  notes       TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, class_id, date)
);

-- GRADES / GRADEBOOK
CREATE TABLE grades (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id              UUID NOT NULL REFERENCES schools(id),
  student_id             UUID NOT NULL REFERENCES students(id),
  teaching_assignment_id UUID REFERENCES teaching_assignments(id),
  term                   TEXT,
  assessment_type        TEXT,
  score                  NUMERIC(5,2),
  max_score              NUMERIC(5,2) DEFAULT 100,
  comments               TEXT,
  graded_by              UUID REFERENCES profiles(id),
  graded_at              TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- FEES (Premium only)
CREATE TABLE fee_structures (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES schools(id),
  name             TEXT NOT NULL,
  amount           NUMERIC(10,2) NOT NULL,
  currency         TEXT DEFAULT 'USD',
  class_id         UUID REFERENCES classes(id),
  due_date         DATE,
  academic_year_id UUID REFERENCES academic_years(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fee_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES schools(id),
  student_id       UUID NOT NULL REFERENCES students(id),
  fee_structure_id UUID REFERENCES fee_structures(id),
  amount_paid      NUMERIC(10,2) NOT NULL,
  payment_date     DATE NOT NULL,
  payment_method   TEXT,
  receipt_number   TEXT,
  recorded_by      UUID REFERENCES profiles(id),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES (Premium only)
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES schools(id),
  sender_id    UUID NOT NULL REFERENCES profiles(id),
  subject      TEXT,
  body         TEXT NOT NULL,
  audience     TEXT CHECK (audience IN ('all','class','individual')),
  class_id     UUID REFERENCES classes(id),
  recipient_id UUID REFERENCES profiles(id),
  sent_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- SCHEDULE / TIMETABLE (Premium only)
CREATE TABLE schedule_slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES schools(id),
  class_id         UUID NOT NULL REFERENCES classes(id),
  subject_id       UUID NOT NULL REFERENCES subjects(id),
  teacher_id       UUID REFERENCES profiles(id),
  day_of_week      INT CHECK (day_of_week BETWEEN 1 AND 7),
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  room             TEXT,
  academic_year_id UUID REFERENCES academic_years(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOG (all tiers)
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id),
  user_id     UUID REFERENCES profiles(id),
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- BILLING SYNC LOG
CREATE TABLE billing_sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id),
  student_count   INT NOT NULL,
  tier            TEXT NOT NULL,
  amount_reported NUMERIC(10,4),
  stripe_event_id TEXT,
  synced_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Row Level Security (RLS) Strategy

**Golden Rule:** Every query is automatically filtered by the user's `school_id` from their JWT.

```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- (repeat for every table)

CREATE OR REPLACE FUNCTION get_school_id() RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'school_id')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

CREATE POLICY "school_isolation" ON students
  FOR ALL USING (school_id = get_school_id());

CREATE POLICY "teacher_class_scope" ON students
  FOR SELECT USING (
    school_id = get_school_id() AND (
      get_user_role() IN ('school_admin','super_admin')
      OR class_id IN (
        SELECT class_id FROM teaching_assignments WHERE teacher_id = auth.uid()
      )
    )
  );
```

**RLS Policies per table:**
- `schools` → School admin can only read/update their own row. Super admin has full access.
- `profiles` → Users can read profiles within their `school_id`. Only school_admin can create/update/delete.
- `students` → School admin: full CRUD. Teachers: read-only for their classes. Students/parents: read own record only.
- `grades` → Teachers: CRUD for their assigned subjects/classes. Students: read own grades only.
- `attendance` → Teachers: CRUD for their classes. Students: read own only.
- `fee_payments` → School admin: full CRUD. Parents/students: read own only.
- `messages` → Scoped to school. Senders see sent, recipients see received.
- `audit_logs` → School admin read-only. Insert via service role only.

---

## 6. Authentication & Role Architecture

### JWT User Metadata Shape
```json
{
  "school_id": "uuid-of-school",
  "role": "school_admin"
}
```
Set server-side during the onboarding flow using the **service role key** — never client-side.

### Role Permissions Summary

| Action | Super Admin | School Admin | Teacher | Student | Parent |
|---|---|---|---|---|---|
| Manage all schools | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage school settings | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage subscription/billing | ❌ | ✅ | ❌ | ❌ | ❌ |
| Add/edit/remove staff | ❌ | ✅ | ❌ | ❌ | ❌ |
| Add/edit/remove students | ❌ | ✅ | ❌ | ❌ | ❌ |
| View all students | ❌ | ✅ | Assigned classes only | ❌ | ❌ |
| Enter grades | ❌ | ✅ | Own subjects only | ❌ | ❌ |
| View grades | ❌ | ✅ | Own subjects | Own only | Child only |
| Mark attendance | ❌ | ✅ | Own classes | ❌ | ❌ |
| View attendance | ❌ | ✅ | Own classes | Own only | Child only |
| Manage fees | ❌ | ✅ | ❌ | ❌ | ❌ |
| View fee balance | ❌ | ✅ | ❌ | Own only | Child only |
| Send messages | ❌ | ✅ | To their classes | ❌ | ❌ |

---

## 7. Stripe Billing Architecture

### Products & Prices to Create in Stripe Dashboard
```
Product: Lumini Basic
  Price: $0.799/unit/year (per seat, annual)
  Metadata: tier=basic

Product: Lumini Standard
  Price: $1.299/unit/year (per seat, annual)
  Metadata: tier=standard

Product: Lumini Premium
  Price: $2.00/unit/year (per seat, annual)
  Metadata: tier=premium
```

### How Annual Per-Seat Billing Works with Stripe
1. At registration, create a Stripe subscription with **quantity = current active student count**.
2. Store `stripe_subscription_item_id` and `subscription_renewal_date` in the `schools` table.
3. At renewal time, update the subscription item quantity: `stripe.subscriptionItems.update({ quantity: newStudentCount })` before invoice finalization.
4. Stripe generates the annual invoice: `quantity × unit_price`.

### Webhook Events to Handle (Edge Function)
| Event | Action |
|---|---|
| `checkout.session.completed` | Activate subscription, update `subscription_status` to `active`, store Stripe IDs |
| `invoice.upcoming` | Update subscription item quantity with current student count, send renewal reminder |
| `invoice.created` | Log upcoming invoice amount, notify school admin |
| `invoice.paid` | Log payment, set `subscription_status = active`, update `student_count_at_billing` |
| `invoice.payment_failed` | Set `subscription_status = past_due`, send warning email |
| `customer.subscription.updated` | Update tier and renewal date in `schools` table |
| `customer.subscription.deleted` | Set status to `canceled`, lock account |
| `customer.subscription.trial_will_end` | Send reminder email 3 days before trial ends |

### Account State Machine
```
trialing → active (card added + trial not expired)
trialing → canceled (trial expired, no card)
active → past_due (annual payment fails)
past_due → active (payment succeeds within 14-day grace period)
past_due → locked (14 days no payment — read-only mode; offline data still accessible)
locked → suspended (45 days no payment — login blocked; local data preserved for export)
locked → active (payment received)
suspended → active (payment received + manual reactivation by super_admin)
active → active (annual renewal succeeds — new renewal_date, student count snapshot)
any → canceled (school requests cancellation)
```

> **Important:** Even in `locked` or `suspended` state, the locally cached app still opens and data is readable. Schools never lose access to student records due to a billing issue — they just cannot make new changes until payment is resolved.


---

## 8. Student Data Lifecycle & Retention Policy

> **Context:** In Liberian schools, student populations shift significantly every year — students graduate, transfer to other schools, drop out, or return. Keeping all records forever wastes storage, inflates billing counts if not managed carefully, and creates clutter. This section defines how Lumini handles the full arc of a student's data life.

### 8.1 Student Status Model

Every student record carries a `status` field that drives all downstream data handling:

| Status | Meaning | Counts for Billing? | Data Retained? |
|---|---|---|---|
| `active` | Currently enrolled, attending | ✅ Yes | Full access |
| `inactive` | Enrolled but not attending (e.g. temporarily away) | ✅ Yes | Full access |
| `graduated` | Completed their final year at this school | ❌ No | Retained per retention policy |
| `transferred` | Left to enroll at another school | ❌ No | Retained per retention policy |
| `expelled` | Formally removed | ❌ No | Retained per retention policy |
| `archived` | Past retention window — soft deleted | ❌ No | Anonymized summary only |

### 8.2 Three-Year Retention Policy

When a student's status changes to `graduated`, `transferred`, or `expelled`, the **3-year retention clock starts**. This mirrors standard practice in school information systems (e.g. PowerSchool, Infinite Campus) which typically retain departed student data for 3–7 years for transcript and audit purposes.

```
Student departs (status → graduated/transferred/expelled)
        │
        ├── Year 0–3: Full record retained, read-only
        │            Viewable by school admin
        │            Can generate transcripts / report cards
        │            Does NOT count toward billing
        │
        ├── Year 3 (approaching): Flagging system triggers
        │            → Email warning to school admin (90 days before)
        │            → In-app banner warning (60 days before)
        │            → Final reminder (30 days before)
        │            → Download prompt with one-click export
        │
        └── Year 3 (reached): Auto-archival
                     → Student PII anonymized
                     → Academic records summarized (final grade averages kept, row-level grades deleted)
                     → Attendance summary kept (% per term, not daily records)
                     → Fee payment records kept (financial compliance)
                     → status set to archived
                     → Record no longer visible in normal UI (only in archive view)
```

### 8.3 Database Changes for Retention

New columns added to the `students` table:

```sql
ALTER TABLE students ADD COLUMN departure_date         DATE;
ALTER TABLE students ADD COLUMN retention_expires_at   DATE
  GENERATED ALWAYS AS (departure_date + INTERVAL '3 years') STORED;
ALTER TABLE students ADD COLUMN export_reminded_at     TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN archived_at            TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN archive_summary        JSONB;
```

New table for tracking export actions:

```sql
CREATE TABLE student_data_exports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(id),
  exported_by   UUID REFERENCES profiles(id),
  export_type   TEXT CHECK (export_type IN ('single_student','class','departed_batch','full_school')),
  student_ids   UUID[],
  format        TEXT CHECK (format IN ('pdf','csv','xlsx')),
  record_count  INT,
  exported_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.4 Automated Flagging & Archival CRON Jobs

Three scheduled jobs run daily via Supabase pg_cron:

**Job 1 — 90-Day Warning**
Find departed students whose `retention_expires_at` is 90 days away and school has not been recently notified. Send email + in-app notification. Update `export_reminded_at`.

**Job 2 — 30-Day Final Warning**
Send urgent email to school admin with a one-click bulk export link for all expiring student records.

**Job 3 — Auto-Archival**
Runs daily. For any departed student past `retention_expires_at`:
- Anonymize all PII fields (`first_name` → "Archived", `last_name` → "Student", DOB/photo/address/guardian fields → NULL)
- Build and store `archive_summary` JSONB containing: student number, gender, enrollment date, departure date, final class name, grade averages by term, attendance % by term
- Delete row-level `grades` and `attendance` records for the student (summary preserved in JSONB)
- Keep all `fee_payments` rows (financial compliance — 7-year standard)
- Set `status = 'archived'`, `archived_at = NOW()`

**Storage impact:** After archival, each student record shrinks from ~50KB+ (with photos, grades rows, attendance rows) to ~500 bytes (JSONB summary). This is a ~100x storage reduction per archived student — critical at scale.

### 8.5 Billing Protection

- Only `active` and `inactive` students count toward the annual invoice snapshot.
- `graduated`, `transferred`, `expelled`, and `archived` students are **never counted** in billing.
- The billing page shows a clear breakdown: **"Active: 284 | Departed (retained): 47 | Archived: 130"**
- This means a school is never penalized financially for students who left mid-year or in prior years.

### 8.6 Transfer Pack (Student Moving to Another School)

When a student transfers, the departing school generates a **Transfer Pack** — a sealed PDF containing:
- Student biodata (name, DOB, gender, student number)
- Enrollment history at this school
- Full academic transcript (grades by term and subject)
- Attendance summary
- Outstanding fee balances (if any)

The Transfer Pack can be:
- Downloaded as a PDF immediately
- Shared via a **secure expiring link** (valid 7 days) — the receiving school can open it even if they are not a Lumini user

```typescript
// Transfer Pack generation (Edge Function)
POST /functions/v1/generate-transfer-pack
Body: { student_id: string, include_grades: boolean, include_attendance: boolean, include_finance: boolean }
Response: { download_url: string, share_link: string, expires_at: string }
```

### 8.7 In-App Export & Download UX

**Where export prompts appear:**
- Dashboard — persistent banner card: "⚠️ 12 student records expire in 45 days. Download before they are archived."
- Students list — "Departing Soon" filter shows all students with `retention_expires_at` within 90 days
- Individual student profile — "Download Record" button always visible for departed students
- Settings → Data Management — bulk export panel

**Bulk export formats:**
- CSV / XLSX — for importing into another system or keeping in a spreadsheet
- PDF (zip) — one PDF per student, for physical filing or sharing with parents
- Class cohort export — e.g. "All 2025 Graduates"

### 8.8 Notification Schedule for Departing Student Data

| Trigger | Channel | Message |
|---|---|---|
| Student marked transferred/graduated/expelled | In-app toast | "Record saved. Data retained for 3 years." |
| 90 days before archival | Email + in-app banner | "12 records archive in 90 days. Download to keep a permanent copy." |
| 60 days before | In-app banner (persistent) | Same, more prominent |
| 30 days before | Email (urgent) + in-app banner | "Final reminder: archive in 30 days. [Download Now]" |
| 7 days before | Email + push notification | "Archiving in 7 days. Last chance to download." |
| Archival complete | Email | "X student records archived. Summary data retained. Full records deleted." |


---

## 9. Frontend Architecture

### Mobile-First Design Principles

> **Mobile is the primary interface.** Most school admins and teachers in Liberia will access Lumini from an Android smartphone, not a laptop. Every screen must be designed for a 360–390px wide screen first, then scaled up for tablets/desktops.

| Principle | Implementation |
|---|---|
| **Touch targets** | Minimum 44×44px for all interactive elements |
| **Thumb-friendly navigation** | Bottom tab bar for primary navigation (not sidebar) on mobile |
| **Large text inputs** | Font size ≥ 16px on inputs to prevent iOS zoom |
| **Simple forms** | Multi-step forms broken into single fields per screen on mobile |
| **Offline indicator** | Always visible at top of screen |
| **Fast first paint** | App shell renders under 1.5 seconds even on 3G |
| **No hover-only interactions** | All interactions work with tap |
| **Portrait-first layouts** | Primary layouts work in portrait; landscape is enhancement |

### Responsive Breakpoints
```
Mobile:  320px – 767px    → Bottom tab bar, stacked layouts, single column
Tablet:  768px – 1023px   → Collapsible sidebar, 2-column layouts
Desktop: 1024px+          → Full sidebar, multi-column, data tables
```

### Route Structure
```
/                          → Public landing page
/login                     → Auth page (login + signup tabs)
/register                  → Onboarding wizard
/verify-email              → Post-signup email verification screen
/offline                   → Offline landing (shown when app shell not cached yet)

/app                       → App shell (requires auth + active subscription)
/app/dashboard             → Home dashboard
/app/students              → Student list & management
/app/students/:id          → Student profile
/app/classes               → Class management
/app/teachers              → Teacher management
/app/gradebook             → Grade entry (teacher) / view (student)
/app/attendance            → Attendance (Premium)
/app/finance               → Fees & payments (Premium)
/app/finance/fees          → Fee structures
/app/finance/payments      → Payment records
/app/messages              → Messaging center (Premium)
/app/schedule              → Timetable (Premium)
/app/calendar              → Academic calendar (Premium)
/app/analytics             → Reports & analytics
/app/settings              → School settings
/app/settings/billing      → Subscription & billing (Stripe portal)
/app/settings/users        → Staff/user management
/app/sync-status           → View pending changes, sync errors, force sync

/super-admin               → Super admin panel (role-gated)
/super-admin/schools       → All schools overview
/super-admin/billing       → Billing management
```

### Feature Gating
```typescript
const { canAccess } = useFeatureAccess();

if (!canAccess('attendance')) {
  return <LockedFeatureBanner feature="Attendance" requiredTier="Premium" />;
}
```

Feature keys: `attendance`, `finance`, `messaging`, `schedule`, `calendar`, `analytics_full`, `biodata_full`, `api_access`, `custom_branding`.

### Key Shared React Contexts
- `SchoolContext` — current school name, logo, tier, subscription status
- `UserContext` — current user profile, role, permissions
- `BillingContext` — trial days remaining, payment status warnings
- `ConnectivityContext` — online/offline status, pending sync count, last sync time
- `SyncContext` — sync engine state, force sync trigger, conflict list

---

## 10. Onboarding Flow

### Registration Wizard (4 Steps)

**Step 1 – School Information**
- School name (required)
- School type (Primary / Secondary / Both)
- Country (default: Liberia)
- Contact email (required)
- Contact phone

**Step 2 – Admin Account**
- Full name
- Email address
- Password (min 8 chars)
- Confirm password

**Step 3 – Choose a Plan**
- Display tier comparison table with new pricing ($0.50 / $1.00 / $2.00)
- Default selection: Standard (highlight as "Most Popular")
- Show example costs: "A school with 200 students pays just $200/year on Standard"
- Note: "Start free for 14 days. No credit card required."

**Step 4 – Confirmation**
- Summary of school name + plan
- "Launch My School" button
- On submit:
  1. Create Supabase auth user
  2. Create `schools` record
  3. Create `profiles` record with `role = school_admin`
  4. Update user metadata with `school_id` and `role`
  5. Create Stripe customer (store `stripe_customer_id` in `schools`)
  6. Seed IndexedDB with initial school data for offline use
  7. Register service worker and cache app shell
  8. Send welcome email via Resend
  9. Redirect to `/app/dashboard` with a welcome tour modal

---

## 11. Email Templates (via Resend)

| Template | Trigger | Recipients |
|---|---|---|
| `welcome` | Registration complete | School admin |
| `trial_ending_soon` | 3 days before trial ends | School admin |
| `trial_expired` | Trial ended, no payment method | School admin |
| `renewal_reminder` | 30 days before annual renewal | School admin |
| `renewal_invoice_preview` | Stripe `invoice.created` (annual) | School admin |
| `payment_failed` | Stripe annual invoice payment failure | School admin |
| `account_locked` | 14 days past_due | School admin |
| `account_suspended` | 45 days past_due | School admin |
| `payment_received` | Annual invoice paid | School admin |
| `account_reactivated` | Status restored to active | School admin |
| `upgrade_confirmation` | School upgrades plan mid-year | School admin |
| `downgrade_scheduled` | School schedules downgrade at renewal | School admin |
| `password_reset` | User requests reset | Any user |
| `staff_invited` | School admin adds new staff | New staff member |
| `data_expiry_90_days` | 90 days before student records archive | School admin |
| `data_expiry_30_days` | 30 days before student records archive (urgent) | School admin |
| `data_expiry_7_days` | 7 days before student records archive (final) | School admin |
| `data_archived` | Auto-archival complete | School admin |
| `transfer_pack_ready` | Transfer Pack PDF generated | School admin |

---

## 12. Super Admin Panel

Separate, role-gated section only accessible to `role = super_admin`.

### Super Admin Features
- View all registered schools (name, tier, status, student count, ARR contribution)
- Force-change a school's subscription status (e.g., manually reactivate after payment)
- View global billing metrics (total ARR, churn, new signups, renewals due this month)
- Impersonate a school admin (for support — logged in audit_logs)
- Send platform-wide announcements
- View error logs and webhook failures

---

## 13. Security Checklist

- [ ] All Supabase tables have RLS enabled
- [ ] Service role key is NEVER exposed to the frontend
- [ ] Stripe webhook signature verified on every webhook call
- [ ] Super Admin routes protected by both auth AND role check server-side
- [ ] All user inputs sanitized (no raw SQL string concatenation anywhere)
- [ ] File uploads (logos, photos) go through Supabase Storage with size/type validation
- [ ] Rate limiting on auth endpoints (Supabase handles this by default)
- [ ] Audit log entries created for all sensitive operations
- [ ] HTTPS enforced everywhere (Vercel handles this by default)
- [ ] API keys stored only in environment variables
- [ ] Trial bypass attacks prevented: trial_ends_at set server-side, never client-side
- [ ] Offline auth tokens expire after 7 days and require re-login
- [ ] Sync engine validates school_id on every record before pushing to Supabase
- [ ] Pending changes queue sanitized before push (no XSS payloads in payloads)
- [ ] Conflict resolution does not expose other schools' data during sync
- [ ] Service worker scope restricted to app origin only

---

## 14. Implementation Phase Tracker

> **Status legend:** ✅ done · 🟡 partial · ⏳ not started
> Last reconciled with codebase: 2026-04-18

### ✅ Phase 1: Database Architecture & Multi-Tenancy — *mostly complete*
- [x] Create core tables (schools, profiles, academic_years, academic_periods, classes, students, subjects, departments, class_subjects, attendance_sessions, attendance_records, student_grades, student_period_totals, student_yearly_totals, fee_categories, fee_structures, fee_assignments, division_fee_rates, installment_plans, student_bills, student_bill_items, payments, student_payments, expenses, notifications, parent_student_assignments, sponsor_class_assignments, schedules, class_schedules, assessment_types, subscriptions)
- [ ] Add retention columns to students table: departure_date, retention_expires_at (generated), export_reminded_at, archived_at, archive_summary
- [ ] Create pg_cron jobs: 90-day warning, 30-day final warning, daily auto-archival (Section 8.4)
- [ ] Create Transfer Pack Edge Function (Section 8.6)
- [ ] Create `student_data_exports` + `audit_logs` + `billing_sync_logs` tables
- [x] Create helper functions (`has_role`, `current_school_id`, `is_super_admin`, `can_manage_class_attendance`)
- [x] Enable RLS on ALL tables
- [x] Write and test RLS policies per role (admin, teacher, sponsor, parent, student)
- [x] Create DB indexes on `school_id`, `student_id`, `class_id`
- [x] `updated_at` columns on all relevant tables

### ✅ Phase 2: Offline-First Foundation — *complete*
- [x] Install and configure Dexie.js with local schema (`src/lib/offline/db.ts`)
- [x] Implement `pendingChanges` queue with INSERT/UPDATE/DELETE tracking
- [x] Build SyncEngine (`src/lib/offline/sync.ts`): push queue + pull delta
- [x] Connectivity detection and auto-sync on reconnect
- [x] Offline auth token caching (Supabase persistSession + localStorage)
- [x] Configure vite-plugin-pwa with Workbox
- [x] PWA manifest (icons, theme, standalone display) + `/install` page
- [x] Register service worker (`src/lib/offline/registerSW.ts`)
- [x] Connectivity status bar (`SyncStatusIndicator`)
- [x] Dedicated `/sync-status` page (pending changes, errors, force-sync button)
- [x] Conflict resolution UI for failed outbox entries (retry/discard)
- [ ] End-to-end offline test: airplane mode → add student → reconnect → verify sync

### ✅ Phase 3: Auth & Onboarding — *complete*
- [x] Supabase Auth with email/password
- [x] Registration wizard (`/signup` + `register-school` edge function)
- [x] Server-side user/school creation (Edge Function with service role)
- [x] Role assignment via `user_roles` table + `has_role()`
- [x] `/auth` login page (works offline via cached session)
- [x] Password reset flow
- [x] Contexts: `AuthContext`, `SchoolContext`, `ThemeContext`
- [x] Route guards: `ProtectedRoute`, `AdminRoute`, `TeacherRoute`
- [x] Seed IndexedDB on first login (full school snapshot)
- [x] Email verification enforcement banner

### ✅ Phase 4: Billing Integration — *complete (Paddle, not Stripe)*
> **Note:** Implemented with **Paddle** instead of Stripe. Pricing model = per-student/year as in the PRD.
- [x] Per-seat pricing tiers ($0.799 / $1.299 / $2.00 per student/year)
- [x] Paddle checkout flow (`get-paddle-price`, `change-subscription`)
- [x] Paddle webhook handler (`payments-webhook`)
- [x] Seat sync job (`sync-subscription-seats`)
- [x] Customer portal link (`customer-portal-session`)
- [x] Trial countdown banner (`TrialBanner`)
- [x] Payment test-mode banner (`PaymentTestModeBanner`)
- [x] Lockout state machine (`schools.lockout_state`, `lockout_started_at`)
- [x] `LockedFeatureBanner` + `SubscriptionGate`
- [x] `/settings/billing` page
- [ ] Renewal reminder banner (30 days before)
- [ ] Resend transactional emails (Section 11 templates) — none wired yet

### ✅ Phase 5: Core App Modules — *complete*
- [x] App shell + responsive sidebar (`AppShell`, `AppSidebar`)
- [x] Dashboard with stats, charts, schedule, activity
- [x] Student management (biodata, dialog, photo upload, panel)
- [x] Class / Department / Subject / Academic Year / Academic Period management
- [x] Teacher panel + assignments + sponsor assignments
- [x] Parent panel + parent-child linking + parent portal
- [x] Student portal (grades, attendance, fees view)
- [x] Gradebook + Reports + Report preview/dialog
- [x] Analytics (class performance, demographics, pass/fail, trends)
- [x] Attendance module
- [x] Finance: Fees, Payments, Expenses, Finance Reports, Receipts
- [x] Notifications (in-app, role-targeted, real-time)
- [x] Schedule + Academic Calendar
- [x] School settings + theme toggle
- [x] `useFeatureAccess` hook + `LockedFeatureBanner`
- [x] Student photo upload (edge function `update-student-photo`)
- [ ] Client-side WebP resize before upload (≤400×400)
- [ ] Messaging module (in/out conversations) — only one-way notifications today

### ✅ Phase 6: Super Admin Panel — *complete*
- [x] Super admin route group with role guard (`SuperAdminRoute`)
- [x] Schools overview table (all schools, status, tier, student count)
- [x] Manual subscription status override (in `SchoolDetailDrawer`, audit-logged)
- [x] Global billing metrics dashboard (`PlatformMetrics`)
- [x] Impersonation feature (logged to `audit_logs`)

### ⏳ Phase 7: Polish, Testing & Deployment — *not started*
- [x] Custom PWA install prompt (`PWAInstallPrompt`, dismissible 14d)
- [x] Mobile responsive audit (AppShell mobile padding fixed)
- [ ] Offline scenario testing
- [ ] Full RLS security audit (cross-school isolation tests)
- [ ] End-to-end Paddle billing lifecycle test
- [ ] Bandwidth test on 2G (~50 kbps)
- [ ] Sentry integration (frontend + Edge Functions)
- [x] Bundle size audit (route-level code splitting via React.lazy)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Production deployment + env-var hardening
- [ ] Load test (50 concurrent schools)

---

## 15. Naming Conventions & Code Standards

- **Database:** snake_case for all table and column names
- **TypeScript:** PascalCase for types/interfaces, camelCase for variables/functions
- **React components:** PascalCase, one component per file
- **Hooks:** always prefix with `use` (e.g., `useStudents`, `useFeatureAccess`, `useSync`)
- **Offline writes:** ALL writes go through a `useOfflineWrite(table)` hook that writes to IndexedDB first, then queues sync
- **API calls:** all Supabase queries go inside custom hooks, never directly in components
- **Error handling:** all async operations wrapped in try/catch, errors surfaced via toast notifications
- **File structure:**
  ```
  src/
    components/        # Reusable UI components
    features/          # Feature modules (students/, finance/, etc.)
    hooks/             # Custom React hooks
    contexts/          # React context providers
    lib/
      db.ts            # Dexie local DB instance
      sync.ts          # SyncEngine class
      supabase.ts      # Supabase client
      stripe.ts        # Stripe helpers
    pages/             # Route-level page components
    types/             # TypeScript type definitions
  supabase/
    functions/         # Edge Functions (webhooks, cron jobs)
    migrations/        # SQL migration files
  public/
    icons/             # PWA icons (192px, 512px, maskable)
    manifest.json      # PWA manifest (generated by vite-plugin-pwa)
  ```

---

## 16. Change Log

| Date | Change |
|---|---|
| 2026-04-17 | Initial PRD created. Conceptualized Micro-SaaS architecture. |
| 2026-04-17 | PRD significantly expanded: full schema, RLS strategy, Stripe architecture, role permissions, onboarding flow, email templates, Super Admin spec, code standards, security checklist. |
| 2026-04-17 | Billing model changed from monthly metered to annual per-seat ($6/$12/$24). |
| 2026-04-17 | **Major revision:** (1) Pricing reduced to $0.50/$1.00/$2.00 per student per year to match Liberian school budgets. (2) Full offline-first architecture added: IndexedDB via Dexie.js as primary data store, sync queue with conflict resolution, Service Worker via Workbox/vite-plugin-pwa, offline auth token caching. (3) Low-bandwidth optimizations documented (delta sync, image compression, lazy loading, <200KB bundle target). (4) Mobile-first declared as primary interface: bottom tab bar, 44px touch targets, portrait-first layouts. (5) Connectivity status UI added. (6) Phase 2 (Offline Foundation) inserted before Auth phase. All phases updated. |
| 2026-04-17 | **Pricing update & Student Data Lifecycle:** (1) Pricing adjusted to $0.799/$1.299/$2.00 per student per year (slight increase for sustainability while remaining ultra-affordable). (2) Added comprehensive Section 8 — Student Data Lifecycle & Retention Policy: 3-year retention window for departed students (graduated/transferred/expelled), automatic anonymization and archival after 3 years, graduated student data does NOT count toward billing, 90/60/30/7-day flagging & reminder system with one-click bulk export, Transfer Pack generation for students moving to other schools, secure expiring share links, storage reduction via JSONB summarization (~100x reduction per archived student). (3) Added student_data_exports table and pg_cron jobs for retention management. (4) Updated Phase 1 tasks to include retention column setup and CRON job creation. (5) Added 5 new email templates for data expiry notifications and Transfer Pack generation. This aligns with industry standards (PowerSchool, Infinite Campus) and protects schools from storage bloat and accidental billing inflation. |
