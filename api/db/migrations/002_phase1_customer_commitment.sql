CREATE TYPE customer_classification AS ENUM ('gold', 'silver', 'follow_up');
CREATE TYPE customer_operational_status AS ENUM ('normal', 'attention', 'risk');
CREATE TYPE commitment_status AS ENUM ('open', 'completed', 'cancelled');
CREATE TYPE commitment_urgency AS ENUM ('normal', 'caution', 'urgent');

CREATE TABLE customers (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  owner_employee_id UUID NOT NULL REFERENCES employees(id),
  owner_team_id UUID REFERENCES teams(id),
  customer_code TEXT UNIQUE,
  name TEXT NOT NULL,
  classification customer_classification NOT NULL,
  operational_status customer_operational_status NOT NULL DEFAULT 'normal',
  is_active BOOLEAN NOT NULL DEFAULT true,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  operational_notes TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX customers_scope_lookup ON customers (organization_id, owner_team_id, owner_employee_id, is_active);
CREATE INDEX customers_name_search ON customers (organization_id, name);

CREATE TABLE commitments (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  owner_employee_id UUID NOT NULL REFERENCES employees(id),
  owner_team_id UUID REFERENCES teams(id),
  kind TEXT NOT NULL CHECK (kind IN ('follow_up', 'customer_care', 'internal')),
  title TEXT NOT NULL,
  source_type TEXT,
  source_id TEXT,
  source_evidence TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  status commitment_status NOT NULL DEFAULT 'open',
  urgency commitment_urgency NOT NULL DEFAULT 'normal',
  completed_at TIMESTAMPTZ,
  completion_evidence TEXT,
  resulting_commitment_id UUID REFERENCES commitments(id),
  idempotency_key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT commitment_completion_consistency CHECK ((status = 'completed' AND completed_at IS NOT NULL AND completion_evidence IS NOT NULL) OR (status <> 'completed' AND completed_at IS NULL)),
  CONSTRAINT commitment_resulting_only_when_completed CHECK (resulting_commitment_id IS NULL OR status = 'completed'),
  CONSTRAINT commitment_idempotency_unique UNIQUE (owner_employee_id, idempotency_key)
);
CREATE INDEX commitments_customer_rail ON commitments (customer_id, due_at DESC);
CREATE INDEX commitments_owner_open ON commitments (owner_employee_id, status, due_at);
