CREATE TYPE manager_priority_status AS ENUM ('open', 'actioned', 'resolved', 'cancelled');
CREATE TYPE manager_decision_kind AS ENUM ('decision', 'resolve');

CREATE TABLE manager_priorities (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  source_type TEXT,
  source_id TEXT,
  owner_employee_id UUID REFERENCES employees(id),
  owner_team_id UUID REFERENCES teams(id),
  title TEXT NOT NULL,
  reason TEXT NOT NULL,
  success_condition TEXT NOT NULL,
  evidence TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('normal','caution','urgent')),
  idempotency_key UUID NOT NULL,
  status manager_priority_status NOT NULL DEFAULT 'open',
  resulting_commitment_id UUID REFERENCES commitments(id),
  resolved_at TIMESTAMPTZ,
  resolved_by_employee_id UUID REFERENCES employees(id),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX manager_priorities_scope ON manager_priorities (organization_id, status, due_at);
CREATE UNIQUE INDEX manager_priorities_idempotency ON manager_priorities (organization_id, idempotency_key);

CREATE TABLE manager_decisions (
  id UUID PRIMARY KEY,
  priority_id UUID NOT NULL REFERENCES manager_priorities(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  actor_employee_id UUID NOT NULL REFERENCES employees(id),
  kind manager_decision_kind NOT NULL,
  evidence TEXT NOT NULL,
  follow_up_at TIMESTAMPTZ,
  resulting_commitment_id UUID REFERENCES commitments(id),
  resolves_work BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX manager_decisions_priority ON manager_decisions (priority_id, created_at DESC);
