import "./home.css";
import Header from "../components/Header";
import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

const LOGO_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770473617/image_he91pm.png";

const RECYCLE_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770475968/istockphoto-1208597816-612x612-removebg-preview_nhtvgk.png";

const DIRT_URL =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770480293/seamless-underground-with-different-layers-stock-illustration_1038821-151-removebg-preview_nzscjc.png";

function DirtParticles({ count = 22 }) {
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

  const locatorRef = useRef(null);
  const playRef = useRef(null);

  function ripple(btnRef, e) {
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
        <div className="scene homeScene">
          <DirtParticles count={22} />


          <img className="logoImg" src={LOGO_URL} alt="EcoDawgs" />
          <img className="recycleImg" src={RECYCLE_URL} alt="" aria-hidden="true" />

          {/* Simple action stack */}
          <div className="homeStack">
            <Header />

            <button
              ref={locatorRef}
              className="homePrimary"
              onClick={(e) => {
                ripple(locatorRef, e);
                navigate("/compass");
              }}
              type="button"
            >
              Compost Bin Locator
            </button>

            <div className="homeRow">
              <button
                ref={playRef}
                className="homeSecondary"
                onClick={(e) => {
                  ripple(playRef, e);
                  navigate("/game");
                }}
                type="button"
              >
                Play Now
              </button>

              <button
                className="homeSecondary"
                onClick={() => navigate("/learn")}
                type="button"
              >
                Learn
              </button>
            </div>
          </div>


          <img className="dirtBottomImg" src={DIRT_URL} alt="" aria-hidden="true" />
          <img className="dirtBottomImg2" src={DIRT_URL} alt="" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
