// src/pages/GamePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./gamePage.css";

const COMPOST_BIN_IMG =
    "https://res.cloudinary.com/dvucimldu/image/upload/v1770546989/e9af703f-ab9d-4702-adfc-4ef44837e5ba-removebg-preview_vlbbpj.png";

// ----------------------------
// Sound
// ----------------------------
function makeAudio() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    return new AudioCtx();
}
function playDing(ctx) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, now);
    o.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + 0.18);
}
function playHurt(ctx) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(180, now);
    o.frequency.exponentialRampToValueAtTime(90, now + 0.16);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.20, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + 0.26);
}

// ----------------------------
// Helpers
// ----------------------------
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

// ----------------------------
// Item pools
// ----------------------------
const EASY_COMPOST = [
    { label: "🍌 Banana Peel", compostable: true },
    { label: "🍎 Apple Core", compostable: true },
    { label: "🥬 Lettuce", compostable: true },
    { label: "🥚 Eggshell", compostable: true },
    { label: "☕ Coffee Grounds", compostable: true },
    { label: "🍂 Leaves", compostable: true },
    { label: "🍞 Bread", compostable: true },
];

const EASY_TRASH = [
    { label: "🥤 Plastic Cup", compostable: false, why: "Plastic doesn’t break down in compost." },
    { label: "🧴 Bottle", compostable: false, why: "Plastic bottles don’t compost." },
    { label: "📦 Styrofoam", compostable: false, why: "Styrofoam is petroleum-based—never compost." },
    { label: "🪫 Battery", compostable: false, why: "Hazardous—must go to e-waste." },
    { label: "🧃 Pouch", compostable: false, why: "Mixed materials don’t compost." },
    { label: "🧻 Wrapper", compostable: false, why: "Most wrappers are plastic/foil-lined." },
];

const CONFUSING_NOT_COMPOST = [
    { label: "☕ To-Go Coffee Cup", compostable: false, why: "Usually plastic-lined." },
    { label: "🍕 Greasy Pizza Box", compostable: false, why: "Rules vary; grease causes processing issues." },
    { label: "🍴 Compostable Fork", compostable: false, why: "Often needs industrial composting." },
    { label: "🛍️ Biodegradable Bag", compostable: false, why: "Biodegradable ≠ compostable." },
    { label: "🍎 Fruit Sticker", compostable: false, why: "Usually plastic/vinyl—remove it." },
    { label: "🫖 Tea Bag (plastic)", compostable: false, why: "Some contain plastic fibers." },
    { label: "🍽️ Coated Paper Plate", compostable: false, why: "Coatings can contaminate compost." },
];

const MEDIUM_COMPOST = [
    ...EASY_COMPOST,
    { label: "🥕 Carrot Peels", compostable: true },
    { label: "🧅 Onion Skins", compostable: true },
    { label: "🌽 Corn Husks", compostable: true },
    { label: "🍃 Yard Clippings", compostable: true },
];

const HARD_COMPOST = [
    ...MEDIUM_COMPOST,
    { label: "🍚 Rice (small)", compostable: true },
    { label: "🍝 Pasta (small)", compostable: true },
    { label: "🌰 Nut Shells", compostable: true },
    { label: "🍄 Mushroom Stems", compostable: true },
];

const DIFFS = {
    easy: {
        label: "Easy",
        compost: EASY_COMPOST,
        trash: EASY_TRASH,
        trashSameColor: false,
        totalItems: 10,
    },
    medium: {
        label: "Medium",
        compost: MEDIUM_COMPOST,
        trash: [...EASY_TRASH, ...CONFUSING_NOT_COMPOST],
        trashSameColor: true,
        totalItems: 13,
    },
    hard: {
        label: "Hard",
        compost: HARD_COMPOST,
        trash: [...EASY_TRASH, ...CONFUSING_NOT_COMPOST],
        trashSameColor: true,
        totalItems: 15,
    },
};

