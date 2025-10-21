---
description: "Task list for complete PNL System implementation"
---

# Tasks: PNL System Complete Implementation

**Input**: All feature specifications from `/specs/[###-feature-name]/` and master plan
**Prerequisites**: plan.md (completed), all spec.md files (completed for user stories)

**Organization**: Tasks are organized by implementation phases and user stories to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US-CSV1, US-CSV2, etc.)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create enhanced project structure per master plan (api/, services/, database/, public/)
- [ ] T002 [P] Update package.json with all required dependencies (multer, papaparse, openai, @supabase/supabase-js, google-auth-library, express, cors, helmet, dotenv)
- [ ] T003 [P] Configure linting and formatting tools - add ESLint config with Node.js rules and Prettier configuration for consistent code formatting
- [ ] T004 [P] Setup .env.example with all required environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ALLOWED_EMAILS, NODE_ENV, DEV_MODE)
- [ ] T005 Create basic project README with setup instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation
- [ ] T006 Setup Supabase project and get service keys
- [ ] T007 Create database/migrations/001_initial_schema.sql with all 5 tables (categories, categorization_rules, transactions, pnl_data, marketing_metrics) including proper foreign keys and indexes
- [ ] T008 Create database/migrations/002_rls_policies.sql with security policies - enable RLS on all tables and create policies for authenticated users only
- [ ] T009 Implement database/supabase.js with client configuration
- [ ] T010 Create database/queries/ directory structure for parameterized queries

### Authentication Foundation  
- [ ] T011 [P] Setup Google OAuth configuration in api/auth.js
- [ ] T012 [P] Implement development mode bypass logic in server.js
- [ ] T013 [P] Create checkAuth middleware for protected endpoints
- [ ] T014 [P] Configure session management and JWT handling

### Server Foundation
- [ ] T015 Setup Express server with middleware (cors for Render/localhost, helmet for security headers, express.json, multer for file uploads)
- [ ] T016 Configure error handling framework with proper HTTP status codes - create centralized error handler middleware with try-catch for all routes
- [ ] T017 Setup logging system with console.log for development and structured logging for production - add request logging and error tracking
- [ ] T018 Add health check endpoint for Render deployment
- [ ] T019 Configure static file serving for frontend assets

### Frontend Foundation
- [ ] T020 Update public/index.html with Google OAuth integration
- [ ] T021 Update public/dashboard.html with basic PNL table structure
- [ ] T022 Update public/script.js with authentication flow
- [ ] T023 Update public/styles.css with responsive design

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story CSV1 - Upload and Process Bank CSV File (Priority: P1) 🎯 MVP

**Goal**: Core CSV file upload and processing functionality with AI categorization

**Independent Test**: Upload test CSV file with operations, verify all payments are processed and categorized correctly

### Implementation for User Story CSV1
- [ ] T024 [P] [US-CSV1] Implement file upload handling in api/csv.js with Multer
- [ ] T025 [P] [US-CSV1] Create services/csvProcessor.js for CSV parsing logic - implement PapaParse integration to handle Revolut and Polish bank CSV formats with proper column mapping
- [ ] T026 [P] [US-CSV1] Implement currency conversion in services/csvProcessor.js - integrate reliable exchange rate API (e.g., exchangerate-api.com, fixer.io) with real-time rates, fallback mechanism, and historical rate support for CSV operations with past dates
- [ ] T027 [US-CSV1] Add CSV parsing validation and error handling in api/csv.js (depends on T025)
- [ ] T028 [US-CSV1] Create database/queries/transactions.js for transaction storage
- [ ] T029 [US-CSV1] Implement POST /api/analyze-csv endpoint (depends on T024, T025, T027)

**Checkpoint**: At this point, User Story CSV1 should be fully functional and testable independently

---

## Phase 4: User Story CAT1 - Category Management (Priority: P1) 🎯 MVP

**Goal**: CRUD operations for income and expense categories with AI discovery

