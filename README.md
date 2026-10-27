# Georgia Food Pantry Map

Interactive map of food pantries and census-tract food access measures for Georgia and the City of Atlanta.

**Layers**
- Atlanta Community Food Bank partner pantries (geocoded with the ArcGIS World Geocoder)
- Large grocery retailers (Publix, Walmart, Kroger, ALDI, Piggly Wiggly, Food Lion)
- SNAP-authorized stores in Georgia (USDA SNAP Retailer Locator data), filterable by store type
- Census tracts shaded by: food insecurity and food stamp receipt (CDC PLACES 2025), low access to large retailers (USDA Food Access Research Atlas, 2010 tracts), and low access to SNAP-authorized retailers (USDA SNAP-authorized Retailer Access Map)
- Atlanta city limits, Georgia state boundary and tract boundaries (US Census TIGERweb)

Base map: Mapbox Streets.

## Run locally

1. Copy `.env.example` to `.env.local` and set `VITE_MAPBOX_TOKEN` to a Mapbox public token.
2. `npm install`
3. `npm run dev`

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via `.github/workflows/deploy.yml`.
The token comes from the repository secret `MAPBOX_TOKEN`; it is never committed.
Restrict the token to this site's URL in your Mapbox account.
