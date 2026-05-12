
# Vtiger 8.4 → Amruta CRM Full Parity Plan

Built against the **standard Vtiger 8.4 Open Source** blueprint (the version your hosted instance runs). I cannot log into the shared instance, but the layout, modules, and workflow engine are well-documented and your CRM already implements ~80% of the data model — this plan closes the remaining UX/feature gaps in phased steps.

> **Security note:** rotate the Vtiger password `Kinnu@9966` immediately — it has been shared in chat.

---

## Vtiger 8.4 — what we are mirroring

**Layout shell**
- Top bar: global search, Quick Create (+), notifications, calendar, help, user menu
- Left sidebar: pinned modules + grouped modules (Marketing / Sales / Inventory / Support / Projects / Tools) — already built
- Module screen = **List View** (default) with saved filters, column chooser, mass actions, kanban toggle, import/export
- Record screen = **Summary View** — left rail (key fields, tags, assigned user) + right tabs (Updates, Activities, Emails, Documents, related lists, History)

**Workflow engine**
- Trigger: on-create, on-update (field change), on-schedule, time-based (after N days)
- Conditions: AND/OR groups, field operators (eq, contains, gt, changed, is empty…)
- Actions: assign user, update field, send email, create task, create event, webhook, invoke function

**Modules (full list)**
Leads, Contacts, Organizations, Opportunities (Deals), Quotes, Sales Orders, Purchase Orders, Invoices, Products, Services, Price Books, Vendors, Campaigns, Email Templates, Tickets, FAQ, Service Contracts, Assets, Projects, Project Tasks, Project Milestones, Calendar/Events/Tasks, Documents, SMS Notifier, RSS, Recycle Bin, PBX Manager, Reports, Dashboards.

**Settings**
Users & Roles, Profiles & Sharing, Pick List editor, Field Layout, Workflows, Assignment Rules, SLA Policies, Email Templates, Inventory Terms, Tax Management, Webforms, API tokens, Audit log.

---

## Phase plan (step by step)

