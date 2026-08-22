CREATE TYPE supervisor_exception_status AS ENUM ('open', 'actioned', 'resolved');
CREATE TYPE supervisor_action_kind AS ENUM ('acknowledge', 'escalate', 'reassign', 'follow_up', 'resolve');
CREATE TYPE supervisor_checkpoint_kind AS ENUM ('morning', 'midday', 'end_of_day');
CREATE TYPE supervisor_review_result AS ENUM ('ready', 'needs_improvement');
CREATE TYPE supervisor_coaching_status AS ENUM ('open', 'completed', 'cancelled');

CREATE TABLE supervisor_exceptions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  subject_employee_id UUID REFERENCES employees(id),
  customer_id UUID REFERENCES customers(id),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('urgent','watch','normal')),
  summary TEXT NOT NULL,
  evidence TEXT NOT NULL,
  required_next_action TEXT NOT NULL,
  status supervisor_exception_status NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolved_by_employee_id UUID REFERENCES employees(id),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, source_type, source_id, kind)
);
CREATE INDEX supervisor_exceptions_scope ON supervisor_exceptions (organization_id, team_id, status, created_at DESC);

CREATE TABLE supervisor_actions (
  id UUID PRIMARY KEY,
  exception_id UUID NOT NULL REFERENCES supervisor_exceptions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  actor_employee_id UUID NOT NULL REFERENCES employees(id),
  kind supervisor_action_kind NOT NULL,
  evidence TEXT NOT NULL,
  follow_up_at TIMESTAMPTZ,
  resulting_commitment_id UUID REFERENCES commitments(id),
  resolves_work BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX supervisor_actions_exception ON supervisor_actions (exception_id, created_at DESC);

CREATE TABLE supervisor_checkpoints (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  checkpoint supervisor_checkpoint_kind NOT NULL,
  actor_employee_id UUID NOT NULL REFERENCES employees(id),
  evidence TEXT NOT NULL,
  readiness_state TEXT NOT NULL CHECK (readiness_state IN ('ready','attention','risk')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX supervisor_checkpoints_scope ON supervisor_checkpoints (organization_id, team_id, checkpoint, created_at DESC);

CREATE TABLE supervisor_quality_reviews (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  reviewed_employee_id UUID NOT NULL REFERENCES employees(id),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  evidence TEXT NOT NULL,
  result supervisor_review_result NOT NULL,
  observation TEXT NOT NULL,
  actor_employee_id UUID NOT NULL REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX supervisor_quality_scope ON supervisor_quality_reviews (organization_id, team_id, created_at DESC);

CREATE TABLE supervisor_coaching_records (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  evidence TEXT NOT NULL,
  agreed_action TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status supervisor_coaching_status NOT NULL DEFAULT 'open',
  resulting_commitment_id UUID REFERENCES commitments(id),
  actor_employee_id UUID NOT NULL REFERENCES employees(id),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX supervisor_coaching_scope ON supervisor_coaching_records (organization_id, team_id, status, due_at);
