# Development guide

## Project structure

- `index.html`, `styles.css`, and `app.js` implement the public status page.
- `functions/_middleware.js` redirects `*.pages.dev` requests to `status.jyc8369.dev`.
- `functions/api/devices/[device]/status.js` exposes public status reports for `proxy-server-1`, `device-b`, and `device-c` through the `STATUS_GATEWAY` service binding.
- `_headers` defines the static response security headers and Content Security Policy.

The browser requests each device report from `/api/devices/{device}/status`. Successful reports provide CPU usage and uptime. The function caches successful reports for 15 seconds; the page refreshes its checks every 30 seconds.

## Local development and checks

The checked-in `package.json` contains no scripts or dependencies, and this repository has no checked-in Wrangler or Cloudflare configuration. No local preview, build, or test procedure is verified by the repository, so this guide does not prescribe a command for those tasks.

## Production deployment

The verified Cloudflare Pages project serves the repository root with no build command. Its production branch is `main`, and its production `STATUS_GATEWAY` service binding points to the `status-gateway` service in the production environment. A GitHub push to `main` starts a production Pages deployment; this behavior was confirmed by a successful deployment after a push.

The production status page is [status.jyc8369.dev](https://status.jyc8369.dev). No downloadable GitHub Release has been confirmed; see the [Releases page](https://github.com/jyc8369/Website_Status/releases) for any future releases.
