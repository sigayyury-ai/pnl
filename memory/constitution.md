<!--
SYNC IMPACT REPORT:
- Version change: none → 1.0.0
- Modified principles: none (initial creation)
- Added sections: Governance, Constitution Check gates
- Removed sections: none
- Templates requiring updates: 
  ✅ plan-template.md (Constitution Check section aligned)
  ✅ spec-template.md (no changes needed - already aligned)
  ✅ tasks-template.md (no changes needed)
  ✅ All command files verified for consistency
-->

# PNL System Development Constitution

**Version**: 1.0.0  
**RATIFICATION_DATE**: 2025-10-21  
**LAST_AMENDED_DATE**: 2025-10-21

## Core Principles

The following principles are non-negotiable rules that guide all development decisions for the PNL System. They MUST be followed in every feature implementation and architectural decision.

### 1. **User-Centric Development**

Every feature MUST solve a real business problem for financial reporting. User scenarios drive development priorities and independent testability is mandatory for each user story. This ensures that development efforts align with actual business value and can be validated independently.

### 2. **Spec-Driven Development**

All features MUST start with comprehensive specifications using the Spec-Kit workflow. No implementation without a spec. Specifications MUST include acceptance criteria and edge cases. This guarantees that requirements are well-defined before development begins.

### 3. **Technical Standards**

The project MUST use the established technology stack: Node.js with Express for backend, Supabase (PostgreSQL) for database, Vanilla JavaScript with modern HTML5/CSS3 for frontend. Google OAuth for production authentication with development bypass capability. Deployment target is Render.com with optimization for free tier constraints.

### 4. **Code Quality**

Minimal dependencies, clear error handling, and environment-based configuration (dev vs production) are required. Comprehensive logging for debugging MUST be implemented. This ensures maintainable and debuggable code across different environments.

### 5. **Data Integrity**

All financial operations MUST be traceable with maintained audit trails. Category management MUST maintain referential integrity. CSV processing MUST handle currency conversion accurately and preserve original transaction data.

### 6. **Security**

Production deployments MUST require Google OAuth authentication. Development environments may bypass auth for faster iteration. All API endpoints MUST be properly secured in production with appropriate authorization checks.

### 7. **Performance**

The system MUST optimize for Render's cold start behavior with efficient Supabase queries and minimize external API calls during CSV processing. This ensures responsiveness within the hosting platform constraints.

## Constitution Check Gates

**GATE**: Before any feature implementation begins, the following checks MUST pass:

- ✅ **User-Centric**: Feature solves a real business problem and has defined user scenarios
- ✅ **Spec-Driven**: Complete specification exists with acceptance criteria  
- ✅ **Technical Standards**: Implementation follows established Node.js/Supabase/Render stack
- ✅ **Code Quality**: Implementation plan includes error handling and logging
- ✅ **Data Integrity**: Feature maintains financial data traceability and accuracy
- ✅ **Security**: Authentication and authorization properly handled for production
- ✅ **Performance**: Implementation respects Render platform limitations

Failure to pass any gate requires specification or plan revision before implementation proceeds.

## Development Workflow

The following workflow MUST be followed for all feature development:

1. **Spec Creation**: Use `/speckit.spec` for new features
2. **Planning**: Use `/speckit.plan` for technical architecture  
3. **Task Breakdown**: Use `/speckit.tasks` for implementation steps
4. **Constitution Check**: Validate against all principles before implementation
5. **Implementation**: Use `/speckit.implement` for guided development
6. **Validation**: Each feature MUST pass acceptance criteria

## PNL-Specific Guidelines

### Financial Data Handling
- Currency codes MUST be validated before processing
- All amounts MUST be converted to PLN for consistency
- Audit trail MUST be maintained for all changes
- Missing or invalid data MUST be handled gracefully with clear error messages

### CSV Processing
- Support multiple CSV formats (bank statements, etc.) with robust parsing
- AI categorization MUST be configurable (demo vs real modes)
- Original transaction data MUST be preserved
- Clear error messages MUST be provided for parsing failures

### Category Management
- Categories MUST be type-safe (income vs expense)
- Default categories MUST be meaningful for business operations
- Category hierarchy MAY be implemented if business needs require
- Deletion of categories with associated operations MUST be prevented with proper error handling

## Governance

### Amendment Procedure
Constitution amendments require:
1. Identification of principle that needs modification or addition
2. Justification based on business or technical requirements
3. Impact assessment on existing features and development workflow
4. Version bump following semantic versioning (MAJOR.MINOR.PATCH)

### Versioning Policy
- **MAJOR**: Backward incompatible principle changes or removals
- **MINOR**: New principles or sections, materially expanded guidance  
- **PATCH**: Clarifications, wording improvements, non-semantic refinements

### Compliance Review
All feature implementations MUST pass Constitution Check Gates before proceeding to implementation. Any violations require spec or plan revision until all gates pass.