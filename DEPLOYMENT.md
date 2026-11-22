# Lantern backend deployment verification

This repository contains the Node.js / Express / Socket.IO backend. The documented backend host is Render; the Vercel deployment is not proof of backend runtime health.

## Render configuration

- Repository: `sdurni-glitch/https-lantern-world.vercel.app`
- Review branch: `fix/lantern-router-security-20261122`
- Runtime: Node.js 22 or newer
- Install command: `npm install --no-audit --no-fund`
- Start command: `npm start`
- Port: provided by Render as `PORT` (server falls back to 5000 locally)
- Required secret: `LANTERN_SOCKET_TOKEN`, a unique random value of at least 32 characters, stored in Render's secret environment settings. Do not commit it.
- Do not configure this shared secret in a public frontend bundle.

## Verification after deploying a reviewed branch

1. Check Render's deployment logs and deployed commit SHA. Do not assume the service is using this branch.
2. Confirm the process starts and remains running.
3. Check `GET https://lantern-backend.onrender.com/health` returns HTTP 200 with `{"status":"ok","service":"lantern-backend"}`.
4. From a trusted test client, verify missing and incorrect Socket.IO tokens are rejected.
5. Verify a valid server-provisioned token can connect. Never print or share the token in logs or screenshots.
6. Confirm allowed frontend origins and the desired per-user authorization model before enabling browser access.
7. Rotate any credential that was previously embedded in source code.

## Release gates

- GitHub Actions workflows pass for the exact candidate commit.
- Render is confirmed to deploy the intended repository, branch, and commit.
- Secret is configured in the host's secret store, not in Git.
- Health endpoint and Socket.IO tests pass against the deployed service.
- Public browser access requires user-specific authentication, not a shared secret.
- Keep PR draft and production unchanged until all applicable gates are met.
