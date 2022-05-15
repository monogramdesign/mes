# Monogram Env Sync APIs

Monogram Env Sync (`mes`) is a tool to sync up a project's .env file.

## Deploying to App Engine

### Prod

🚨 Make sure you deploy from the `main` branch. 🚨

```bash
	cp .env.prod .env && gcloud app deploy --project=monogram-env-sync

	# OR SIMPLY
	gcloud app deploy --project=monogram-env-sync
```

---

### Database Updates

#### Planetscale

If using PlanetScale:

- create a new branch in PlanetScale
- add the connection to your `.env` file as `DATABASE_URL='mysql://[...]'`
- run `yarn prisma:push` to push the changes
- merge the PlanetScale branch into `main`

### Using Prisma Seed Script

```bash
npx prisma db seed
```
