CREATE TABLE organizations (id UUID PRIMARY KEY, name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE teams (id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id), name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TYPE operational_role AS ENUM ('sales_representative', 'telesales_employee', 'telesales_supervisor', 'sales_manager');
CREATE TABLE employees (id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id), team_id UUID REFERENCES teams(id), email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, role operational_role NOT NULL, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE sessions (id UUID PRIMARY KEY, employee_id UUID NOT NULL REFERENCES employees(id), csrf_token_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE audit_events (id UUID PRIMARY KEY, actor_employee_id UUID REFERENCES employees(id), action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT, before_data JSONB, after_data JSONB, reason TEXT, correlation_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX sessions_active_lookup ON sessions (id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX audit_events_resource_lookup ON audit_events (resource_type, resource_id, created_at DESC);
