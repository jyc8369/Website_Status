const CANONICAL_HOST = "status.jyc8369.dev";

export async function onRequest({ request, next }) {
  const url = new URL(request.url);

  if (url.hostname.endsWith(".pages.dev")) {
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  return next();
}
