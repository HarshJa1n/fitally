# Fitally

Fitally is an AI-powered health and fitness tracking application that helps you monitor and analyze your wellness journey with intelligent insights.

## Features

- 🤖 **AI-Powered Analysis** - Get intelligent insights on your fitness and yoga activities
- 🔐 **Secure Authentication** - Complete user authentication system with Supabase
- 📊 **Health Dashboard** - Track and visualize your health data
- 👤 **User Profiles** - Comprehensive onboarding and profile management
- 📱 **Responsive Design** - Beautiful, mobile-friendly interface

## Getting Started

### Prerequisites

Before running the application, make sure you have:
- Node.js installed
- A Supabase account and project set up

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables (see `SETUP_INSTRUCTIONS.md` for detailed setup)

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

### Testing AI Flows

Test the AI analysis capabilities:

```bash
# Run the following commands to test AI flows
node test-ai-flows.js fitness  # Test fitness analysis
node test-ai-flows.js yoga     # Test yoga analysis
node test-ai-flows.js all      # Run full test suite
```

## Setup

For detailed setup instructions including Supabase configuration and authentication setup, see `SETUP_INSTRUCTIONS.md`.

## Technology Stack

- **Frontend**: React with TypeScript
- **Backend**: Supabase
- **AI/ML**: Google AI with Genkit
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Testing**: Jest with Testing Library
