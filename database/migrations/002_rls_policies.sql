-- PNL System RLS (Row Level Security) Policies
-- Migration: 002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pnl_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations for authenticated users
-- In production, you may want to add user-specific policies

-- Categories policies
CREATE POLICY "Allow all operations on categories for authenticated users"
ON categories FOR ALL
USING (auth.role() = 'authenticated');

-- Categorization rules policies
CREATE POLICY "Allow all operations on categorization_rules for authenticated users"
ON categorization_rules FOR ALL
USING (auth.role() = 'authenticated');

-- Transactions policies
CREATE POLICY "Allow all operations on transactions for authenticated users"
ON transactions FOR ALL
USING (auth.role() = 'authenticated');

-- PNL data policies
CREATE POLICY "Allow all operations on pnl_data for authenticated users"
ON pnl_data FOR ALL
USING (auth.role() = 'authenticated');

-- Marketing metrics policies
CREATE POLICY "Allow all operations on marketing_metrics for authenticated users"
ON marketing_metrics FOR ALL
USING (auth.role() = 'authenticated');

-- Service role bypass policies (for server-side operations)
CREATE POLICY "Service role can do everything on categories"
ON categories FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on categorization_rules"
ON categorization_rules FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on transactions"
ON transactions FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on pnl_data"
ON pnl_data FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on marketing_metrics"
ON marketing_metrics FOR ALL
USING (auth.role() = 'service_role');
