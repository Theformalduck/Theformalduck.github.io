import { captureError, log } from "./lib/logger";

// Runs once when the server starts.
export async function register() {
  // process.version is a Node.js API and isn't available in the Edge Runtime,
  // where this same register() also runs — only read it on Node.
  const node = process.env.NEXT_RUNTIME === "nodejs" ? process.version : undefined;
  log.info("server.start", { env: process.env.NODE_ENV, runtime: process.env.NEXT_RUNTIME, node });
}

// Next.js calls this for every uncaught error in a route handler or server
// component — the single place to capture/forward server errors for monitoring.
export async function onRequestError(
  err: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string; routeType?: string }
) {
  captureError(err, {
    path: request?.path,
    method: request?.method,
    router: context?.routerKind,
    route: context?.routePath,
  });
}
