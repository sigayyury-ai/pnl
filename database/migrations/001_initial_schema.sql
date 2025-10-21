-- PNL System Database Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table for income and expense categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categorization rules table for automatic categorization
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  UNIQUE(pattern, category_id)
);

-- Transactions table for CSV imported bank transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  amount_pln DECIMAL(15,2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_transactions_year_month (year, month),
  INDEX idx_transactions_category (category_id),
  INDEX idx_transactions_date (date)
);

-- PNL data table for aggregated yearly/monthly data
CREATE TABLE pnl_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_manual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(year, month, category_id),
  INDEX idx_pnl_data_year_month (year, month),
  INDEX idx_pnl_data_category (category_id)
);

-- Marketing metrics table for marketing performance data
CREATE TABLE marketing_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  leads_count INTEGER DEFAULT 0,
  deals_count INTEGER DEFAULT 0,
  ad_spend DECIMAL(15,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  cost_per_lead DECIMAL(15,2) DEFAULT 0,
  cost_per_deal DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(year),
  INDEX idx_marketing_metrics_year (year)
);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pnl_data_updated_at BEFORE UPDATE ON pnl_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_metrics_updated_at BEFORE UPDATE ON marketing_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default "Other" category for uncategorized expenses
INSERT INTO categories (name, type, description) VALUES ('Other', 'expense', 'Default category for expenses that could not be automatically categorized');
