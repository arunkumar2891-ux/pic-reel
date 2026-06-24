import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/health")({
  GET: () =>
    Response.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 },
    ),
});
