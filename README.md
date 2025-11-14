# Al Farooq Kidney Center & Ultrasound Clinic - Appointment Management System

A modern appointment management dashboard for managing patient appointments for multiple doctors.

## Features

- Separate appointment management for Dr Umar Farooq and Dr Samreen Malik
- Auto-generating appointment numbers with frozen number support
- Today and Yesterday appointment tracking with separate numbering
- Patient availability tracking
- Full-screen appointment lists
- Modern, responsive UI design

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production:
```bash
vercel --prod
```

## Database

The application uses a JSON file-based database stored in `/tmp` on Vercel serverless functions. Data persists across requests within the same deployment.

## API Endpoints

- `GET /api/appointments` - Retrieve all appointment data
- `POST /api/appointments` - Save appointment data
- `GET /api/health` - Health check endpoint

## Local Development

```bash
npm install
vercel dev
```

