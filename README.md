# Trading Journal

React TypeScript frontend, Spring Boot Java backend, and MongoDB persistence for a personal trading journal.

## Project Rules

- Java backend projects in this workspace must use Gradle. Do not add Maven files such as `pom.xml`, `mvnw`, or `.mvn/`.
- Use the Gradle wrapper from the backend directory: `./gradlew` on macOS/Linux or `.\gradlew.bat` on Windows.

## Features

- Create, edit, delete, and filter trades
- Track long and short trades, entry/exit dates, prices, quantity, fees, strategy, setup, tags, notes, market condition, emotion, risk amount, and rating
- Backend-calculated gross P/L, net P/L, R multiple, win rate, open/closed counts, best trade, and worst trade
- Docker Compose deployment with MongoDB, API, and nginx-hosted frontend

## Run With Docker

```bash
docker compose up --build
```

Open `http://localhost:3000`.

The API is available at `http://localhost:8080/api`, and MongoDB is exposed on `localhost:27017`.

## Public Deployment

Use Render plus MongoDB Atlas for the simplest public deployment. This repo includes:

- `Dockerfile.render` for a single production service that serves both the React frontend and Spring Boot API
- `render.yaml` for Render Blueprint setup
- `DEPLOYMENT.md` with the full deployment checklist

In production, the app and API share one URL, so the frontend can call `/api` without cross-origin setup.

## Local Development

Start MongoDB locally, then run the backend:

```bash
cd backend
.\gradlew.bat bootRun
```

On macOS/Linux, use `./gradlew bootRun`.

In another terminal, run the frontend:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

If the API runs somewhere else, create `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## API

- `GET /api/health`
- `GET /api/trades`
- `GET /api/trades/{id}`
- `POST /api/trades`
- `PUT /api/trades/{id}`
- `DELETE /api/trades/{id}`
- `GET /api/trades/stats`

Example trade payload:

```json
{
  "symbol": "AAPL",
  "side": "LONG",
  "entryDate": "2026-05-03",
  "exitDate": "2026-05-04",
  "entryPrice": 180,
  "exitPrice": 185,
  "quantity": 10,
  "fees": 2,
  "strategy": "Breakout",
  "setup": "Opening range",
  "tags": ["equity", "momentum"],
  "notes": "Followed plan",
  "emotion": "Calm",
  "marketCondition": "Trending",
  "riskAmount": 50,
  "rating": 4
}
```
