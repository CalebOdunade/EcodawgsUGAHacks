import "./compass.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";

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

/* -------------------- Assets -------------------- */
const BIN_ICON_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770500666/green-compost-bin-icon-vector-59993202_zbumeb.png";

const NEAREST_BADGE_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770473617/image_he91pm.png";

// header top-left icon image (you asked)
const TOP_LEFT_ICON_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770473617/image_he91pm.png";

// footer brand image (you asked)
const BRAND_LOGO_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770551394/Logo_d8b2at.png";

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
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return normalize360(toDeg(Math.atan2(y, x)));
}

/* -------------------- Page -------------------- */
export default function CompassPage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [heading, setHeading] = useState(0);
  const [userPos, setUserPos] = useState(null); // [lat,lng]
  const [bins, setBins] = useState([]);
  const [zoom, setZoom] = useState(16);
  const [selectedBinId, setSelectedBinId] = useState(null);

  const [needsCompassGesture, setNeedsCompassGesture] = useState(false);

  // menu overlay state
  const [menuOpen, setMenuOpen] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

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

  // Google-maps-like user marker: dot + direction cone
  function makeUserHeadingIcon(headingDeg) {
    const h = normalize360(Number(headingDeg) || 0);
    const html = `
      <div style="
        width: 46px; height: 46px;
        position: relative;
        transform: rotate(${h}deg);
        transform-origin: 50% 50%;
        pointer-events: none;
      ">
        <div style="
          position: absolute;
          left: 50%; top: 6px;
          width: 0; height: 0;
          transform: translateX(-50%);
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-bottom: 24px solid rgba(42,157,87,0.30);
        "></div>

        <div style="
          position: absolute;
          left: 50%; top: 50%;
          width: 14px; height: 14px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: rgb(42,157,87);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.95);
        "></div>
      </div>
    `;

    return L.divIcon({
      className: "",
      html,
      iconSize: [46, 46],
      iconAnchor: [23, 23],
      popupAnchor: [0, -18],
    });
  }

  const binIconDyn = useMemo(() => makeBinIcon(zoom), [zoom]);
  const nearestBinIconDyn = useMemo(() => makeNearestBinIcon(zoom), [zoom]);
  const userHeadingIcon = useMemo(() => makeUserHeadingIcon(heading), [heading]);

  async function fetchAllBins() {
    const res = await fetch(`${API_BASE}/api/bins`);
    if (!res.ok) throw new Error("Failed to fetch /api/bins");
    return res.json();
  }

  function getUserLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition((p) => resolve(p), reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
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
    fetchAllBins().then(setBins).catch((e) => console.warn("bins error:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Location refresh (immediate + every 5s)
  useEffect(() => {
    let alive = true;

    async function refresh() {
      try {
        const pos = await getUserLocation();
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (!alive) return;
        setUserPos([lat, lng]);
      } catch (e) {
        console.warn("geo error:", e);
      }
    }

    refresh();
    const t = setInterval(refresh, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Compass: auto-try; if iOS blocks it, retry on first tap
  useEffect(() => {
    let cleanup = null;
    let attached = false;

    const attachListener = async () => {
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
        attached = true;
        setNeedsCompassGesture(false);
        cleanup = () =>
          window.removeEventListener("deviceorientation", handler, true);
      } catch (e) {
        console.warn("compass permission blocked until gesture:", e);
        setNeedsCompassGesture(true);
      }
    };

    attachListener();

    const retryOnGesture = () => {
      if (attached) return;
      attachListener();
    };

    if (needsCompassGesture) {
      window.addEventListener("click", retryOnGesture, {
        once: true,
        passive: true,
      });
      window.addEventListener("touchend", retryOnGesture, {
        once: true,
        passive: true,
      });
    }

    return () => {
      cleanup?.();
      window.removeEventListener("click", retryOnGesture);
      window.removeEventListener("touchend", retryOnGesture);
    };
  }, [needsCompassGesture]);
  const menuBtnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  function openMenu() {
    const el = menuBtnRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const GAP = 8;

    // Align the menu's RIGHT edge to the button's RIGHT edge
    setMenuPos({
      top: r.bottom + GAP,
      left: r.right,
    });

    setMenuOpen(true);
  }
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

  // LOCAL nearest = first in ranked list
  const nearestBin = rankedBins[0] ?? null;
  const distanceMeters = nearestBin?.distanceMeters ?? 0;

  // Default selection to nearest (once it exists)
  useEffect(() => {
    if (!selectedBinId && nearestBin?.id != null) setSelectedBinId(nearestBin.id);
  }, [nearestBin, selectedBinId]);

  const effectiveTargetBin = useMemo(() => {
    if (!selectedBinId) return nearestBin;
    return bins.find((b) => b.id === selectedBinId) ?? nearestBin;
  }, [selectedBinId, bins, nearestBin]);

  const effectiveBearing = useMemo(() => {
    if (!userPos || !effectiveTargetBin) return 0;
    const [ulat, ulng] = userPos;
    return bearingDegrees(
      ulat,
      ulng,
      effectiveTargetBin.lat,
      effectiveTargetBin.lng
    );
  }, [userPos, effectiveTargetBin]);

  const needleRotation = useMemo(() => {
    return normalize360(effectiveBearing - heading);
  }, [effectiveBearing, heading]);

  function fmtDist(m) {
    if (!Number.isFinite(m)) return "";
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(2)} km`;
  }

  function isNearestBinMarker(b) {
    if (!nearestBin) return false;
    return b.id != null && nearestBin.id != null ? b.id === nearestBin.id : false;
  }

  function getLeafletMap() {
    const maybe = mapRef.current;
    if (!maybe) return null;
    if (typeof maybe.flyTo === "function") return maybe;
    if (typeof maybe.getMap === "function") return maybe.getMap();
    return null;
  }

  function flyToBin(b) {
    const map = getLeafletMap();
    if (!map) return;
    map.flyTo([b.lat, b.lng], Math.max(map.getZoom(), 17), { animate: true });
  }

  return (
    <div className="cpage">
      <div className="cphone">
        <div className="cscene">
          {/* Header */}
          <div className="cheader">
            <button
              className="iconBtn iconBtnImg"
              aria-label="Home"
              title="Home"
              onClick={() => navigate("/")}
              type="button"
            >
              <img src={TOP_LEFT_ICON_URL} alt="Home" />
            </button>

            <button
              ref={menuBtnRef}
              className="iconBtn"
              aria-label="Menu"
              title="Menu"
              onClick={openMenu}
              type="button"
            >
              ☰
            </button>

          </div>

          {/* Menu overlay (ALWAYS above Leaflet) */}
          {menuOpen && (
            <div className="menuBackdrop" onClick={() => setMenuOpen(false)}>
              <div
                className="menuSheet"
                style={{
                  top: menuPos.top,
                  left: menuPos.left,
                  transform: "translateX(-100%)", // makes left be the RIGHT edge
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="menuTitle">Menu</div>
                <button className="menuItem" onClick={() => navigate("/")}>Home</button>
                <button className="menuItem" onClick={() => navigate("/game")}>Game</button>
                <button className="menuItem" onClick={() => navigate("/learn")}>Learn More</button>
                <button className="menuClose" onClick={() => setMenuOpen(false)}>Close</button>
              </div>
            </div>
          )}

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
                    attribution="&copy; OpenStreetMap contributors &copy; CARTO"
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

                  <Marker position={userPos} icon={userHeadingIcon}>
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
              {/* Game icon */}
              <button
                className="bulbBtn"
                type="button"
                aria-label="Game"
                title="Play Compost Catch!"
                onClick={() => navigate("/game")}
              >
                <img
                  src="https://res.cloudinary.com/dvucimldu/image/upload/v1770562218/images__1_-removebg-preview_jxjfya.png"
                  alt=""
                  className="gameIconImg"
                />
              </button>

              <div className="panelTitle">
                <div className="panelTitleBig">
                  {effectiveTargetBin?.name ?? "Nearest Bins"}
                </div>
                <div className="panelTitleSmall">{`${fmtDist(distanceMeters)} away`}</div>
              </div>

              {/* Compass */}
              <div
                className="compass"
                style={{ "--needle-rot": `${needleRotation}deg` }}
                aria-label="Compass"
                title={
                  needsCompassGesture
                    ? "Tap the screen once to enable compass access"
                    : "Compass"
                }
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

            {needsCompassGesture && (
              <div className="compassHint">
                Tap anywhere once to enable compass direction.
              </div>
            )}

            <div className="list listScroll listTight">
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
                      {nearestRow && (
                        <img className="nearestBadge" src={NEAREST_BADGE_URL} alt="" />
                      )}
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
            <div className="footerSpacer" />
            <img className="brandLogo" src={BRAND_LOGO_URL} alt="EcoDawgs" />
          </div>
        </div>
      </div>
    </div>
  );
}
