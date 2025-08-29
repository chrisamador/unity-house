# Dynamic Page Creation System

## Overview

The dynamic page creation system allows users to create rich content pages with various components, similar to WordPress but tailored for Greek organizations. This system enables entities to build and maintain their web presence with minimal technical knowledge.

## Features

- **Block-based Editor**: Intuitive drag-and-drop interface for creating pages
- **Component Library**: Pre-built components for common content types
- **Templates**: Reusable page templates for consistent design
- **Version History**: Track changes and revert to previous versions
- **Permission-based Editing**: Content editing based on user roles
- **Mobile-friendly Editing**: Create and edit content from mobile devices

## Component Types

The page editor supports various component types:

1. **Text Blocks**: Rich text with formatting options
2. **Media Blocks**: Images, videos, and galleries
3. **Layout Blocks**: Columns, sections, and containers
4. **Interactive Blocks**: Forms, polls, and event RSVPs
5. **Embeds**: Social media, maps, and other external content
6. **Organization-specific Blocks**: Member directories, event calendars, etc.

## Data Structure

Pages are stored in the Convex database with the following structure:

- Basic metadata (title, author, status) stored as fields
- Content stored as a structured JSON object
- Each revision creates a new entry in the pageRevisions table

## Implementation

The dynamic page creation system is implemented across several files:

### Frontend Components

- `packages/ui/src/components/PageEditor/`: Editor components
- `packages/ui/src/components/PageRenderer/`: Page rendering components

### Backend Functions

- `packages/api/convex/pages.ts`: Page CRUD operations

## Page Templates

The system includes pre-built templates for common use cases:

1. **Chapter Homepage**: Main landing page for a chapter
2. **Event Page**: Details for upcoming events
3. **Member Directory**: List of organization members
4. **About Page**: Information about the organization
5. **Contact Page**: Contact information and form

## Mobile Considerations

The page editor is designed to work on both desktop and mobile devices:

- Simplified interface on mobile
- Touch-friendly controls
- Preview mode for mobile view

## Domain-based Content Delivery

When a user visits an entity's custom domain (stored in the `domainURL` field), the application will:

1. Identify the entity based on the domain
2. Load the entity's pages and content
3. Apply entity-specific styling and branding
4. Display the appropriate content based on the URL path
