# Deploy From Anywhere

The easiest deployment path for this project is:

- App hosting: Render Web Service
- Database: MongoDB Atlas
- Runtime shape: one Docker service that serves the React frontend from Spring Boot and exposes the REST API under `/api`

This keeps the deployed app on a single public URL, which avoids frontend/backend CORS problems.

## 1. Create MongoDB Atlas Database

1. Create a MongoDB Atlas account and cluster.
2. Create a database user.
3. In Network Access, allow access from your hosting provider. For a quick first deploy, Atlas commonly uses `0.0.0.0/0`; tighten this later if you move to fixed egress/private networking.
4. Copy your application connection string. It should look like:

```text
mongodb+srv://<username>:<password>@<cluster-host>/trading_journal?retryWrites=true&w=majority
```

Do not commit the real connection string.

## 2. Push Project To GitHub

Render deploys from a Git repository. Push this folder to GitHub, GitLab, or Bitbucket.

## 3. Create Render Blueprint

1. In Render, choose **New +**.
2. Choose **Blueprint**.
3. Connect your repository.
4. Render will detect `render.yaml`.
5. When Render asks for `MONGODB_URI`, paste the MongoDB Atlas connection string.
6. Deploy.

After deployment, open the Render service URL. The frontend and API are served from the same domain:

- App: `https://your-service.onrender.com`
- Health check: `https://your-service.onrender.com/api/health`
- Trades API: `https://your-service.onrender.com/api/trades`

## Production Notes

- Render will provide the `PORT` environment variable; Spring Boot is configured to use it.
- `Dockerfile.render` builds the React app, copies it into Spring Boot static resources, and packages everything as one deployable jar.
- Keep using Gradle for Java backend changes. Do not add Maven files.
