import "./auth.css";
import { useMemo, useState } from "react";

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
        size: 4 + Math.random() * 7,
        delay: Math.random() * 2.0,
        dur: 1.4 + Math.random() * 1.8,
        drift: (Math.random() * 2 - 1) * 18,
        opacity: 0.25 + Math.random() * 0.35,
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
            opacity: p.opacity,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function Auth() {
  const [mode, setMode] = useState("login");

  return (
    <div className="page">
      <div className="phone">
        <div className="scene authScene">
          <DirtParticles count={26} />

          <img className="recycleBg" src={RECYCLE_URL} alt="" />

          <div className="authCard" role="region" aria-label="Authentication">
            <img className="authLogo" src={LOGO_URL} alt="EcoDawgs" />

            <h1 className="authTitle">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="authSub">
              {mode === "login"
                ? "Log in to keep cleaning."
                : "Join the pack and start tracking progress."}
            </p>

            <div className="fields">
              <input className="fieldInput" placeholder="Username" autoComplete="username" />
              {mode === "register" && (
                <input className="fieldInput" placeholder="Full Name" autoComplete="name" />
              )}
              {mode === "register" && (
                <input className="fieldInput" placeholder="Email" autoComplete="email" />
              )}
              <input
                className="fieldInput"
                type="password"
                placeholder="Password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              {mode === "register" && (
                <input
                  className="fieldInput"
                  type="password"
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                />
              )}
            </div>

            <button className="authBtn">
              {mode === "login" ? "Log In" : "Create Account"}
            </button>

            <button
              className="switchMode"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              type="button"
            >
              {mode === "login"
                ? "Need an account? Register"
                : "Have an account? Log in"}
            </button>
          </div>

          <img className="dirtBottomImg" src={DIRT_URL} alt="" aria-hidden="true" />
          <img className="dirtBottomImg2" src={DIRT_URL} alt="" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