**Independent Test**: Create, edit, delete categories and verify AI category discovery on first CSV upload

### Implementation for User Story CAT1
- [ ] T030 [P] [US-CAT1] Create database/queries/categories.js for category operations
- [ ] T031 [P] [US-CAT1] Implement services/categoryService.js for business logic
- [ ] T032 [US-CAT1] Create api/categories.js with CRUD endpoints (depends on T030, T031)
- [ ] T033 [US-CAT1] Add category type validation (income vs expense) in services/categoryService.js
- [ ] T034 [US-CAT1] Implement category management UI in dashboard.html frontend
- [ ] T035 [US-CAT1] Add category selection controls in dashboard.html

**Checkpoint**: Category management should be fully functional and ready for AI integration

---

## Phase 5: User Story CSV2 - AI-Powered Categorization (Priority: P1) 🎯 MVP

**Goal**: ChatGPT integration for automatic transaction categorization with rule fallback

**Independent Test**: Process CSV file and verify ChatGPT categorizes operations, with "Other" fallback

### Implementation for User Story CSV2
- [ ] T036 [P] [US-CSV2] Setup OpenAI API client in services/csvProcessor.js
- [ ] T037 [US-CSV2] Implement ChatGPT prompt engineering for categorization in services/csvProcessor.js (depends on T036) - create prompts that analyze transaction descriptions and assign income/expense categories with specific subcategories
- [ ] T038 [US-CSV2] Add "Other" category fallback logic in services/csvProcessor.js - when ChatGPT cannot categorize an expense transaction, automatically assign to "Other" category
- [ ] T039 [US-CSV2] Integrate AI categorization with CSV processing flow (depends on T027, T037)
- [ ] T040 [US-CSV2] Add error handling for OpenAI API failures
- [ ] T041 [US-CSV2] Implement demo mode for development without OpenAI API

**Checkpoint**: AI categorization should work with fallback and error handling

---

## Phase 6: User Story RULE1 - Categorization Rules (Priority: P1) 🎯 MVP

**Goal**: Rule-based categorization system with automatic rule creation from user corrections

**Independent Test**: Edit categories during CSV preview, verify rules are created and applied to subsequent uploads

### Implementation for User Story RULE1
- [ ] T042 [P] [US-RULE1] Create database/queries/rules.js for rule operations
- [ ] T043 [P] [US-RULE1] Implement services/ruleEngine.js for pattern matching - create engine that matches transaction descriptions against stored rules with exact and partial matching
- [ ] T044 [US-RULE1] Create api/rules.js with CRUD endpoints (depends on T042, T043)
- [ ] T045 [US-RULE1] Add rule creation from user corrections in services/csvProcessor.js (depends on T043) - when user edits category in preview, automatically create rule mapping description pattern to selected category
- [ ] T046 [US-RULE1] Implement rule priority handling for multiple matches - when multiple rules match, use most specific match or most frequently used rule
- [ ] T047 [US-RULE1] Add rule management UI in dashboard.html

**Checkpoint**: Rules engine should apply before ChatGPT and create rules from user actions

---

## Phase 7: User Story CSV3 - Pre-Upload Review and Year-Month Selection (Priority: P1) 🎯 MVP

**Goal**: User can review and edit categorizations before upload, with year-month selection

**Independent Test**: Upload CSV, edit categories in preview, select year-month, verify correct storage

### Implementation for User Story CSV3
- [ ] T048 [P] [US-CSV3] Create pre-upload review UI in dashboard.html
- [ ] T049 [US-CSV3] Implement year-month selection interface in dashboard.html
- [ ] T050 [US-CSV3] Add GET /api/operations endpoint for preview data
- [ ] T051 [US-CSV3] Update transaction storage to include year-month in database/queries/transactions.js
- [ ] T052 [US-CSV3] Modify CSV processing flow to require year-month selection (depends on T050, T051)

**Checkpoint**: Complete CSV workflow with preview and year-month organization

---

