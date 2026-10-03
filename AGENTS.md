AGENTS.md

Project Overview

This project is a Sales Workspace for Focus Company.

The system is an internal workspace for the sales team to:

* Manage customer information
* View customer history
* Manage and track orders
* Track order status
* Provide sales staff with a centralized workspace for daily operations

The system should be designed as a maintainable, secure, and scalable internal business application.

⸻

Core Objectives

The application must provide three primary capabilities:

1. Sales Workspace

Provide sales staff with a central workspace to:

* View sales-related information
* View customer activity
* View recent orders
* Monitor order statuses
* Quickly access customer and order details

2. Customer Database

Maintain a centralized customer database containing:

* Customer profile
* Contact information
* Customer history
* Related orders
* Sales-related notes when applicable
* Customer activity timeline when applicable

Customer information must not be duplicated unnecessarily.

3. Order Management

Allow sales staff to:

* Create orders
* View orders
* View order details
* Update order status
* Track order progress
* View the customer associated with an order
* View order history

Order status changes should be traceable.

⸻

Technology Stack

Frontend

* Next.js
* React
* TypeScript

Use the Next.js App Router unless the existing project explicitly requires another architecture.

Backend / API

* Next.js Route Handlers
* TypeScript

Business logic should be implemented on the server side.

Do not expose database credentials or service-role credentials to the browser.

Database

* Supabase
* PostgreSQL
* SQL

Supabase should be treated primarily as the application’s PostgreSQL database and backend infrastructure.

Authentication

Use Supabase Authentication if authentication is required.

Authentication and authorization must be handled server-side where appropriate.

⸻

Architecture

Use a clear separation between:

UI
↓
Server / API
↓
Business Logic
↓
Supabase
↓
PostgreSQL

The browser must not directly perform privileged database operations.

Prefer API/server-side operations for:

* Creating customers
* Updating customers
* Creating orders
* Updating orders
* Changing order status
* Reading sensitive sales information

⸻

Project Structure

Prefer the following structure:

src/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── customers/
│   ├── orders/
│   └── api/
│       ├── customers/
│       ├── orders/
│       └── ...
│
├── components/
│   ├── customers/
│   ├── orders/
│   ├── dashboard/
│   └── ui/
│
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── validation/
│   └── utils/
│
├── services/
│   ├── customers/
│   ├── orders/
│   └── ...
│
├── types/
│
└── ...

The exact structure may be adjusted to match the existing project, but responsibilities should remain separated.

⸻

Database Design

Use PostgreSQL through Supabase.

The database should be relational and normalized.

At minimum, the system is expected to contain concepts equivalent to:

users / sales_staff
customers
orders
order_status_history

Additional tables may be introduced when required by the business requirements.

Avoid storing multiple independent copies of the same customer information.

For example:

orders.customer_id

should reference:

customers.id

instead of storing duplicated customer information directly in the order.

⸻

Customer Data

Customer records should have a stable unique identifier.

Prefer:

UUID

for primary keys unless there is a strong reason to use another strategy.

Customer records should support timestamps such as:

created_at
updated_at

When appropriate, also support:

created_by
updated_by

Do not store sensitive information unless it is required by the business requirement.

⸻

Order Data

Each order must:

* Have a unique identifier
* Reference a customer
* Have a creation timestamp
* Have an order status
* Track relevant timestamps
* Be associated with the responsible sales staff when applicable

Example conceptual structure:

orders
├── id
├── customer_id
├── sales_user_id
├── status
├── total_amount
├── created_at
└── updated_at

The exact fields must be based on the final business requirements.

Do not invent unnecessary business fields.

⸻

Order Status

Order statuses must be explicitly defined.

Do not use arbitrary free-form strings for order status.

Prefer a controlled set such as:

pending
confirmed
processing
shipping
completed
cancelled

The final status values must be confirmed against the business requirements.

Status transitions should be validated.

For example, the application should not allow an invalid transition simply because a client sends an arbitrary status value.

⸻

Order Status History

Order status changes should be recorded.

Conceptually:

order_status_history
├── id
├── order_id
├── previous_status
├── new_status
├── changed_by
└── created_at

This allows the sales team to understand how an order progressed over time.

Do not overwrite historical status information when the business requires an audit trail.

⸻

API Design

Use REST-style API endpoints through Next.js Route Handlers.

Example:

GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PATCH  /api/customers/:id
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
GET    /api/orders/:id/history
POST   /api/orders/:id/status

The exact endpoint structure may change if a better architecture is justified.

API responses should use consistent structures.

For example:

{
  "data": {},
  "error": null
}

or:

{
  "data": null,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer not found"
  }
}

Do not expose raw database errors to clients.

⸻

API Validation

Every API endpoint must validate input.

Never trust:

* Request body
* Query parameters
* URL parameters
* Client-side validation
* Client-provided user IDs
* Client-provided authorization information

Validation should happen server-side.

Use a schema validation library such as Zod if appropriate.

Example:

Request
↓
Validate input
↓
Authenticate user
↓
Authorize operation
↓
Execute business logic
↓
Database
↓
Return response

⸻

Authentication & Authorization

Authentication and authorization are different concerns.

Authentication determines:

Who is the user?

Authorization determines:

What is this user allowed to do?

Do not rely solely on frontend route protection.

Sensitive operations must also be protected on the server.

Never trust a client-provided:

user_id
sales_user_id
role
permissions

when determining authorization.

Derive the authenticated user from the server-side authentication context.

⸻

Supabase Security

Never expose the Supabase Service Role Key to the client.

The following must remain server-side:

SUPABASE_SERVICE_ROLE_KEY

Environment variables must not be committed to Git.

Use:

.env.local

for local secrets.

Provide:

.env.example

containing variable names without real secrets.

Example:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

Use Row Level Security (RLS) where appropriate.

Do not disable RLS simply to make application development easier.

⸻

Business Logic

Business rules should not be implemented exclusively inside React components.

Avoid:

Component
↓
direct database mutation

Prefer:

Component
↓
API / Server Action
↓
Business Logic
↓
Database

Business logic should be reusable and testable.

For example:

services/orders/
├── createOrder.ts
├── updateOrder.ts
├── updateOrderStatus.ts
└── getOrder.ts

⸻

Error Handling

Use predictable error handling.

The API must distinguish between errors such as:

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error

Do not expose:

* SQL errors
* Stack traces
* Internal filesystem paths
* API keys
* Supabase service credentials
* Internal implementation details

to end users.

Log useful diagnostic information server-side when appropriate.

⸻

UI / UX

The Sales Workspace should prioritize:

1. Clarity
2. Speed
3. Easy navigation
4. Information density without clutter
5. Consistency

Sales staff should be able to quickly:

Find customer
↓
View customer history
↓
View related orders
↓
Check order status
↓
Update order

Common actions should require as few unnecessary interactions as possible.

Use consistent:

* Buttons
* Forms
* Tables
* Status indicators
* Loading states
* Empty states
* Error states
* Confirmation dialogs

⸻

Dashboard

The workspace should provide useful high-level information.

Potential dashboard information includes:

* Total customers
* New customers
* Active orders
* Orders by status
* Recent orders
* Recently updated customers
* Sales activity

Do not implement metrics that are not supported by available data.

⸻

Customer Workspace

Customer pages should allow sales staff to:

* Search customers
* Filter customers
* View customer details
* View customer history
* View related orders
* Add or update customer information

Customer search should be designed for practical sales usage.

Search should support relevant fields such as:

* Customer name
* Phone
* Email
* Customer ID

depending on the final requirements.

⸻

Order Workspace

Order pages should allow sales staff to:

* Search orders
* Filter orders
* View order details
* View customer information
* View current status
* View status history
* Update order status

Orders should be easy to scan.

Use clear visual indicators for order status.

⸻

Loading / Empty / Error States

Every data-driven page must account for:

Loading

Show an appropriate loading state.

Empty

Clearly explain when there is no data.

Example:

No orders found.

Error

Clearly explain what went wrong and provide an appropriate recovery action when possible.

⸻

Performance

Avoid unnecessary database queries.

Prefer:

* Server-side data fetching when appropriate
* Pagination for large datasets
* Filtering at the database level
* Selecting only required columns
* Proper database indexes
* Efficient joins

Do not fetch thousands of records into the browser just to filter them with JavaScript.

⸻

Database Indexing

Add indexes for fields frequently used for:

* Search
* Filtering
* Sorting
* Foreign key relationships

Examples may include:

customers.email
customers.phone
orders.customer_id
orders.status
orders.created_at

Indexes should be based on actual query patterns.

Do not blindly add indexes to every column.

⸻

SQL

SQL migrations must be version-controlled.

Database schema changes should be reproducible.

Do not manually modify production database structure without a corresponding migration.

Prefer migration files such as:

supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_create_orders.sql
    └── ...

Migration files should be safe, explicit, and understandable.

⸻

TypeScript

Use TypeScript throughout the application.

Avoid:

any

unless there is a documented technical reason.

Prefer explicit types and inferred types where appropriate.

Shared database/domain types should not be duplicated unnecessarily.

⸻

React / Next.js

Prefer Server Components by default.

Use Client Components only when client-side behavior is required.

Examples that may require Client Components:

* Interactive forms
* Browser APIs
* Local state
* Client-side event handlers
* Interactive tables

Do not add "use client" unnecessarily.

⸻

Components

Create reusable components when the same UI pattern appears multiple times.

Avoid creating overly generic components that make the code harder to understand.

Prefer domain-oriented components such as:

CustomerTable
CustomerForm
CustomerProfile
OrderTable
OrderStatusBadge
OrderStatusHistory

over components with unclear responsibilities.

⸻

Security Rules

Never:

