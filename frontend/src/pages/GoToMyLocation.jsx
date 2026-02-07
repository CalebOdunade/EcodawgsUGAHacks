// GoToMyLocation.jsx
import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function GoToMyLocation({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    map.setView(position, 17, { animate: true });
  }, [position, map]);

  return null;
}