## Phase 8: User Story PNL1 - Editable PNL Table (Priority: P1) 🎯 MVP

**Goal**: Auto-populate PNL table from CSV data with manual editing capabilities

**Independent Test**: Process CSV files for different months, verify PNL table auto-populates and allows editing

### Implementation for User Story PNL1
- [ ] T053 [P] [US-PNL1] Create database/queries/pnl_data.js for PNL table operations
- [ ] T054 [P] [US-PNL1] Implement services/pnlCalculator.js for data aggregation
- [ ] T055 [US-PNL1] Create api/pnl.js with GET/POST endpoints (depends on T053, T054)
- [ ] T056 [US-PNL1] Build PNL table UI in dashboard.html with 12 monthly columns
- [ ] T057 [US-PNL1] Implement editable cells with formula protection in frontend
- [ ] T058 [US-PNL1] Add auto-population from transaction data (depends on T054)
- [ ] T059 [US-PNL1] Implement real-time calculation updates in frontend

**Checkpoint**: PNL table should auto-populate and support manual editing with formula protection

---

## Phase 9: User Story YEAR1 - Year Selection and Creation (Priority: P1) 🎯 MVP

**Goal**: Multi-year support with year selector and automatic table generation

**Independent Test**: Create new year, verify empty PNL table generated, switch between years

### Implementation for User Story YEAR1
- [ ] T060 [P] [US-YEAR1] Add year context to all database queries and API endpoints
- [ ] T061 [US-YEAR1] Implement year selector UI in dashboard.html
- [ ] T062 [US-YEAR1] Add year creation logic in api/pnl.js
- [ ] T063 [US-YEAR1] Update all PNL operations to filter by selected year
- [ ] T064 [US-YEAR1] Implement year-specific data isolation across all features

**Checkpoint**: Multi-year support should work across all existing features

---

## Phase 10: User Story ANALY1 - PNL Analytics and Calculations (Priority: P2)

**Goal**: Profit/loss calculations, balance comparisons, and ROI metrics

**Independent Test**: Enter test data in PNL table, verify automatic calculations display correctly

### Implementation for User Story ANALY1
- [ ] T065 [P] [US-ANALY1] Extend services/pnlCalculator.js with analytics calculations
- [ ] T066 [P] [US-ANALY1] Add profit/loss calculation logic
- [ ] T067 [P] [US-ANALY1] Implement month-over-month balance comparison
- [ ] T068 [US-ANALY1] Add ROI/profitability ratio calculations (depends on T065, T066)
- [ ] T069 [US-ANALY1] Create GET /api/pnl-analytics endpoint
- [ ] T070 [US-ANALY1] Add analytics display section in dashboard.html

**Checkpoint**: Analytics calculations should update automatically with PNL data changes

---

## Phase 11: User Story MARKET1 - Marketing Metrics Section (Priority: P2)

**Goal**: Separate marketing metrics section with manual data entry

**Independent Test**: Enter marketing data, verify isolation from financial columns

### Implementation for User Story MARKET1
- [ ] T071 [P] [US-MARKET1] Create database/queries/marketing.js for marketing data
- [ ] T072 [P] [US-MARKET1] Implement services/marketingService.js for business logic
- [ ] T073 [US-MARKET1] Create api/marketing.js with GET/POST endpoints (depends on T071, T072)
- [ ] T074 [US-MARKET1] Add marketing section to dashboard.html UI
- [ ] T075 [US-MARKET1] Implement manual data entry fields for all marketing metrics
- [ ] T076 [US-MARKET1] Add data isolation validation to prevent mixing with financial data

**Checkpoint**: Marketing section should work independently of financial data

---

## Phase 11.5: User Story CURR1 - Enhanced Currency Conversion (Priority: P1) 🎯 MVP

**Goal**: Robust real-time currency conversion with reliable API integration and fallback mechanisms

**Independent Test**: Upload CSV with mixed currencies (EUR, USD, PLN), verify accurate conversion using live rates with API fallback handling

