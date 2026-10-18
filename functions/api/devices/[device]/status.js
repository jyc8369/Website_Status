
const ALLOWED_DEVICES = new Set([
  "proxy-server-1",
  "device-b",
  "device-c"
]);

export async function onRequestGet(context) {
  const { env, params, request } = context;

  const deviceId = params.device;

  if (!ALLOWED_DEVICES.has(deviceId)) {
    return Response.json(
      { error: "Device not found" },
      { status: 404 }
    );
  }

  const cache = globalThis.caches?.default;
  const requestUrl = new URL(request.url);
  const cacheKey = new Request(
    `${requestUrl.origin}${requestUrl.pathname}`,
    { method: "GET" }
  );

  if (cache) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
    } catch {
      // A cache failure should not prevent a live status check.
    }
  }

  try {
    const upstream = await env.STATUS_GATEWAY.fetch(
      `https://internal/device/${deviceId}/status`
    );

    if (!upstream.ok) {
      return Response.json(
        { error: "Device unavailable" },
        {
          status: upstream.status,
          headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
          }
        }
      );
    }

    const report = await upstream.json();
    const cpu = report.total_cpu_usage_percent;
    const uptime = report.uptime_seconds;

    if (
      (cpu !== null && (!Number.isFinite(cpu) || cpu < 0 || cpu > 100)) ||
      !Number.isSafeInteger(uptime) ||
      uptime < 0
    ) {
      return Response.json(
        { error: "Invalid device status" },
        { status: 502 }
      );
    }

    const response = Response.json({
      total_cpu_usage_percent: cpu,
      uptime_seconds: uptime,
      collected_at: typeof report.collected_at === "string"
        ? report.collected_at
        : null
    }, {
      headers: {
        "Cache-Control": "public, max-age=15, s-maxage=15",
        "X-Content-Type-Options": "nosniff"
      }
    });

    if (cache) {
      try {
        await cache.put(cacheKey, response.clone());
      } catch {
        // A cache write failure should not change the public API response.
      }
    }

    return response;

  } catch (error) {
    console.error("Gateway unavailable", error);

    return Response.json(
      { error: "Gateway unavailable" },
      { status: 502 }
    );
  }
}
