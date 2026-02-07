import "./auth.css";
import { useMemo, useRef, useState } from "react";

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
        delay: Math.random() * 2,
        dur: 1.2 + Math.random() * 1.6,
        drift: (Math.random() * 2 - 1) * 22,
      })),
    [count]
  );

  
}

export default function Auth() {
  const [mode, setMode] = useState("login");
  const btnRef = useRef(null);

  return (
    <div className="page">
      <div className="phone">
        <div className="scene">
          <DirtParticles count={30} />

          <img className="recycleBg" src={RECYCLE_URL} alt="" />
          
          <div className="authCard">
            <img className="authLogo" src={LOGO_URL} alt="EcoDawgs" />

            <div className="fields">
              <input className="fieldInput" placeholder="Username" />
              {mode === "register" && (
                <input className="fieldInput" placeholder="Full Name" />
              )}
              {mode === "register" && (
                <input className="fieldInput" placeholder="Email" />
              )}
              <input className="fieldInput" type="password" placeholder="Password" />
              {mode === "register" && (
                <input
                  className="fieldInput"
                  type="password"
                  placeholder="Confirm Password"
                />
              )}
            </div>

            <button ref={btnRef} className="authBtn">
              {mode === "login" ? "Login" : "Register"}
            </button>

            <button
              className="switchMode"
              onClick={() =>
                setMode(mode === "login" ? "register" : "login")
              }
            >
              {mode === "login"
                ? "Need an account? Register"
                : "Have an account? Login"}
            </button>
          </div>

          <img className="dirtBottomImg" src={DIRT_URL} alt="" />
          <img className="dirtBottomImg2" src={DIRT_URL} alt="" />

        </div>
      </div>
    </div>
  );
}
