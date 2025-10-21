# Task Breakdown: PDF Export Feature

**Feature**: [001-pdf-export](./spec.md)  
**Plan**: [plan.md](./plan.md)  
**Created**: 2025-10-21

## User Story 1: Export Monthly PNL Report (P1)

### Phase 1: Backend Setup
- [ ] **Task 1.1**: Install puppeteer dependency  
  **File**: `package.json`  
  **Dependencies**: None  
  **Test**: `npm install` succeeds and puppeteer is available

- [ ] **Task 1.2**: Create PDF HTML template  
  **File**: `templates/pdf-template.html` (new)  
  **Dependencies**: Task 1.1  
  **Test**: Template renders basic PNL layout

- [ ] **Task 1.3**: Implement PDF generation endpoint  
  **File**: `server.js` (modify existing)  
  **Dependencies**: Tasks 1.1, 1.2  
  **Test**: POST `/api/export-pdf` returns PDF file for valid month

- [ ] **Task 1.4**: Add error handling for missing data  
  **File**: `server.js` (modify existing)  
  **Dependencies**: Task 1.3  
  **Test**: Endpoint returns proper error for months without data

### Phase 2: Frontend Integration
- [ ] **Task 2.1**: Add Export PDF button to dashboard  
  **File**: `dashboard.html` (modify existing)  
  **Dependencies**: None  
  **Test**: Button appears in UI

- [ ] **Task 2.2**: Implement client-side PDF request logic  
  **File**: `script.js` (modify existing)  
  **Dependencies**: Tasks 1.3, 2.1  
  **Test**: Button click triggers API call and initiates download

- [ ] **Task 2.3**: Add loading states and error handling  
  **File**: `script.js` (modify existing)  
  **Dependencies**: Task 2.2  
  **Test**: User sees loading spinner and proper error messages

## User Story 2: PDF Formatting and Branding (P2)

### Phase 3: Styling and Polish
- [ ] **Task 3.1**: Style PDF template with company branding  
  **File**: `templates/pdf-template.html` (modify existing)  
  **Dependencies**: Task 1.2  
  **Test**: PDF includes logo and professional formatting

- [ ] **Task 3.2**: Format PNL tables in PDF  
  **File**: `templates/pdf-template.html` (modify existing)  
  **Dependencies**: Task 3.1  
  **Test**: Tables are properly formatted and readable

- [ ] **Task 3.3**: Add PDF filename with date  
  **File**: `server.js` (modify existing)  
  **Dependencies**: Task 1.3  
  **Test**: Generated PDF has format "PNL_Report_YYYY_MM.pdf"

## Checkpoints

### Checkpoint 1: Backend Ready
**When**: After completing all Phase 1 tasks  
**Validation**: 
- PDF endpoint responds correctly for test month
- Error handling works for empty months
- Puppeteer generates valid PDF files

### Checkpoint 2: End-to-End Working
**When**: After completing all Phase 2 tasks  
**Validation**:
- User can click button and download PDF
- Loading states work properly
- Error messages display correctly

### Checkpoint 3: Production Ready
**When**: After completing all tasks  
**Validation**:
- PDF looks professional with branding
- All success criteria from spec are met
- Feature works reliably under normal usage
