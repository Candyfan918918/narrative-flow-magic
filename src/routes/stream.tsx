import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/stream")({
  component: StreamRedirect,
});

function StreamRedirect() {
  useEffect(() => {
    window.location.replace("/shutap/Stream.dc.html");
  }, []);
  return null;
}