### Implementation for User Story CURR1
- [ ] T068.5 [P] [US-CURR1] Research and select reliable exchange rate API (exchangerate-api.com, fixer.io, etc.) with real-time and historical rate support
- [ ] T069.5 [P] [US-CURR1] Implement services/currencyService.js for exchange rate fetching with retry logic and error handling
- [ ] T070.5 [P] [US-CURR1] Add exchange rate caching mechanism to avoid excessive API calls during CSV processing
- [ ] T071.5 [US-CURR1] Implement historical exchange rate support for operations with past dates
- [ ] T072.5 [US-CURR1] Create fallback exchange rate system when primary API is unavailable
- [ ] T073.5 [US-CURR1] Update services/csvProcessor.js to use new currency service for accurate real-time conversion
- [ ] T074.5 [US-CURR1] Add exchange rate validation and audit logging for debugging and compliance

**Checkpoint**: Currency conversion should be reliable, accurate, and fault-tolerant

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T077 [P] Add comprehensive error handling across all API endpoints
- [ ] T078 [P] Implement proper logging for all business operations
- [ ] T079 Add input validation and sanitization for all user inputs
- [ ] T080 [P] Optimize database queries for Render platform constraints
- [ ] T081 Add loading states and user feedback in frontend
- [ ] T082 Implement proper CSS styling and responsive design
- [ ] T083 [P] Add environment configuration validation
- [ ] T084 Security hardening and CORS configuration review

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - CSV processing (CSV1, CSV2, CSV3) can be implemented in sequence
  - Categories (CAT1) can run in parallel with CSV features after foundation
  - Currency conversion (CURR1) depends on CSV1 completion
  - Rules (RULE1) depends on CSV2 completion
  - PNL table (PNL1) depends on CSV processing completion
  - Year management (YEAR1) depends on PNL table completion
  - Analytics (ANALY1) depends on PNL table completion
  - Marketing (MARKET1) can run in parallel with analytics

### User Story Dependencies

- **CSV1 → CURR1 → CSV2 → CSV3**: Sequential CSV processing workflow with currency conversion
- **CAT1**: Can start after foundation, needed for CSV2
- **CURR1**: Depends on CSV1 completion, needed for CSV2 and CSV3
- **RULE1**: Depends on CSV2 completion
- **PNL1**: Depends on CSV3 completion (needs year-month data)
- **YEAR1**: Depends on PNL1 completion
- **ANALY1**: Depends on PNL1 completion
- **MARKET1**: Independent, can run in parallel

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- CAT1, RULE1, MARKET1 can be worked on in parallel after their dependencies
- ANALY1 and MARKET1 can run in parallel
- All database query files marked [P] can be created in parallel
- All service files marked [P] can be implemented in parallel

---

## Implementation Strategy

### MVP First (Core CSV Processing)
1. Complete Setup + Foundational phases
2. Implement CSV1 + CAT1 + CSV2 + RULE1 + CSV3 → Full CSV workflow
3. Add PNL1 + YEAR1 → Basic PNL reporting
4. **STOP and VALIDATE**: Deploy and test core functionality

### Incremental Delivery
1. CSV Processing MVP (Phases 1-7)
2. PNL Table & Year Management (Phases 8-9)  
3. Analytics & Marketing (Phases 10-11)
4. Polish & Optimization (Phase 12)

### Critical Success Factors
- **Foundation First**: Phase 2 must be 100% complete before user stories
- **Test Each Phase**: Validate functionality after each checkpoint
- **Database Schema**: All tables and relationships must be correct from start
- **Error Handling**: Implement robust error handling throughout

---

## Notes

- Each user story should be independently completable and testable
- All [P] tasks can run in parallel by different developers
- Database migrations must be applied in correct order
- Environment variables must be properly configured
- Frontend should be responsive and accessible
- API endpoints should return proper HTTP status codes
- All user inputs must be validated and sanitized