export default function GamePage() {
    const navigate = useNavigate();

    const [mode, setMode] = useState("easy");
    const [running, setRunning] = useState(false);
    const [gameOver, setGameOver] = useState(false);

    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);

    const [binX, setBinX] = useState(50);
    const binXF = useRef(50);
    const [binDamaged, setBinDamaged] = useState(false);

    // re-render cap
    const [frame, setFrame] = useState(0);
    const frameAccumRef = useRef(0);

    const audioRef = useRef(null);
    const rafRef = useRef(0);
    const lastRef = useRef(0);
    const arenaRef = useRef(null);

    const reasonsRef = useRef(new Map());
    const pendingScoreRef = useRef(0);
    const pendingLivesDeltaRef = useRef(0);

    useEffect(() => {
        binXF.current = binX;
    }, [binX]);

    useEffect(() => {
        const unlock = async () => {
            if (!audioRef.current) audioRef.current = makeAudio();
            try {
                if (audioRef.current?.state === "suspended") await audioRef.current.resume();
            } catch { }
        };
        window.addEventListener("touchend", unlock, { passive: true });
        window.addEventListener("click", unlock, { passive: true });
        return () => {
            window.removeEventListener("touchend", unlock);
            window.removeEventListener("click", unlock);
        };
    }, []);

    function damageBin() {
        setBinDamaged(true);
        setTimeout(() => setBinDamaged(false), 650);
    }

    const buildQueue = (diffKey) => {
        const d = DIFFS[diffKey];
        const half = Math.floor(d.totalItems / 2);

        const compostPicks = shuffle(d.compost).slice(0, half);
        const trashPicks = shuffle(d.trash).slice(0, d.totalItems - half);

        return shuffle([...compostPicks, ...trashPicks]).slice(0, d.totalItems);
    };

    const stateRef = useRef({
        items: [],
        nextIndex: 0,
        spawnTimer: 0,
        processed: 0,
        total: 0,
        width: 360,
        height: 600,
        queue: [],
        diffKey: "easy",
    });

    function recordReason(it) {
        if (!it?.why) return;
        const m = reasonsRef.current;
        const key = it.label;
        const prev = m.get(key);
        if (!prev) m.set(key, { why: it.why, caughtWrongCount: 1 });
        else m.set(key, { ...prev, caughtWrongCount: prev.caughtWrongCount + 1 });
    }

    function flushUiDeltasMaybe() {
        const ps = pendingScoreRef.current;
        const pl = pendingLivesDeltaRef.current;
        if (ps !== 0) {
            pendingScoreRef.current = 0;
            setScore((v) => v + ps);
        }
        if (pl !== 0) {
            pendingLivesDeltaRef.current = 0;
            setLives((v) => v + pl);
        }
    }

    function endGame() {
        setRunning(false);
        setGameOver(true);
        cancelAnimationFrame(rafRef.current);
        flushUiDeltasMaybe();
    }

    function spawnItem() {
        const s = stateRef.current;
        if (s.nextIndex >= s.total) return;

        // LIMIT how many items are on screen to reduce lag spikes
        if (s.items.length >= 4) return;

        const base = s.queue[s.nextIndex];
        s.nextIndex += 1;

        // keep items away from edges so labels don't cut off
        // (8%..92% works well on phones)
        const x = 8 + Math.random() * 84;

        const speed = 3 + Math.random() * 2.5; // same as your current

        s.items.push({
            id: `${Date.now()}-${Math.random()}`,
            label: base.label,
            compostable: base.compostable,
            why: base.why,
            x,
            y: -40,
            vy: speed,
            rot: (Math.random() * 14 - 7) | 0,
        });
    }

    function tick(ts) {
        if (!lastRef.current) lastRef.current = ts;
        const dt = Math.min(0.033, (ts - lastRef.current) / 1000);
        lastRef.current = ts;

        const arena = arenaRef.current;
        if (arena) {
            stateRef.current.width = arena.clientWidth;
            stateRef.current.height = arena.clientHeight;
        }

        const s = stateRef.current;

        // spawn rate: 2 sec (your current)
        s.spawnTimer += dt;
        if (s.spawnTimer > 2) {
            s.spawnTimer = 0;
            spawnItem();
        }

        const H = s.height;
        const W = s.width;

        const binPx = (binXF.current / 100) * W;
        const binW = Math.max(52, W * 0.16); // slightly smaller catch zone
        const binY = H - 90;

        const catchLeft = binPx - binW / 2;
        const catchRight = binPx + binW / 2;
        const catchTop = binY;
        const catchBottom = H - 10;

        const nextItems = [];

        for (const it of s.items) {
            const vy = it.vy * 35;
            it.y += vy * dt;

            const itemXpx = (it.x / 100) * W;

            const hit =
                it.y >= catchTop &&
                it.y <= catchBottom &&
                itemXpx >= catchLeft &&
                itemXpx <= catchRight;

            if (hit) {
                s.processed += 1;
                if (it.compostable) {
                    pendingScoreRef.current += 10;
                    playDing(audioRef.current);
                } else {
                    pendingLivesDeltaRef.current -= 1;
                    playHurt(audioRef.current);
                    damageBin();
                    recordReason(it);
                }
                continue;
            }

            if (it.y > H + 60) {
                s.processed += 1;
                continue;
            }

            nextItems.push(it);
        }

        s.items = nextItems;

        // render at 30fps
        frameAccumRef.current += dt;
        if (frameAccumRef.current >= 1 / 30) {
            frameAccumRef.current = 0;
            setFrame((f) => (f + 1) % 1000000);
            flushUiDeltasMaybe();
        }

        if (s.processed >= s.total) {
            endGame();
            return;
        }

        rafRef.current = requestAnimationFrame(tick);
    }

    function resetGame(nextMode = mode) {
        cancelAnimationFrame(rafRef.current);
        lastRef.current = 0;

        setScore(0);
        setLives(3);
        setBinX(50);
        setBinDamaged(false);

        reasonsRef.current = new Map();
        pendingScoreRef.current = 0;
        pendingLivesDeltaRef.current = 0;

        setGameOver(false);
        setRunning(true);

        const queue = buildQueue(nextMode);

        stateRef.current = {
            items: [],
            nextIndex: 0,
            spawnTimer: 0,
            processed: 0,
            total: queue.length,
            width: arenaRef.current?.clientWidth || 360,
            height: arenaRef.current?.clientHeight || 600,
            queue,
            diffKey: nextMode,
        };

        rafRef.current = requestAnimationFrame(tick);
    }

    useEffect(() => {
        if (!running) return;
        if (lives <= 0) endGame();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lives]);

    useEffect(() => {
        resetGame("easy");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // drag controls
    useEffect(() => {
        const arena = arenaRef.current;
        if (!arena) return;

        let dragging = false;

        const toXPercent = (clientX) => {
            const r = arena.getBoundingClientRect();
            const x = ((clientX - r.left) / r.width) * 100;
            return clamp(x, 6, 94);
        };

        const onDown = (e) => {
            dragging = true;
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            setBinX(toXPercent(cx));
        };
        const onMove = (e) => {
            if (!dragging) return;
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            setBinX(toXPercent(cx));
        };
        const onUp = () => {
            dragging = false;
        };

        arena.addEventListener("mousedown", onDown);
        arena.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);

        arena.addEventListener("touchstart", onDown, { passive: true });
        arena.addEventListener("touchmove", onMove, { passive: true });
        window.addEventListener("touchend", onUp, { passive: true });

        return () => {
            arena.removeEventListener("mousedown", onDown);
            arena.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);

            arena.removeEventListener("touchstart", onDown);
            arena.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onUp);
        };
    }, []);

    const diff = DIFFS[stateRef.current.diffKey || mode];
    const total = stateRef.current.total;

    const reasons = useMemo(() => {
        // eslint-disable-next-line no-unused-expressions
        frame;
        return Array.from(reasonsRef.current.entries())
            .map(([label, info]) => ({ label, ...info }))
            .sort((a, b) => b.caughtWrongCount - a.caughtWrongCount)
            .slice(0, 8);
    }, [gameOver, frame]);

    return (
        <div className="gpage">
            <div className="gphone">
                <div className="gscene">
                    {/* Header */}
                    <div className="gheader">
                        <button className="gbtn" onClick={() => navigate("/")}>
                            ← Home
                        </button>

                        <div className="gtitle">
                            🎮 <span>Compost Catch</span>
                        </div>

                        <div className="gstats">
                            <div>
                                Score: <b>{score}</b>
                            </div>
                            <div>
                                Lives: <b>{"❤️".repeat(Math.max(0, lives))}</b>
                            </div>
                        </div>
                    </div>

                    {/* Difficulty bar (must be ABOVE arena & clickable) */}
                    <div className="gdifficulty">
                        <div className="gdLabel">Difficulty:</div>
                        {["easy", "medium", "hard"].map((k) => (
                            <button
                                key={k}
                                className={`gdBtn ${mode === k ? "gdBtnOn" : ""}`}
                                onClick={() => {
                                    setMode(k);
                                    resetGame(k);
                                }}
                                type="button"
                                aria-pressed={mode === k}
                            >
                                {DIFFS[k].label}
                            </button>
                        ))}
                    </div>

                    {/* Arena */}
                    <div className="garena" ref={arenaRef}>
                        <div className="gprogress">
                            Items: <b>{stateRef.current.processed}/{total}</b>
                        </div>

                        {/* Items */}
                        {stateRef.current.items.map((it) => {
                            const sameLook = DIFFS[mode]?.trashSameColor; // use selected mode directly
                            const itemClass = sameLook
                                ? "gitemSame"
                                : it.compostable
                                    ? "gitemGood"
                                    : "gitemBad";

                            return (
                                <div
                                    key={it.id}
                                    className={`gitem ${itemClass}`}
                                    style={{
                                        left: `calc(${it.x}% - 48px)`,
                                        top: `${it.y}px`,
                                        transform: `rotate(${it.rot}deg)`,
                                    }}
                                >
                                    <div className="gitemName">{it.label}</div>
                                </div>
                            );
                        })}


                        {/* Bin */}
                        <div
                            className={`gbin ${binDamaged ? "gbinDamaged" : ""}`}
                            style={{ left: `calc(${binX}% - 34px)` }}
                            aria-label="Compost bin"
                        >
                            <img src={COMPOST_BIN_IMG} alt="Compost bin" className="gbinImg" />
                        </div>

                        {!gameOver && (
                            <div className="ghint">
                                Drag to move • Catch compost  • Avoid trash 
                                {diff?.trashSameColor ? " • (Trash looks the same!)" : ""}
                            </div>
                        )}

                        {gameOver && (
                            <div className="gover">
                                <div className="goverCard">
                                    <div className="goverTitle">
                                        {lives > 0 ? "You finished! 🎉" : "Game Over 💥"}
                                    </div>

                                    <div className="goverBody">
                                        <div><b>Difficulty:</b> {DIFFS[stateRef.current.diffKey].label}</div>
                                        <div><b>Score:</b> {score}</div>
                                        <div><b>Lives left:</b> {Math.max(0, lives)}</div>
                                        <div><b>Items processed:</b> {stateRef.current.processed}/{total}</div>
                                    </div>

                                    {reasons.length > 0 && (
                                        <div className="gwhy">
                                            <div className="gwhyTitle">Why some items aren’t compostable:</div>
                                            <ul className="gwhyList">
                                                {reasons.map((r) => (
                                                    <li key={r.label}>
                                                        <b>{r.label}</b> — {r.why}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="goverBtns">
                                        <button className="gbtnPrimary" onClick={() => resetGame(mode)}>
                                            Play Again
                                        </button>
                                        <button className="gbtn" onClick={() => navigate("/")}>
                                            Back to Home
                                        </button>
                                        <button className="gbtnLearn" onClick={() => navigate("/learn")}>
                                            Learn More
                                        </button>
                                    </div>

                                    <div className="goverFoot">
                                        Tip: Compost rules vary by location — check your local program.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* keep frame referenced */}
                    <div style={{ display: "none" }}>{frame}</div>
                </div>
            </div>
        </div>
    );
}