* Commit secrets
* Expose service-role credentials
* Trust client-provided roles
* Trust client-provided user IDs for authorization
* Return raw SQL errors
* Disable RLS without a documented reason
* Store unnecessary sensitive customer information
* Log sensitive customer information unnecessarily

Always:

* Validate API input
* Authenticate protected requests
* Authorize protected operations
* Use parameterized queries / Supabase query APIs
* Protect sensitive database operations

⸻

Testing

Important business logic must have tests.

At minimum, test:

* Customer creation
* Customer retrieval
* Customer update
* Order creation
* Order retrieval
* Order status changes
* Invalid status transitions
* Authentication failures
* Authorization failures
* Validation failures

Tests should cover both successful and unsuccessful cases.

⸻

Git Rules

Use clear commit messages.

Prefer:

feat: add customer management
feat: add order status tracking
fix: prevent invalid order status transition
refactor: separate order service
test: add customer API tests

Do not commit:

.env
.env.local
credentials
API keys
service role keys

⸻

Development Workflow

When implementing a feature:

1. Understand the requirement.
2. Inspect the existing project structure.
3. Inspect related database schema.
4. Identify affected components and APIs.
5. Implement database changes through migrations.
6. Implement server-side business logic.
7. Implement API endpoints.
8. Implement or update UI.
9. Add validation.
10. Add authorization checks.
11. Add tests.
12. Run linting.
13. Run type checking.
14. Run tests.
15. Run production build when appropriate.
16. Review the implementation for security issues.

Do not rewrite unrelated parts of the application.

Prefer small, focused changes.

⸻

Working With Existing Code

Before creating a new abstraction:

* Search the existing codebase.
* Reuse existing utilities where appropriate.
* Reuse existing components where appropriate.
* Follow established project conventions.

Do not create duplicate:

* API clients
* Supabase clients
* Validation schemas
* UI components
* Utility functions
* Types

unless there is a clear reason.

⸻

Requirements Discipline

Do not invent business requirements.

If a requirement is ambiguous:

1. Identify the ambiguity.
2. Check existing code and documentation for context.
3. Choose the safest reasonable implementation only when necessary.
4. Clearly document assumptions.
5. Avoid building complex features that were not requested.

The goal is to implement the required business functionality, not to maximize the number of features.

⸻

Definition of Done

A feature is considered complete only when:

* The requirement is implemented.
* UI states are handled.
* API input is validated.
* Authentication is enforced where required.
* Authorization is enforced where required.
* Database changes use migrations.
* No secrets are exposed.
* Relevant RLS policies are implemented.
* Error handling is implemented.
* Relevant tests are added or updated.
* TypeScript has no relevant errors.
* Linting passes.
* The application builds successfully.
* The implementation does not introduce unnecessary unrelated changes.

⸻

Theme & Accessibility

The application should support both Light mode and Dark mode.

* Theme selection must be available from the workspace UI.
* The selected theme should persist for the user across reloads.
* Use shared CSS variables/tokens for theme-dependent colors instead of duplicating page-specific theme logic.
* Theme changes must cover all shared surfaces, including navigation, cards, tables, forms, modals, status indicators, dashboards, and empty/error states.
* Maintain readable contrast and visible focus/hover states in both themes.
* Do not encode business logic or data assumptions into theme styles.

⸻

Sales Tracker Requirements

Sales Tracker represents sales activities and daily plans, not only a pipeline list.

Each activity should support, when available:

* Activity title and controlled activity type: customer visit, follow-up, internal meeting, sample delivery, or other
* Activity date, start time, end time, and location
* Main owner and participants
* Customer association, with a controlled flow for creating a new customer
* After-sale information, including expected monthly revenue and products of interest
* Description, purpose, next action, follow-up date, and notes
* Supporting documents and visit images

The workspace should support Daily Plan and monthly views, filtering by owner and activity type, viewing activity details, creating activities, editing activities, and updating activity stage.

Attachments are temporary/mock data until storage is implemented. The future database model should keep customer and user information normalized through IDs rather than duplicating profile data in activities.

⸻

Sales KPI Requirements

Sale KPI is the team-performance workspace for sales staff. It should provide:

* Annual sales total and annual target total
* Current-month sales total
* Total team activities and follow-up work
* Search by salesperson name, phone number, or assigned area
* Status filters for all, online, visiting a customer, and leave
* A per-person view with contact details, monthly sales, monthly target, target attainment, follow-up work, latest activity, assigned tasks, completed activities, closed deals, and new customers
* Create, edit, and delete salesperson records
* Assign tasks with due dates to a salesperson
* Attach documents to a salesperson record

Until a real database is introduced, Sale KPI uses the shared mock workspace repository so changes are reflected across open views and browser tabs. Salesperson records must use stable IDs and should be migrated to normalized users/sales_staff, tasks, activities, and documents tables when the database is implemented. File attachments are mock metadata only until object storage is available.

⸻

Important Principle

This is a business application.

Prioritize:

Correctness
Security
Data integrity
Maintainability
Usability
Performance

in that order when making engineering decisions.
