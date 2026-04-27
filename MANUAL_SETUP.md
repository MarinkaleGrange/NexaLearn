# NexaLearn Manual Setup Guide

This guide covers every manual task still needed after the current prototype build.

## 1) What Is Already Implemented

- Multi-page frontend experience in a single app:
  - Landing
  - Marketplace + cart
  - Tutoring dashboard
  - Enrollment form
  - Saturday request form
  - Custom resource request form
  - Customer account
  - Student portal
  - Admin panel
  - Booking success page
- Bilingual UI toggle (English/Afrikaans for key labels and sections)
- Role-based view access (Guest, Parent, Student, Admin)
- Lesson package purchase and usage tracking
- Package expiry and remaining lesson handling
- Local consent log counter for "I agree to Terms"
- Local data export to JSON from Admin panel
- Footer links to local privacy policy and terms PDFs

Important: this is still a frontend-only prototype. Data is saved in browser `localStorage`, not a real database.

## 2) Folder and File Validation

Confirm this exact structure exists:

```text
C:\Users\legra\OneDrive\Documents\New project\
  index.html
  styles.css
  app.js
  MANUAL_SETUP.md
  assets\
    logo.png
    privacy-policy.pdf
    terms-and-conditions.pdf
```

If any file is missing, replace it before going live.

## 3) Hosting Setup (Manual)

## Option A: Netlify (recommended for fast static deploy)

1. Create a Netlify account and sign in.
2. Click `Add new site` -> `Deploy manually`.
3. Drag-and-drop the entire folder `C:\Users\legra\OneDrive\Documents\New project`.
4. Wait for deploy to finish and open generated URL.
5. In Site settings:
   - Set site name to something brand-appropriate.
   - Add custom domain if available.
   - Force HTTPS.

## Option B: Vercel

1. Create Vercel account and sign in.
2. Create new project from local folder upload or Git repository.
3. Set project root to `New project`.
4. Deploy and verify static file serving.

## 4) Payment Provider Setup (Manual and Required)

## 4.1 EFT

1. Confirm business bank account details are final and legal for invoicing.
2. Publish only intended public payment details.
3. Keep reference format exactly: `[StudentName_Month]`.
4. Define daily reconciliation process:
   - Check bank incoming payments
   - Match by reference
   - Update payment status in admin records

## 4.2 PayFast

1. Create or verify PayFast merchant account.
2. Complete KYC and business verification.
3. Set settlement bank account.
4. Configure return, cancel, and notify URLs (after backend exists).
5. Enable ZAR and required payment methods.

## 4.3 SnapScan

1. Verify merchant profile and payout details.
2. Keep live link active:
   - `https://pos.snapscan.io/qr/uajMqmLI`
3. Confirm QR scans resolve correctly from mobile devices.
4. Include same reference format in client instructions and receipts.

## 5) Backend You Still Need (Manual build/connection)

The frontend currently simulates all operations. You must connect a backend for production.

Create backend modules for:

1. Authentication and authorization
   - Roles: parent, student, admin
   - Session handling
   - Password reset and account recovery

2. Student enrollment data
   - Parent and student profiles
   - Age, grade, home language, subjects
   - Enrollment approval status

3. Booking engine
   - Slot availability and collision checks
   - Saturday request queue
   - Booking confirmation and reminders

4. Payments
   - Transaction records
   - Method used (EFT/PayFast/SnapScan)
   - Reconciliation status
   - Late payment fee application

5. Marketplace
   - Product catalog CRUD
   - Cart/order persistence
   - Purchase history and downloads

6. Package tracking
   - Purchase date
   - Expiry date (+6 weeks)
   - Remaining lessons
   - Consumption per booking

7. File storage
   - Secure uploads for school reports and custom requests
   - Access controls and signed URLs

8. Audit and compliance
   - Terms consent logs
   - Admin actions
   - Data retention timestamps

## 6) Database Setup (Manual)

Use PostgreSQL, Supabase Postgres, or equivalent relational DB.

Minimum tables:

1. `users`
2. `students`
3. `enrollments`
4. `tutoring_bookings`
5. `saturday_requests`
6. `lesson_packages`
7. `lesson_package_usage`
8. `marketplace_resources`
9. `orders`
10. `order_items`
11. `payments`
12. `late_fees`
13. `consent_logs`
14. `uploaded_files`

Minimum indexes:

1. `tutoring_bookings(student_id, booking_date)`
2. `payments(reference)`
3. `lesson_packages(student_id, expiry_date)`
4. `orders(parent_user_id, created_at)`

## 7) Business Rules to Enforce Server-Side

Do not rely on frontend-only checks.

1. Address privacy:
   - `37 Hosking Street, Brenthurst, Brakpan` only in:
     - booking success page output
     - confirmation/reminder messages

2. First booking discount:
   - 50% only on first tutoring booking
   - never on marketplace
   - never on package purchase

3. Enrollment fee:
   - R150 once-off per student

4. Group pricing:
   - 2 learners: R130 p/p (45 mins)
   - 3 learners: R100 p/p (45 mins)

5. Neurodiverse add-on:
   - +R50 per lesson

6. Package rules:
   - Starter: 4 lessons 30 min R520
   - Core: 4 lessons 45 min R760
   - Boost: 8 lessons 45 min R1440
   - Expiry: 6 weeks from purchase
   - Block use after expiry or 0 lessons

7. Late fee:
   - +R50 after 2 working days

8. Saturday logic:
   - No Saturday slots in normal booking calendar
   - Request flow only
   - Admin approve/reject

## 8) Email and SMS Automations (Manual)

Configure a transactional provider (Mailgun, Resend, SendGrid, etc.) and SMS provider.

Required events:

1. Booking confirmed
   - include session details
   - include physical address

2. 24-hour reminder
   - email
   - SMS

3. Payment reminders
   - due
   - overdue
   - late fee applied

Template variables required:

1. Student name
2. Parent name
3. Session date/time
4. Service type
5. Delivery mode
6. Group size
7. Payment reference
8. Package remaining lessons

## 9) POPIA/GDPR Manual Compliance Tasks

1. Add Privacy Policy and Terms versioning.
2. Store timestamp + user ID for each terms acceptance.
3. Define retention jobs:
   - student/parent records: 24 months after last lesson
   - financial records: 5 years
4. Add data request process:
   - access request
   - correction request
   - deletion request
5. Encrypt sensitive data at rest and in transit.
6. Restrict access by role and least privilege.

## 10) Admin Operations Setup

1. Prepare a standard operating checklist for daily admin:
   - review Saturday requests
   - reconcile EFT/SnapScan references
   - verify unsettled payments
   - apply late fees where applicable
2. Weekly checks:
   - package expiries this week
   - upcoming reminder delivery failures
   - failed payment attempts

## 11) Go-Live Testing Checklist

Run this before launch:

1. Guest cannot open admin or student portal.
2. Student cannot open admin/customer pages.
3. Parent can complete marketplace checkout only with terms checked.
4. Saturday cannot be booked from normal slot calendar.
5. Package usage decrements remaining lessons.
6. Expired package cannot be used.
7. First-booking discount applies only once.
8. Address appears only on booking success and communication templates.
9. Legal PDF links open and render.
10. WhatsApp button opens `+27 66 051 0002`.

## 12) Immediate Next Manual Step

Deploy this version to Netlify/Vercel first, then begin backend integration in a separate branch so you keep a stable visual baseline.
