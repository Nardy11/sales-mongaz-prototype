ALTER TYPE complaint_status ADD VALUE IF NOT EXISTS 'classified' BEFORE 'assigned';

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS requires_credit_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS responsible_party TEXT,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS required_next_action TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closure_evidence TEXT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_by_employee_id UUID REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS corrective_action TEXT,
  ADD COLUMN IF NOT EXISTS resolution_evidence TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closure_evidence TEXT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_by_employee_id UUID REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE order_lifecycle_events (
 id UUID PRIMARY KEY, order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
 organization_id UUID NOT NULL REFERENCES organizations(id), actor_employee_id UUID NOT NULL REFERENCES employees(id),
 from_status order_lifecycle_status NOT NULL, to_status order_lifecycle_status NOT NULL,
 responsible_party TEXT, evidence TEXT NOT NULL, follow_up_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE complaint_lifecycle_events (
 id UUID PRIMARY KEY, complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
 organization_id UUID NOT NULL REFERENCES organizations(id), actor_employee_id UUID NOT NULL REFERENCES employees(id),
 from_status complaint_status NOT NULL, to_status complaint_status NOT NULL,
 responsible_party TEXT, evidence TEXT NOT NULL, follow_up_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX order_lifecycle_events_order ON order_lifecycle_events(order_id,created_at);
CREATE INDEX complaint_lifecycle_events_complaint ON complaint_lifecycle_events(complaint_id,created_at);
