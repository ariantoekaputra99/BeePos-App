# Production deployment

## VPS prerequisites
- Ubuntu 22.04+
- Docker Engine and Docker Compose plugin
- Domain DNS pointing to the VPS
- Firewall ports 22, 80 and 443 only

## Environment
Copy the compose configuration and replace all development credentials:
```bash
export POSTGRES_PASSWORD='use-a-long-random-secret'
export JWT_SECRET='use-at-least-32-random-bytes-for-production'
```

## Run
```bash
docker compose up -d --build
# health check
docker compose ps
docker compose logs -f backend
```

## Production checklist
- Put Nginx or a managed load balancer in front of the frontend/API.
- Enable HTTPS with Let's Encrypt.
- Store secrets in a secret manager or VPS environment file outside Git.
- Schedule encrypted PostgreSQL backups and test restore regularly.
- Set `ddl-auto` to `validate` after the first migration is introduced.
- Add CI checks for `mvn test` and `npm run build` before deployment.

The default credentials in `docker-compose.yml` are for local development only and must not be used on a public VPS.
