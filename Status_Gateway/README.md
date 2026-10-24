# Status Gateway

Cloudflare Worker that forwards registered device status requests to their
status APIs through Cloudflare VPC Service bindings.

## Local configuration

1. Copy `src/devices.example.js` to `src/devices.local.js` and replace the
   example device ID, Tailscale address, API path, and binding name.
2. Copy `wrangler.local.example.toml` to `wrangler.local.toml`. Set each VPC
   Service `service_id` and keep its `binding` name aligned with the device
   registry. Both local files are ignored by Git.
3. Install dependencies with `npm ci`.

The committed `src/devices.js` and `wrangler.toml` contain documentation-only
values and do not identify or connect to real infrastructure. Before deploying,
merge your local settings into the deployment configuration and verify that
only the intended VPC services and device addresses are configured.

## API

- `GET /device/{device-id}/status` forwards to that device's configured status
  API.
- Unknown paths or device IDs return `404`; methods other than `GET` return
  `405`; an upstream connection failure returns `502`.
- Responses are not cached.

Deploy only after configuring the Worker name, VPC bindings, and device
registry for the target Cloudflare account.
