# Monogram Env Sync APIs

Monogram Env Sync (`mes`) is a tool to sync up a project's .env file.

## Deploying to App Engine

### Prod

🚨 Make sure you deploy from the `main` branch. 🚨

```bash
	cp .env.prod .env && gcloud app deploy --project=monogram-env-sync
```
