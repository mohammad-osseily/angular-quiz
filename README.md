# Users Directory

A modern Angular application that displays a paginated list of users with search functionality, built with Angular 21 and Angular Material.

## Features

- **Paginated User List** - Browse users with pagination support
- **User Details** - View detailed information for each user
- **Instant Search** - Search users by ID or name without a submit button
- **Caching** - Intelligent caching to avoid redundant API requests
- **Loading Indicator** - Progress bar shows during network requests
- **Responsive Design** - Works on desktop and mobile devices
- **Modern UI** - Beautiful design with Angular Material components

## Tech Stack

- **Angular 21** - Latest Angular with standalone components and signals
- **Angular Material** - UI component library
- **RxJS** - Reactive programming for async operations
- **SCSS** - Styling with custom theme system
- **TypeScript** - Type-safe development

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── header/           # Header with search
│   │   ├── loading-bar/      # Loading progress bar
│   │   └── user-card/        # User card component
│   ├── pages/
│   │   ├── user-list/        # Users list page
│   │   └── user-detail/      # User detail page
│   ├── services/
│   │   ├── user.service.ts   # User API service with caching
│   │   └── loading.service.ts # Loading state service
│   ├── interceptors/
│   │   └── loading.interceptor.ts # HTTP interceptor
│   └── models/
│       └── user.model.ts     # TypeScript interfaces
├── styles/
│   └── _theme.scss           # Theme variables and mixins
└── styles.scss               # Global styles
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd angular-quiz

# Install dependencies
npm install
```

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The app will automatically reload on file changes.

### Build

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

## API

This application uses the [ReqRes API](https://reqres.in/) for user data.

**Endpoints used:**
- `GET /api/users?page={page}` - Get paginated users
- `GET /api/users/{id}` - Get single user by ID

**Note:** The app uses a proxy configuration for development to handle CORS.

## Features Implementation

### Caching Strategy

The app implements in-memory caching using JavaScript `Map`:
- Paginated responses are cached by page number
- Individual users are cached by ID
- Subsequent requests return cached data instantly

### Search Functionality

- **Instant search** - Results appear as you type (300ms debounce)
- **ID search** - Enter a number to search by user ID
- **Name search** - Enter text to search by first/last name
- **Click outside** - Closes the dropdown

### Theme System

All colors and design tokens are centralized in `src/styles/_theme.scss`:
- Color variables (`$primary`, `$text-primary`, etc.)
- Spacing and sizing
- Shadows and transitions
- Reusable mixins

## License

This project is for demonstration purposes.
