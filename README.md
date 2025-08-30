# Unity House

A modern web platform for Greek organizations to create and manage their online presence.

## Overview

Unity House is a multi-tenant platform that allows Greek organizations to create and manage websites for their chapters, boards, and other organizational units. It provides a simple, user-friendly interface for creating and editing content, managing users, and customizing the look and feel of their websites.

## Features

- **User Authentication**: Secure sign-up and sign-in with email and Google authentication
- **Organization Management**: Create and manage Greek organizations
- **Entity Management**: Create and manage chapters, boards, and other organizational units
- **Dynamic Page System**: Create and edit content pages with a rich text editor
- **Custom Domains**: Connect custom domains to entities
- **Multi-tenant Architecture**: Each entity has its own isolated content and styling
- **Permission System**: Granular control over who can access and edit content

## Tech Stack

- **Frontend**: Expo (React Native) with NativeWind for styling
- **Backend**: Convex for real-time database and backend functions
- **Authentication**: Clerk with Google and email authentication
- **Package Manager**: Bun
- **Project Structure**: Monorepo

## Getting Started

### Prerequisites

- Node.js 18+
- Bun
- Convex account
- Clerk account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/unity-house.git
   cd unity-house
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Convex and Clerk credentials.

4. Start the development server:
   ```bash
   bun run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Development

- `bun run dev`: Start the development server
- `bun run build`: Build the application for production
- `bun run test`: Run tests
- `bun run lint`: Run linting

## License

[MIT](LICENSE)
