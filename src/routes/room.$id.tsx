import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/room/$id")({
  component: RoomRedirect,
});

function RoomRedirect() {
  const { id } = Route.useParams();
  useEffect(() => {
    window.location.replace(`/shutap/Stream.dc.html#room-${id}`);
  }, [id]);
  return null;
}
