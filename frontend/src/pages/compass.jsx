// src/pages/CompassPage.jsx
import "./compass.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* -------------------- Map helpers -------------------- */
function ZoomWatcher({ onZoom }) {
  useMapEvents({
    zoomend: (e) => onZoom(e.target.getZoom()),
  });
  return null;
}

function LocateMeButton({ onLocate }) {
  const map = useMap();
  return (
    <button
      className="locateBtn"
      type="button"
      onClick={async () => {
        const pos = await onLocate(); // [lat,lng]
        map.flyTo(pos, Math.max(map.getZoom(), 17), { animate: true });
      }}
      title="Go to my location"
    >
      📍
    </button>
  );
}

/* -------------------- Icons -------------------- */
const USER_ICON_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770500401/5216405_1_pdbpil.png";

const BIN_ICON_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770500666/green-compost-bin-icon-vector-59993202_zbumeb.png";

// Use this icon (your logo) for the nearest bin highlight in list (instead of ⭐)
const NEAREST_BADGE_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770473617/image_he91pm.png";

const userIcon = new L.Icon({
  iconUrl: USER_ICON_URL,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -16],
});

/* -------------------- Math helpers -------------------- */
function normalize360(deg) {
  return (deg % 360 + 360) % 360;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function bearingDegrees(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return normalize360(toDeg(Math.atan2(y, x)));
}

/* -------------------- Page -------------------- */
export default function CompassPage() {
  const mapRef = useRef(null);

  // heading from device (mobile)
  const [heading, setHeading] = useState(0);

  // user position for map
  const [userPos, setUserPos] = useState(null); // [lat,lng]

  // bins list for markers
  const [bins, setBins] = useState([]);

  // nearest response from backend
  const [nearest, setNearest] = useState(null); // { bin, distanceMeters, bearingDegrees }

  // map zoom
  const [zoom, setZoom] = useState(16);

  // selected bin (when user clicks a row in the list)
  const [selectedBinId, setSelectedBinId] = useState(null);

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function makeBinIcon(z) {
    const size = clamp(10 + (z - 13) * 5, 14, 38);
    return new L.Icon({
      iconUrl: BIN_ICON_URL,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size * 0.8],
    });
  }

  function makeNearestBinIcon(z) {
    const size = clamp(16 + (z - 13) * 7, 22, 56);
    return new L.Icon({
      iconUrl: BIN_ICON_URL,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size * 0.9],
    });
  }

  const binIconDyn = useMemo(() => makeBinIcon(zoom), [zoom]);
  const nearestBinIconDyn = useMemo(() => makeNearestBinIcon(zoom), [zoom]);

  async function fetchAllBins() {
    const res = await fetch("http://localhost:8080/api/bins");
    if (!res.ok) throw new Error("Failed to fetch /api/bins");
    return res.json();
  }

  async function fetchNearest(lat, lng) {
    const res = await fetch(`http://localhost:8080/api/bins/nearest?lat=${lat}&lng=${lng}`);
    if (!res.ok) throw new Error("Failed to fetch /api/bins/nearest");
    return res.json();
  }

  function getUserLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  async function requestCompassPermissionIfNeeded() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      const p = await DeviceOrientationEvent.requestPermission();
      if (p !== "granted") throw new Error("Compass permission denied");
    }
  }

  // Load all bins once
  useEffect(() => {
    fetchAllBins()
      .then(setBins)
      .catch((e) => console.warn("bins error:", e));
  }, []);

  // Location + nearest refresh (immediate + every 5s)
  useEffect(() => {
    let alive = true;

    async function refresh() {
      try {
        const pos = await getUserLocation();
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (!alive) return;
        setUserPos([lat, lng]);

        const data = await fetchNearest(lat, lng);
        if (!alive) return;
        setNearest(data);
      } catch (e) {
        console.warn("nearest/geo error:", e);
      }
    }

    refresh();
    const t = setInterval(refresh, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Device heading listener (mobile only)
  useEffect(() => {
    let cleanup = null;

    (async () => {
      try {
        await requestCompassPermissionIfNeeded();

        const handler = (e) => {
          if (typeof e.webkitCompassHeading === "number") {
            setHeading(e.webkitCompassHeading);
            return;
          }
          if (typeof e.alpha === "number") {
            setHeading(360 - e.alpha);
          }
        };

        window.addEventListener("deviceorientation", handler, true);
        cleanup = () => window.removeEventListener("deviceorientation", handler, true);
      } catch (e) {
        console.warn("compass error:", e);
      }
    })();

    return () => cleanup?.();
  }, []);

  const nearestBin = nearest?.bin ?? null;
  const distanceMeters = nearest?.distanceMeters ?? 0;

  // If user never clicked a bin, compass points to nearest.
  // If user clicked a bin, compass points to that selected bin.
  const effectiveTargetBin = useMemo(() => {
    if (!selectedBinId) return nearestBin;
    return bins.find((b) => b.id === selectedBinId) ?? nearestBin;
  }, [selectedBinId, bins, nearestBin]);

  // Bearing to selected/nearest target (computed locally for reliability)
  const effectiveBearing = useMemo(() => {
    if (!userPos || !effectiveTargetBin) return 0;
    const [ulat, ulng] = userPos;
    return bearingDegrees(ulat, ulng, effectiveTargetBin.lat, effectiveTargetBin.lng);
  }, [userPos, effectiveTargetBin]);

  const needleRotation = useMemo(() => {
    return normalize360(effectiveBearing - heading);
  }, [effectiveBearing, heading]);

  // Rank bins by distance (frontend)
  const rankedBins = useMemo(() => {
    if (!userPos || bins.length === 0) return [];
    const [ulat, ulng] = userPos;

    return bins
      .map((b) => ({
        ...b,
        distanceMeters: haversineMeters(ulat, ulng, b.lat, b.lng),
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [bins, userPos]);

  // Default selection to nearest (once it exists)
  useEffect(() => {
    if (!selectedBinId && nearestBin?.id != null) setSelectedBinId(nearestBin.id);
  }, [nearestBin, selectedBinId]);

  function fmtDist(m) {
    if (!Number.isFinite(m)) return "";
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(2)} km`;
  }

  function isNearestBinMarker(b) {
    if (!nearestBin) return false;
    if (nearestBin.id != null && b.id != null) return b.id === nearestBin.id;

    const d = haversineMeters(b.lat, b.lng, nearestBin.lat, nearestBin.lng);
    return d <= 3;
  }

  function isSelected(b) {
    return selectedBinId != null && b.id === selectedBinId;
  }


  function getLeafletMap() {
    // react-leaflet v4: mapRef.current is the MapContainer instance with .getMap()
    // older patterns: sometimes it's already the Leaflet map
    const maybe = mapRef.current;
    if (!maybe) return null;
    if (typeof maybe.flyTo === "function") return maybe;         // already a Leaflet map
    if (typeof maybe.getMap === "function") return maybe.getMap(); // MapContainer ref in v4
    return null;
  }

  function flyToBin(b) {
    const map = getLeafletMap();
    if (!map) {
      console.warn("Map not ready yet (mapRef.current is null)");
      return;
    }
    map.flyTo([b.lat, b.lng], Math.max(map.getZoom(), 17), { animate: true });
  }


  return (
    <div className="cpage">
      <div className="cphone">
        <div className="cscene">
          {/* Header */}
          <div className="cheader">
            <button className="iconBtn" aria-label="Recycle">
              ♻
            </button>
            <button className="iconBtn" aria-label="Menu">
              ☰
            </button>
          </div>

          {/* Map */}
          <div className="mapWrap">
            <div className="mapShell">
              {userPos ? (
                <MapContainer
                  ref={mapRef}
                  center={userPos || [33.948, -83.3773]}
                  zoom={16}
                  className="leafletMap"
                  zoomControl={false}
                >

                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                  />

                  <ZoomWatcher onZoom={setZoom} />

                  <LocateMeButton
                    onLocate={async () => {
                      const p = await getUserLocation();
                      const pos = [p.coords.latitude, p.coords.longitude];
                      setUserPos(pos);
                      return pos;
                    }}
                  />

                  <Marker position={userPos} icon={userIcon}>
                    <Popup>You are here</Popup>
                  </Marker>

                  {bins.map((b) => (
                    <Marker
                      key={b.id ?? `${b.lat},${b.lng}`}
                      position={[b.lat, b.lng]}
                      icon={isNearestBinMarker(b) ? nearestBinIconDyn : binIconDyn}
                    >
                      <Popup>
                        <b>{b.name}</b>
                        <br />
                        {b.description}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="mapPlaceholder">
                  <div className="mapLoading">Getting location…</div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom panel */}
          <div className="bottomPanel">
            <div className="panelTopRow">
              <button className="bulbBtn" type="button" aria-label="Tip">
                💡
              </button>

              <div className="panelTitle">
                <div className="panelTitleBig">
                  {effectiveTargetBin?.name ?? nearestBin?.name ?? "Nearest Bins"}
                </div>
                <div className="panelTitleSmall">
                  {selectedBinId && effectiveTargetBin
                    ? `${fmtDist(
                      userPos
                        ? haversineMeters(userPos[0], userPos[1], effectiveTargetBin.lat, effectiveTargetBin.lng)
                        : distanceMeters
                    )} away`
                    : `${fmtDist(distanceMeters)} away`}
                </div>
              </div>

              {/* Compass */}
              <div
                className="compass"
                style={{ "--needle-rot": `${needleRotation}deg` }}
                aria-label="Compass"
              >
                <div className="compassRing" />
                <div className="compassN">N</div>

                <div className="needleWrap">
                  <div className="needleStem" />
                  <div className="needleHead" />
                </div>

                <div className="compassCenter" />
              </div>
            </div>

            {/* Scrollable list: click row -> fly to bin + select */}
            <div className="list listScroll">
              {rankedBins.map((b, i) => {
                const selected = selectedBinId != null && b.id === selectedBinId;
                const nearestRow = i === 0;

                return (
                  <button
                    key={b.id ?? `${b.lat},${b.lng}`}
                    type="button"
                    className={`row rowBtn ${selected ? "rowSelected" : ""}`}
                    onClick={() => {
                      setSelectedBinId(b.id);
                      flyToBin(b);
                    }}
                  >
                    <div className="rowName">
                      {nearestRow && <img className="nearestBadge" src={NEAREST_BADGE_URL} alt="" />}
                      {b.name}
                    </div>
                    <div className="rowDist">{fmtDist(b.distanceMeters)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="footerBar">
            <div className="help">Help</div>
            <div className="brand">EcoDawgs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
