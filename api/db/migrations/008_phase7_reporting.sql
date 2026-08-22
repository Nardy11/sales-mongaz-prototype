CREATE TYPE reporting_definition_status AS ENUM ('TEST_DEMO');
CREATE TYPE reporting_target_scope AS ENUM ('organization','team','employee');

CREATE TABLE reporting_metric_definitions (
  id UUID PRIMARY KEY,
  metric_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  definition_status reporting_definition_status NOT NULL DEFAULT 'TEST_DEMO',
  numerator_definition TEXT NOT NULL,
  denominator_definition TEXT,
  inclusion_rules TEXT NOT NULL,
  exclusion_rules TEXT NOT NULL,
  time_boundary TEXT NOT NULL,
  unit TEXT NOT NULL,
  source_description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE reporting_targets (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  metric_definition_id UUID NOT NULL REFERENCES reporting_metric_definitions(id),
  scope reporting_target_scope NOT NULL,
  scope_id UUID,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  value NUMERIC NOT NULL CHECK (value >= 0),
  unit TEXT NOT NULL,
  definition_status reporting_definition_status NOT NULL DEFAULT 'TEST_DEMO',
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_by_employee_id UUID NOT NULL REFERENCES employees(id),
  idempotency_key UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end > period_start),
  UNIQUE (organization_id, idempotency_key)
);
CREATE INDEX reporting_targets_effective ON reporting_targets (organization_id, metric_definition_id, period_start, period_end);
