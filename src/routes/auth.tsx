import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

function Redirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}

export const Route = createFileRoute("/auth")({
  component: () => <Redirect to="/shutap/Welcome.dc.html" />,
});
