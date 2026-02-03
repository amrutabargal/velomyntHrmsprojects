# Frontend Installation Guide

## Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- React and React DOM
- React Router DOM
- Axios
- Tailwind CSS and its dependencies (PostCSS, Autoprefixer)

## Start Development Server

```bash
npm start
```

The application will open at `http://localhost:3000`

## Tailwind CSS Configuration

Tailwind CSS is already configured with:
- Custom dark theme colors in `tailwind.config.js`
- PostCSS configuration in `postcss.config.js`
- Tailwind directives in `src/index.css`

### Available Custom Colors

- `bg-dark-bg-primary` - #0f172a
- `bg-dark-bg-secondary` - #1e293b
- `bg-dark-bg-tertiary` - #334155
- `text-dark-text-primary` - #e2e8f0
- `text-dark-text-secondary` - #cbd5e1
- `border-dark-border` - #475569

Plus standard Tailwind colors like `blue-500`, `green-500`, `red-500`, etc.

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

