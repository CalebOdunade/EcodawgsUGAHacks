import "./home.css";
import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";


const LOGO_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770473617/image_he91pm.png";

const RECYCLE_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770475968/istockphoto-1208597816-612x612-removebg-preview_nhtvgk.png";

const DIRT_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770480293/seamless-underground-with-different-layers-stock-illustration_1038821-151-removebg-preview_nzscjc.png";


function DirtParticles({ count = 28 }) {
    
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        size: 5 + Math.random() * 8,
        delay: Math.random() * 2.0,
        dur: 1.2 + Math.random() * 1.6,
        drift: (Math.random() * 2 - 1) * 22,
      })),
    [count]
  );

  return (
    
    <div className="dirtSpawn" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="dirt"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
const navigate = useNavigate();

  const btnRef = useRef(null);

  function ripple(e) {
    const btn = btnRef.current;
    if (!btn) return;

    const r = document.createElement("span");
    r.className = "ripple";
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = `${size}px`;
    r.style.left = `${e.clientX - rect.left - size / 2}px`;
    r.style.top = `${e.clientY - rect.top - size / 2}px`;

    btn.appendChild(r);
    setTimeout(() => r.remove(), 550);
  }

  return (
    <div className="page">
      <div className="phone">
        <div className="scene">
          {/* Dirt falling BEHIND everything */}
          <DirtParticles count={30} />

          {/* Mascot / logo */}
          <img className="logoImg" src={LOGO_URL} alt="EcoDawgs" />

          {/* Recycling symbol (spinning + visible) */}
          <img className="recycleImg" src={RECYCLE_URL} alt="Recycle" />

          {/* Login centered */}
          <button
            className="loginBtn"
            onClick={() => navigate("/auth")}
            >
            LOG IN
            </button>

          {/* Small dirt strip at bottom */}
            <img className="dirtBottomImg" src={DIRT_URL} alt="" aria-hidden="true" />
            <img className="dirtBottomImg2" src={DIRT_URL} alt="" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
