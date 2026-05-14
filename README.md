# PAI Chat

AI-powered digital clone - A chat application built with Hono on Cloudflare Workers.

## Run Locally

```bash
npm install
npm run dev (starts backend)
npm run dev:ui (starts frontend)
```

Change the `UI_URL` in `src/config.ts` to "\*" to allow all origins for local development.

## Deploy

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Configuration

Update `src/config.ts` to modify `UI_URL` for CORS settings.

## Project Structure

- `src/index.ts` - Main API entry point
- `src/helpers.ts` - Core business logic
- `src/vectors.ts` - Vector search functionality
- `public/` - Frontend UI files

## To use it as AI-powered for you

- Enter your details in the vectors array in `src/vectors.ts`
- Uncomment the `/upsert` endpoint in `src/index.ts`
- Start the server and hit the `/upsert` endpoint to upsert the vectors
- Comment out the `/upsert` endpoint in `src/index.ts`
- Change the PERSONA_NAME & other details in `src/config.ts`
- Deploy the app to Cloudflare Workers
