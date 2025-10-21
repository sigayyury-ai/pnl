# Implementation Plan: PNL System Master Plan

**Branch**: `master-plan` | **Date**: 2025-10-21 | **Spec**: Integration of all PNL features
**Input**: All feature specifications in `/specs/[###-feature-name]/spec.md`

## Summary

Comprehensive implementation plan for complete PNL (Profit & Loss) reporting system with Node.js backend, Supabase database, and modern web frontend. The system handles CSV bank file processing, AI-powered categorization, yearly PNL management, and marketing metrics tracking.

## Technical Context

**Language/Version**: Node.js 18.0.0+
**Primary Dependencies**: Express.js, @supabase/supabase-js, OpenAI API, Google OAuth, Multer, PapaParse
**Storage**: Supabase (PostgreSQL) with service role and RLS policies
**Testing**: Jest for unit testing, manual testing for CSV processing
**Target Platform**: Render.com deployment with local development support
**Project Type**: Web application (backend API + frontend SPA)
**Performance Goals**: 30-second CSV processing for 100 transactions, 2-second UI responses
**Constraints**: Render free tier limits, OpenAI API rate limits, Supabase query limits
**Scale/Scope**: Single-tenant business application with yearly financial data

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Required Gates** (from `/memory/constitution.md`):
- ✅ **User-Centric**: All features solve real business problems with defined user scenarios
- ✅ **Spec-Driven**: Complete specifications exist for all 7 core features with acceptance criteria  
- ✅ **Technical Standards**: Implementation follows Node.js/Supabase/Render stack
- ✅ **Code Quality**: Error handling and logging planned for all components
- ✅ **Data Integrity**: Financial data traceability and audit trails maintained
- ✅ **Security**: Google OAuth for production, development bypass configured
- ✅ **Performance**: Render optimization and efficient Supabase queries planned

**Gate Status**: All gates pass - ready for implementation planning

## Project Structure

### Documentation Structure

```
specs/
├── master-plan/
│   └── plan.md              # This master plan
├── 002-csv-bank-processing/
├── 003-editable-pnl-table/
├── 004-category-management/
├── 005-pnl-analytics/
├── 006-categorization-rules/
├── 007-yearly-pnl-management/
└── 008-marketing-metrics-section/
```

### Source Code Structure

```
pnl-system/
├── api/                     # Backend API routes
│   ├── auth.js             # Google OAuth handling
│   ├── csv.js              # CSV file processing
│   ├── pnl.js              # PNL data management
│   ├── categories.js       # Category management
│   ├── rules.js            # Categorization rules
│   └── marketing.js        # Marketing metrics
├── services/                # Business logic services
│   ├── csvProcessor.js     # CSV parsing and AI categorization
│   ├── pnlCalculator.js    # PNL calculations and analytics
│   ├── categoryService.js  # Category management logic
│   ├── ruleEngine.js       # Rule-based categorization
│   └── marketingService.js # Marketing metrics handling
├── database/                # Database access layer
│   ├── supabase.js         # Supabase client and configuration
│   ├── migrations/         # Database schema migrations
│   └── queries/            # Parameterized queries
├── public/                  # Frontend static files
│   ├── index.html          # Authentication page
│   ├── dashboard.html      # Main PNL dashboard
│   ├── script.js           # Frontend JavaScript
│   └── styles.css          # Frontend styling
├── server.js               # Main Express server
├── package.json            # Dependencies and scripts
└── .env.example            # Environment variables template
```

**Structure Decision**: Single Node.js application with Express backend serving static frontend, following current project structure while adding organized service layers.

## Feature Implementation Order

### Phase 1: Core Infrastructure (Weeks 1-2)
**Priority**: Foundation for all other features

1. **Database Schema Setup** (High Priority)
   - Supabase project configuration
   - Tables: categories, categorization_rules, transactions, pnl_data, marketing_metrics
   - RLS policies for data security
   - Migration scripts

2. **Authentication & Authorization** (High Priority)
   - Google OAuth integration
   - Development mode bypass
   - Session management
   - Protected API endpoints

3. **Basic API Structure** (Medium Priority)
   - Express server setup with middleware
   - CORS and security headers
   - Error handling framework
   - Logging system

### Phase 2: Core PNL Features (Weeks 3-5)
**Priority**: Essential business functionality

4. **CSV Bank Processing** (`002-csv-bank-processing`)
   - File upload handling with Multer
   - CSV parsing with PapaParse
   - Currency conversion API integration
   - OpenAI API for transaction categorization
   - "Other" category fallback logic

