# Frontend builds

`npm run build` produces the public player build in `dist`. Admin routes and admin components are excluded regardless of VITE_ENABLE_ADMIN.

`npm run build:admin` produces an independent build in `dist-admin`. Serve it on a restricted admin host with API requests proxied to the same backend. Open `/admin` on that host. Do not merge its assets into the public dist directory. Server admin authentication remains mandatory.

`/demo` offers a local practice fight without authentication. It does not create accounts, call game APIs, persist progress, or grant rewards.

The HTML shell includes social metadata and `/social-preview.jpg`. Check social crawler rendering on the production domain after deployment.
