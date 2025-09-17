# Syllabus Upload UX Redesign Specification

## Document Information
- **Author:** System Designer
- **Created:** August 7, 2025
- **Status:** Draft
- **Version:** 1.0

## Overview
This document outlines the redesign of the syllabus upload feature in the Academic Management System. The redesign aims to streamline the user experience by automatically extracting key information from uploaded syllabi and presenting it in an intuitive side-by-side interface.

## Current UX Flow
1. User enters course details manually (name, code, semester, year)
2. User selects syllabus file
3. User clicks "Upload Syllabus" button
4. System uploads file and creates syllabus record with manual entries
5. System displays uploaded syllabi list
6. User must click "Extract Assignments" button separately
7. System processes syllabus to extract assignments

## New UX Flow
1. User selects syllabus file for upload
2. System immediately uploads file and processes it
3. System automatically extracts:
   - Course name
   - Course code
   - Semester
   - Year
   - Assignments list
4. System displays a side-by-side interface:
   - Left: Preview of the uploaded syllabus
   - Right: Extracted information with ability to edit/confirm
5. User reviews, makes any necessary corrections, and confirms
6. System saves the confirmed information

## Detailed Requirements

### File Upload Phase
1. User is presented with a clean, drag-and-drop interface for file upload
2. Supported file formats remain the same: PDF, TXT only
3. Upon file selection, system displays a progress indicator
4. System immediately begins upload process when file is selected

### Processing Phase
1. After upload completes, system displays "Processing syllabus..." indicator
2. System performs OCR if necessary (for non-text PDFs)
3. System uses enhanced AI extraction to identify:
   - Course name and code pattern recognition
   - Semester and year identification from dates and context
   - Assignments, due dates, weights, and categories
4. Processing status is displayed with appropriate animations

### Review Interface
1. **Side-by-Side Layout**:
   - Left panel: Embedded file viewer for the uploaded syllabus
     - PDF renderer for PDF files
     - Text renderer for TXT files
     - "Download to view" option for DOC/DOCX
   - Right panel: Extracted information in editable form
   
2. **Right Panel Components**:
   - Course Information Section
     - Editable fields for course name, code, semester, year
     - Visual indicators showing confidence level of extracted info
   - Assignments Table
     - Sortable, editable table with columns:
       - Name
       - Due Date (with calendar picker)
       - Weight (percentage)
       - Category (dropdown)
       - Max Points
     - Add/remove assignment buttons
     - Batch edit capabilities

3. **Navigation Controls**:
   - Cancel button (discards upload)
   - "Save Draft" button (saves current state without confirming)
   - "Confirm & Save" button (finalizes and creates records)

### Technical Implementation Requirements

#### Frontend Changes
1. New file upload component with drag-and-drop support
2. PDF/text viewer component for the left panel
3. Enhanced form components for the right panel with validation
4. State management for the extracted information with edit history
5. Responsive design considerations for various screen sizes

#### Backend Changes
1. Enhance `extractAssignments` in `ai.ts`:
   - Add capability to extract course details
   - Improve extraction accuracy with better prompts
   - Add confidence scores to extracted information
2. Create new endpoint for initial processing
3. Update database schema if needed to store confidence scores
4. Add file preview generation/handling

#### AI Extraction Enhancement
1. Update OpenAI prompts to extract course details:
```typescript
const prompt = `
You are an assistant that extracts information from a course syllabus.
Given the following syllabus text, extract:

1. Course name (full name of the course)
2. Course code (e.g., CS101, MATH201)
3. Semester (Fall, Spring, Summer)
4. Year (e.g., 2025)
5. Assignment information, including:
   - name
   - dueDate (YYYY-MM-DD format)
   - weight (as a number, 0-100)
   - category (e.g., exam, homework, project)
   - maxPoints (if available)

For any field where the information isn't clearly specified, use null.

Syllabus text:
${text}

Respond ONLY with a JSON object with the following structure:
{
  "courseInfo": {
    "name": "Course Name",
    "code": "CODE101",
    "semester": "Fall",
    "year": 2025,
    "confidence": {
      "name": 0.95,
      "code": 0.98,
      "semester": 0.85,
      "year": 0.9
    }
  },
  "assignments": [
    {
      "name": "Midterm Exam",
      "dueDate": "2025-10-15",
      "weight": 30,
      "category": "exam",
      "maxPoints": 100
    },
    ...
  ]
}
`;
```

## User Interface Mockup

```
┌───────────────────────────────────────────────────────────────────────────┐
│                       SYLLABUS UPLOAD & EXTRACTION                        │
├────────────────────────────────┬────────────────────────────────────────┐
│                                │                                        │
│                                │  COURSE INFORMATION                    │
│                                │  ┌────────────────────────────────┐   │
│                                │  │ Course Name:                    │   │
│                                │  │ [Introduction to Computer Science]  │
│                                │  └────────────────────────────────┘   │
│                                │                                        │
│                                │  ┌────────────────┐ ┌─────────────┐   │
│      PDF PREVIEW               │  │ Course Code:   │ │ Semester:   │   │
│                                │  │ [CS101]        │ │ [Fall]      │   │
│      [Syllabus content         │  └────────────────┘ └─────────────┘   │
│       displayed here]          │                                        │
│                                │  ┌─────────────┐                      │
│                                │  │ Year:       │                      │
│                                │  │ [2025]      │                      │
│                                │  └─────────────┘                      │
│                                │                                        │
│                                │  ASSIGNMENTS                          │
│                                │  ┌────────────────────────────────┐   │
│                                │  │ Name       | Due Date  | Weight │   │
│                                │  │───────────────────────────────-│   │
│                                │  │ Midterm    | 10/15/25  | 30%   │   │
│                                │  │ Final      | 12/10/25  | 40%   │   │
│                                │  │ Project 1  | 09/30/25  | 15%   │   │
│                                │  │ Project 2  | 11/15/25  | 15%   │   │
│                                │  └────────────────────────────────┘   │
│                                │                                        │
│                                │  [+ Add Assignment]                   │
│                                │                                        │
├────────────────────────────────┴────────────────────────────────────────┤
│  [Cancel]                [Save Draft]                [Confirm & Save]   │
└───────────────────────────────────────────────────────────────────────────┘
```

## Success Metrics
1. Reduction in average time to complete syllabus upload by 50%
2. Increase in syllabus uploads with extracted assignments by 30%
3. Reduction in manual edits to extracted information by 25%
4. User satisfaction rating of 4.5/5 or higher for the new interface

## Implementation Phases

### Phase 1: Backend Enhancement
- Update AI extraction capabilities
- Create new API endpoints
- Enhance data models

### Phase 2: Frontend Development
- Create new upload component
- Develop side-by-side interface
- Implement file preview functionality

### Phase 3: Testing & Refinement
- User testing with sample syllabi
- Refinement of extraction accuracy
- Performance optimization

### Phase 4: Deployment & Monitoring
- Gradual rollout to users
- Collect metrics and feedback
- Iterate based on real-world usage

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Poor extraction accuracy | High | Extensive testing with diverse syllabi samples, fallback to manual entry |
| Performance issues with large files | Medium | Optimize processing, implement size limits, show progress indicators |
| User confusion with new workflow | Medium | Clear onboarding tooltips, help documentation, gradual rollout |
| Compatibility issues with file formats | Medium | Robust error handling, clear messaging about supported formats |

## Conclusion
This redesign will significantly streamline the syllabus upload process by leveraging AI to automatically extract course information and assignments. The side-by-side interface will provide users with an intuitive way to review and confirm the extracted information, reducing manual entry and improving overall efficiency.