5. **Category Management** (`004-category-management`)
   - CRUD operations for income/expense categories
   - AI-powered category discovery
   - Category validation and type enforcement
   - Frontend category management interface

6. **Categorization Rules** (`006-categorization-rules`)
   - Rule creation from user corrections
   - Pattern matching engine
   - Rule priority handling
   - Rule management interface

### Phase 3: PNL Table & Analytics (Weeks 6-7)
**Priority**: Core reporting functionality

7. **Editable PNL Table** (`003-editable-pnl-table`)
   - Year-month data organization
   - Auto-population from CSV data
   - Manual cell editing with formula protection
   - Real-time calculation updates

8. **PNL Analytics** (`005-pnl-analytics`)
   - Profit/loss calculations
   - Month-over-month balance comparisons
   - ROI/profitability ratio calculations
   - Visual indicators for performance metrics

### Phase 4: Advanced Features (Weeks 8-9)
**Priority**: Business value enhancement

9. **Yearly PNL Management** (`007-yearly-pnl-management`)
   - Year selector and creation
   - Year-context data isolation
   - Year-month selection for CSV uploads
   - Multi-year navigation

10. **Marketing Metrics Section** (`008-marketing-metrics-section`)
    - Marketing section in PNL table
    - Manual data entry fields
    - Data isolation from financial columns
    - Marketing-specific calculations

## Database Schema Design

### Core Tables

```sql
-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categorization rules table
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  amount_pln DECIMAL(15,2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PNL data table
CREATE TABLE pnl_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  category_id UUID REFERENCES categories(id),
  amount DECIMAL(15,2) NOT NULL,
  is_manual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketing metrics table
CREATE TABLE marketing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  leads_count INTEGER DEFAULT 0,
  deals_count INTEGER DEFAULT 0,
  ad_spend DECIMAL(15,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  cost_per_lead DECIMAL(15,2) DEFAULT 0,
  cost_per_deal DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints Design

### Core Endpoints

```
GET    /api/config              # Get Google Client ID and allowed emails
POST   /api/auth/google         # Google OAuth callback

GET    /api/categories          # Get all categories
POST   /api/categories          # Create new category
PUT    /api/categories/:id      # Update category
DELETE /api/categories/:id      # Delete category

GET    /api/rules               # Get categorization rules
POST   /api/rules               # Create new rule
PUT    /api/rules/:id           # Update rule
DELETE /api/rules/:id           # Delete rule

POST   /api/analyze-csv         # Upload and process CSV file
GET    /api/operations          # Get transactions for preview

GET    /api/pnl                 # Get PNL table data
POST   /api/pnl                 # Update PNL cell values
GET    /api/pnl-analytics       # Get calculated analytics

GET    /api/marketing           # Get marketing metrics
POST   /api/marketing           # Update marketing metrics
```

## Implementation Strategy

### Development Approach

1. **Incremental Development**: Each feature builds on previous foundation
2. **Database-First**: Schema and migrations defined before implementation
3. **API-First**: Backend endpoints implemented before frontend integration
4. **Test-Driven**: Manual testing for CSV processing, unit tests for calculations

### Risk Mitigation

1. **OpenAI API Dependencies**: Demo mode fallback for development
2. **Currency Conversion**: Caching and error handling for external APIs
3. **File Upload Limits**: Multer limits and validation
4. **Supabase Limits**: Query optimization and pagination

### Performance Considerations

1. **CSV Processing**: Streaming parser for large files
2. **Database Queries**: Indexing on year, month, category_id
3. **Frontend**: Minimal dependencies, vanilla JavaScript
4. **Caching**: In-memory caching for frequently accessed data

## Dependencies & Integration Points

### External Services
- **Supabase**: Database and authentication
- **OpenAI API**: Transaction categorization
- **Google OAuth**: User authentication
- **Currency API**: Real-time exchange rates

### Internal Dependencies
- CSV Processing → Category Management → Rules Engine
- PNL Table ← All data sources (CSV, manual entries, marketing)
- Analytics ← PNL Table data calculations

## Success Metrics

### Technical Metrics
- CSV processing: <30 seconds for 100 transactions
- API response time: <2 seconds for all endpoints
- UI responsiveness: <1 second for all interactions

### Business Metrics
- 95%+ accuracy in automatic categorization
- Zero data loss during CSV processing
- 100% data integrity across all features

This master plan provides the foundation for implementing all PNL system features in a coordinated, efficient manner while maintaining system integrity and performance standards.
