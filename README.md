# Tax Leak Audit

React + Tailwind lead magnet calculator for estimating annual tax leakage and collecting qualified leads.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

## Environment Variables

Create `.env` with:

- `VITE_LEAD_WEBHOOK_URL`: Lead capture webhook URL (GoHighLevel, ConvertKit, etc.)
- `VITE_BOOKING_URL`: Booking or webinar destination URL for final CTA

## Analytics Events

The app emits these events through `trackEvent`:

- `audit_started`
- `step_completed`
- `audit_calculated`
- `email_captured`
- `cta_clicked`

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run lint` - run ESLint
- `npm run test` - run unit tests
