# HomeOS Frontend

A modern, responsive frontend for HomeOS - your local-first personal operating system.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first styling
- **Axios** - HTTP client
- **React Query** - Server state management
- **Zustand** - Client state management

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── api/            # API client configuration
│   │   └── client.ts   # Axios instance with interceptors
│   ├── components/     # React components
│   │   └── layout/     # Layout components
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── MobileNav.tsx
│   │       └── Layout.tsx
│   ├── hooks/          # Custom React hooks
│   │   └── useApi.ts   # API request hooks
│   ├── pages/          # Page components
│   │   ├── Home.tsx
│   │   ├── Tasks.tsx
│   │   ├── Calendar.tsx
│   │   └── Reminders.tsx
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx         # Main app component with routing
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles and Tailwind imports
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── postcss.config.js   # PostCSS configuration
```

## Features

### Responsive Design
- Mobile-first approach
- Desktop: Sidebar navigation
- Mobile: Bottom tab navigation
- Seamless transitions between breakpoints

### Routing
- `/` - Home dashboard
- `/tasks` - Task management
- `/calendar` - Calendar view
- `/reminders` - Reminder management

### API Integration
- Axios client configured with baseURL `http://localhost:8000`
- Request/response interceptors for logging and error handling
- React Query for efficient data fetching and caching

## Development

The frontend is configured to proxy API requests to `http://localhost:8000` during development. Make sure your backend server is running on that port.

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.
