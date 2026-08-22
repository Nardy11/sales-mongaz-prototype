CREATE TYPE telesales_call_state AS ENUM ('queued','in_progress','completed','escalated','cancelled');
CREATE TYPE telesales_call_outcome AS ENUM ('successful_contact','payment_promise','complaint','callback','no_answer','not_interested');

CREATE TABLE telesales_calls (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  owner_employee_id UUID NOT NULL REFERENCES employees(id),
  purpose TEXT NOT NULL CHECK (purpose IN ('supervisor_priority','collection','complaint_followup','reactivation','opportunity','routine')),
  priority_reason TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  state telesales_call_state NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_outcome telesales_call_outcome,
  last_result TEXT,
  evidence TEXT,
  resulting_commitment_id UUID REFERENCES commitments(id),
  source_type TEXT,
  source_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((state='in_progress' AND started_at IS NOT NULL) OR state<>'in_progress'),
  CHECK ((state IN ('completed','escalated') AND completed_at IS NOT NULL AND last_outcome IS NOT NULL AND evidence IS NOT NULL) OR state NOT IN ('completed','escalated'))
);

CREATE TABLE telesales_call_attempts (
  id UUID PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES telesales_calls(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  outcome telesales_call_outcome NOT NULL,
  result TEXT NOT NULL,
  evidence TEXT NOT NULL,
  resulting_call_id UUID REFERENCES telesales_calls(id),
  resulting_commitment_id UUID REFERENCES commitments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX telesales_queue_owner_due ON telesales_calls(owner_employee_id, state, scheduled_at, purpose);
CREATE INDEX telesales_attempt_call_day ON telesales_call_attempts(call_id, attempted_at, outcome);
