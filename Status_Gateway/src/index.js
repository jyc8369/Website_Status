
import DEVICES from "./devices.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET 요청만 허용
    if (request.method !== "GET") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    const match = url.pathname.match(
      /^\/device\/([a-z0-9-]+)\/status$/
    );

    const deviceId = match?.[1];

    // 등록되지 않은 장치는 접근 차단
    if (
      !deviceId ||
      !Object.hasOwn(DEVICES, deviceId)
    ) {
      return Response.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    const device = DEVICES[deviceId];

    const targetUrl = new URL(
      device.statusPath,
      device.origin
    );

    try {
      // Each binding is scoped to one registered host and HTTP port.
      const upstream = await env[device.binding].fetch(
        targetUrl.toString(),
        {
          method: "GET",
          redirect: "manual",
          headers: {
            Accept: "application/json"
          }
        }
      );

      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("Content-Type") ||
            "application/json",
          "Cache-Control": "no-store"
        }
      });

    } catch (error) {
      console.error("Device API failed", error);

      return Response.json(
        {
          error: "Backend unavailable",
          device: deviceId
        },
        { status: 502 }
      );
    }
  }
};
