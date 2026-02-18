

## Make Testimonials Fully Dynamic

Replace the hardcoded testimonials with a database-driven system, including an admin editor to add, edit, reorder, and delete testimonials.

---

### What Changes

1. **New database table** (`testimonials`) to store testimonial entries with name, text, organization, display order, and visibility toggle.

2. **Updated Testimonials component** -- fetches from the database instead of using hardcoded data. Falls back to the existing hardcoded testimonials if the database is empty (so nothing breaks during migration).

3. **New admin editor** (`TestimonialsEditor.tsx`) -- lets admins add, edit, reorder, and delete testimonials. Follows the same pattern as the existing AboutEditor/WhyUsEditor.

4. **Admin dashboard update** -- adds a "Testimonials" tab to the admin panel.

5. **Seed the existing 4 testimonials** into the database so no content is lost.

---

### Technical Details

**1. Database Migration**

```sql
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization text DEFAULT '',
  text text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public read for visible testimonials
CREATE POLICY "Anyone can view visible testimonials"
  ON public.testimonials FOR SELECT USING (is_visible = true);

-- Admin full access
CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

**2. Seed existing testimonials** (via insert tool) with the 4 current hardcoded entries.

**3. `src/components/Testimonials.tsx`** -- fetch from `testimonials` table ordered by `display_order`. Keep hardcoded data as fallback while loading or if table is empty.

**4. `src/components/admin/TestimonialsEditor.tsx`** -- CRUD interface with:
- Add / edit / delete testimonials
- Reorder via display_order
- Toggle visibility
- Same Card-based layout as other editors

**5. `src/pages/Admin.tsx`** -- add a "Testimonials" tab between "Why Us" and "Services".

