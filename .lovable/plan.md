## Goal
Rebuild the CRM frontend (was deleted by a revert). The Lovable Cloud database still has the full CRM schema — workspaces, members, leads, deals, contacts, organizations, invoices, quotations, tickets, activities, workflows, audit log, commissions, etc. — so this is **frontend-only** work.

## Entry
- New route `/crm` (and `/crm/:workspaceSlug/...`), admin-only (uses existing `has_role` / `is_super_admin`).
- Non-admins redirected to `/auth`.

## Phased delivery
We'll ship in 5 phases. Each phase is shippable and testable on its own.

### Phase 1 — Shell (this turn)
- `/crm` route, auth guard, workspace picker (lists `crm_workspaces` the user belongs to).
- `CrmLayout` with collapsible left sidebar + top bar.
- Sidebar groups (Sales, Inventory, Support, Finance, HR, Settings) with flyout panels to the right.
- Placeholder pages for every module so navigation works.
- Dark "Vtiger-style" theme via design tokens.

### Phase 2 — Sales core
- Leads, Contacts, Organizations, Deals, Activities (list + detail + create/edit).
- Kanban for Deals, table + filters for Leads.

### Phase 3 — Quote-to-cash
- Quotations, Invoices, Payments, Products, Stock movements.
- Auto-status sync (already handled by DB triggers).

### Phase 4 — Support & ops
- Support tickets, Field visits, Contracts, Feedback surveys, Tasks/time logs.

### Phase 5 — Admin & automation
- Workspace members & permissions, Role permissions matrix, Workflow rules + executions, Approvals, Commissions, Audit log, Website Settings (CRM config), Integrations placeholder.

## Tech details
- React Router nested routes under `/crm`.
- `useCrmWorkspace()` hook resolves slug → workspace id, member role, permissions via `crm_has_permission` RPC.
- All data access via existing tables + RPCs; no schema changes.
- Reuse shadcn `Sidebar`, `Table`, `Dialog`, `Form`, `Tabs`, `Card`.
- Lazy-load every module page to keep bundle small.

## Out of scope for now
- Vtiger external sync (already lives in edge functions `vtiger-submit` / `crm-ping` / `crm-retry`; we'll wire UI to them in Phase 5).
- Mail Manager / Documents file UI (Phase 4+).
- Mobile-optimized layouts beyond responsive basics.

## After approval
I'll implement **Phase 1** in this turn so you can navigate the shell, then we iterate phase by phase.