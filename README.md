# RiskPulse – Financial Risk Monitoring Dashboard

A production-ready, frontend-only React application that provides real-time financial risk monitoring with interactive visualizations, mock live data streaming, and comprehensive analytics.

## Vision
**RiskPulse** is a **real-time risk intelligence platform** designed for both **buy-side (portfolio managers)** and **sell-side (trading desks)** users. It continuously tracks, detects, and mitigates financial and operational risks during live electronic trading.

## Features

### Summary Dashboard
- **Exposure Distribution**: Interactive donut chart with drilldown tabs (Global → Region → Country)
- **Exposure Heatmap**: Matrix view across regions and asset classes
- **Country Exposure**: Bar chart distribution by country/region
- **VaR Distributions**: 1-Day and 10-Day Value at Risk horizontal bar charts

### Visual Display
- **Exposure Map**: Interactive treemap grouped by asset class/region/desk
- **Exposure Scatter**: Correlation analysis with regression trend line
- **Advanced Filters**: Real-time filtering with sliders and multi-selects
- **Region Table**: Hierarchical table with bar-in-cell visualizations and dot plots

### Desk Positions
- **Risk Summary**: KPI strip with key metrics and sparklines
- **Position Map**: Treemap visualization by Industry/Sector/Symbol
- **Recent History**: Intraday price movement line chart
- **Price Sentiment Scatter**: Net sentiment vs. price change analysis
- **Spreads Scatter**: High-low spread vs. sentiment correlation

## Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **Styling**: TailwindCSS with custom design tokens
- **UI Components**: shadcn/ui primitives
- **Charts**: Recharts with custom visualizations
- **State Management**: Zustand for UI state, TanStack Query for data
- **Animations**: Framer Motion (200-300ms transitions)
- **Icons**: lucide-react
- **Testing**: Vitest + React Testing Library

## Design Philosophy

Apple-inspired aesthetic with:
- Dark theme by default (light theme toggle available)
- Near-black panels with radial light and glassy translucency
- Soft shadows and rounded corners
- 12-column grid with generous whitespace
- Subtle borders, focus rings, and full keyboard navigation
- Accent gradient: muted white → mint

## Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm/yarn

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### Run Tests

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment to Vercel

This app is optimized for seamless Vercel deployment:

### Option 1: Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy from root directory
vercel

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration
1. Push your code to GitHub
2. Import repository in [Vercel Dashboard](https://vercel.com/new)
3. Set Root Directory to `frontend`
4. Deploy automatically on every push

### Vercel Configuration
The `vercel.json` at root handles:
- Build configuration pointing to `frontend/` directory
- SPA routing (redirects all routes to index.html)
- Optimized static file caching
- Environment variable handling

## Mock Data System

All data is generated in-browser with no backend required:

- **seeds.ts**: Hierarchical data structures (regions, desks, industries, asset classes)
- **generator.ts**: Live data stream simulation (prices, exposure, VaR, sentiment)
- **transforms.ts**: Statistical calculations (EWMA, regression, volatility)

### Mock Live Toggle
Use the "Mock Live" toggle in Settings to:
- **ON**: Real-time data updates every 600-800ms
- **OFF**: Freeze data at current snapshot

## Key Risk Metrics

- **Value-at-Risk (VaR)**: 1-day and 10-day distributions
- **Intraday P&L and exposure**: Real-time position tracking
- **Position concentration limits**: Exposure relative to limits
- **Order flow anomalies**: Market impact detection via sentiment analysis

## Project Structure

```
frontend/
├── src/
│   ├── routes/              # Page components
│   │   ├── Home.tsx
│   │   ├── Summary.tsx
│   │   ├── Visual.tsx
│   │   ├── DeskPositions.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── layout/          # Navbar, Footer
│   │   ├── charts/          # Visualization components
│   │   ├── data-display/    # Tables, KPIs, Legends
│   │   └── controls/        # Filters, Forms
│   ├── lib/
│   │   ├── data/            # Data adapters & hooks
│   │   └── mock/            # Mock data generation
│   ├── store/               # Zustand state stores
│   ├── styles/              # Global CSS
│   └── types/               # TypeScript definitions
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Extending with Real Data

To replace mock data with real APIs:

1. **Update adapters.ts**: Replace mock generators with fetch calls
2. **Configure endpoints**: Set API URLs in environment variables
3. **Update types**: Ensure response types match API contracts

Example locations marked with `// TODO: Replace with real API` throughout codebase.

### Recommended Data Sources
- **Market Data**: Yahoo Finance API, Alpha Vantage
- **Risk Metrics**: Internal risk systems, Bloomberg API
- **Sentiment**: News API, Twitter API, NYTimes API

## Performance Optimizations

- Code splitting by route
- Lazy loading of heavy chart components
- Virtualized tables for large datasets
- Memoized calculations and renders
- Optimized bundle size (~200KB gzipped)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---