### Phase 1 — Leads + Contacts + Organizations (FIRST, per your choice)
1.1 **Lead List View** — saved filters (My Leads / Today / This Week / Hot / Cold / All), column chooser persisted per user, mass-actions (assign, change status, delete, send email, add to campaign), Kanban-by-stage toggle, CSV import/export.
1.2 **Lead Summary View** — Vtiger-style 2-column: left rail (avatar, name, status badge, score, key fields, tags, assigned user, quick edit); right tabs: Updates (timeline), Activities, Emails, Documents, Comments, History, Related (Deals, Quotes, Tickets).
1.3 **Quick Create Lead** — slide-over form mirroring Vtiger's mini form (mandatory fields only + "More" expander).
1.4 **Convert Lead** — Vtiger conversion wizard: → Contact + Organization + (optional) Deal, with field mapping preview.
1.5 **Contact Summary View + List View** — same shell, related lists: Deals, Quotes, Invoices, Tickets, Activities, Documents, Campaigns.
1.6 **Organization Summary View + List View** — hierarchy (parent org), related Contacts, Deals, Tickets; Members tab.
1.7 **Auto-numbering & duplicate detection** for all three (Vtiger's "Find Duplicates" UI).

### Phase 2 — Sales pipeline
2.1 Opportunities (Deals) — Kanban with stage probability, drag-drop, weighted forecast rollup, Summary View.
2.2 Quotes — line-item editor, tax/discount, terms, PDF, e-sign, status flow (Draft → Sent → Accepted/Rejected), convert to Sales Order/Invoice.
2.3 Sales Orders — same shell, convert to Invoice.
2.4 Forecast — period-based pipeline forecast (already partial; align UI).

### Phase 3 — Inventory & Billing
3.1 Products + Services + Price Books — multi-price, currency, tax, stock levels, low-stock alerts.
3.2 Vendors + Purchase Orders → stock-in.
3.3 Invoices + Payments — partial payments, overdue auto-status (already in DB), GST/VAT, recurring invoices.
3.4 Stock movements UI.

### Phase 4 — Support
4.1 Tickets List + Summary (SLA badges, escalation level, due-at countdown).
4.2 FAQ module (categories, public/private).
4.3 Service Contracts (already in DB) — list/summary with renewal alerts.
4.4 Assets — CI tracking linked to contracts.
4.5 Customer Portal polish.

### Phase 5 — Projects
5.1 Projects + Milestones + Project Tasks (Gantt + Kanban toggle).
5.2 Time logs rollup to project.
5.3 Project reports.

### Phase 6 — Activities, Calendar, Documents, Campaigns
6.1 Unified Calendar (Events + Tasks + Meetings) with month/week/day/agenda + Google-Calendar-style drag-create.
6.2 Activity Feed across all modules.
6.3 Documents — folders, versioning, share links, preview.
6.4 Campaigns — Email + SMS, recipient lists, tracking, ROI.
6.5 Email Templates — variable picker, preview, multi-language.

### Phase 7 — Reports & Dashboards
7.1 Report builder UI — module → columns → filters → grouping → chart type → schedule.
7.2 Dashboard widgets — drag-drop grid, widget library (KPI, chart, list, funnel, gauge), per-user dashboards.
7.3 Scheduled email of reports.

### Phase 8 — Workflow Designer (the big one)
8.1 Visual rule list: per module, active/inactive toggle, run-count, last-run.
8.2 Rule editor with three panels:
   - **Trigger** — module + event (Create / Update / Field change / Time-based / Scheduled).
   - **Conditions** — AND/OR group builder, field-operator-value rows, dynamic field picker per module.
   - **Actions** — add row: Assign User, Update Field, Send Email (template picker), Create Task, Create Event, Webhook (URL+headers+body), Create Approval, Send SMS.
8.3 Backend already exists (`crm_workflow_rules`, `crm_workflow_dispatch`, `crm_run_action`, `crm_run_scheduled_workflows`) — this phase is **UI only** + a few new action types.
8.4 Test-run sandbox (dry-run a rule against a sample record).
8.5 Execution history viewer with filters and re-run.

### Phase 9 — Settings (admin)
9.1 Pick List editor — per module, per field, role-based values, color tags.
9.2 Field Layout editor — drag fields into Summary blocks, mark required/readonly per profile.
9.3 Assignment Rules — round-robin, load-balanced, territory-based (DB partly exists).
9.4 SLA Policies editor — response/resolution time per priority/category, business hours, holidays.
9.5 Profiles & Sharing — module permissions matrix (already in `crm_role_permissions`); add UI.
9.6 Webforms designer — drag-drop form builder + embed snippet (already partial).
9.7 Tax Management, Inventory Terms & Conditions, Currency.
9.8 API tokens for integrations.

### Phase 10 — Polish & extras
- Recycle Bin (soft-delete + restore across all modules).
- Tag manager (global tags table + filter by tag).
- Global Search v2 (cross-module, fuzzy, recent items).
- Keyboard shortcuts (Vtiger's `g+l`, `g+c`, `c` for create…).
- Mobile field-mode polish.

---

## Technical approach

**Reusable shells (build once, use everywhere)**
- `CrmListView<T>` — already exists; extend with Kanban toggle, saved-view persistence (`crm_saved_views` table), import/export, persisted column chooser per user.
- `CrmRecordView` — already exists; extend with related-list rail spec, inline edit, comments, audit timeline.
- `CrmQuickCreate` — already exists; per-module mandatory-field config.
- New: `CrmKanban<T>` (drag-drop with `@dnd-kit`), `CrmRelatedList`, `CrmInlineEdit`, `CrmFilterBuilder`, `CrmFieldLayoutRenderer`.

**New tables needed** (created phase-by-phase via migrations)
- `crm_saved_views` (user_id, module, name, filters, columns, sort, is_default)
- `crm_user_column_prefs` (user_id, module, columns[])
- `crm_pick_lists` + `crm_pick_list_values`
- `crm_field_layouts` (module, profile, blocks jsonb)
- `crm_assignment_rules`
- `crm_sla_policies` + `crm_business_hours` + `crm_holidays`
- `crm_tags` + `crm_entity_tags`
- `crm_recycle_bin` (or soft-delete `deleted_at` everywhere)
- `crm_dashboard_widgets`
- `crm_report_definitions`

**Backend already in place — reuse as-is**
- Audit (`crm_audit_log` + `crm_audit_trigger`)
- Workflows (`crm_workflow_rules`, `crm_workflow_dispatch`, `crm_run_action`, scheduled cron edge fn)
- Commissions, SLA breach notifier, lead routing, region workspaces
- RLS via `is_crm_member` / `has_crm_role` / `crm_has_permission`

**Stack**: stays React + Vite + Tailwind + Framer Motion + shadcn (no new framework). New deps likely: `@dnd-kit/core` (Kanban + form designer), `@tanstack/react-table` (already implicit) only if needed.

---

## Step 1 deliverable (what I'll build first when you approve)

Phase 1 in full — Leads, Contacts, Organizations brought to Vtiger 8.4 parity:
- New `crm_saved_views` + `crm_user_column_prefs` tables
- `CrmListView` extended (kanban toggle, saved views, persisted columns, mass actions, import/export)
- New `CrmKanban` component
- Rebuilt `CrmLeads` / `CrmLeadDetail`, `CrmContacts` / `CrmContactDetail`, `CrmOrganizations` / `CrmOrganizationDetail` on the new shell
- Lead Convert wizard
- Quick Create slide-over per module

After Step 1 ships I'll prompt you to start Phase 2, and so on through Phase 10.

---

Reply **Implement plan** to start Phase 1, or tell me to adjust scope/order first.
