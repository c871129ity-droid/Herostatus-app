import { useState, useEffect, useRef } from "react";

const TABS = ["英雄", "習慣", "任務", "金庫"];
const TAB_ICONS = ["⚔️", "🔥", "📋", "💰"];
const DIFF_COLORS = {
  "D級：雜魚": "#94a3b8",
  "C級：常規": "#4ade80",
  "B級：精英": "#38bdf8",
  "A級：威脅": "#fb923c",
  "S級：傳說": "#f43f5e",
  "E級：微習慣": "#4ade80",
  "D級：輕度行動": "#94a3b8",
  "C級：常規阻力": "#38bdf8",
};

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [hero, setHero] = useState(null);
  const [habits, setHabits] = useState([]);
  const [quests, setQuests] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gainedEXP, setGainedEXP] = useState(null);
  const [scanLine, setScanLine] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine(p => (p + 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.3, a: Math.random(),
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,200,${p.a * 0.3})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const fetchData = async () => {
    try {
      const [heroRes, habitsRes, questsRes, accountsRes] = await Promise.all([
        fetch("/api/notion?type=hero"),
        fetch("/api/notion?type=habits"),
        fetch("/api/notion?type=quests"),
        fetch("/api/notion?type=accounts"),
      ]);
      const [heroData, habitsData, questsData, accountsData] = await Promise.all([
        heroRes.json(), habitsRes.json(), questsRes.json(), accountsRes.json(),
      ]);
      setHero(heroData);
      setHabits(habitsData);
      setQuests(questsData);
      setAccounts(accountsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showEXP = (text) => {
    setGainedEXP(text);
    setTimeout(() => setGainedEXP(null), 1500);
  };

  const toggleHabit = (habit) => {
    if (!habit.done) showEXP(`+${habit.exp} EXP`);
    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, done: !h.done } : h));
  };

  const toggleQuest = (quest) => {
    if (!quest.done) showEXP(`+${quest.exp} EXP ⚔️`);
    setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, done: !q.done } : q));
  };

  const totalHabitEXP = habits.filter(h => h.done).reduce((s, h) => s + (h.exp || 0), 0);
  const totalQuestEXP = quests.filter(q => q.done).reduce((s, q) => s + (q.exp || 0), 0);
  const baseEXP = hero?.exp || 0;
  const totalEXP = baseEXP + totalHabitEXP + totalQuestEXP;
  const level = Math.floor(Math.sqrt(0.25 + totalEXP / 50) + 0.5);
  const nextLvEXP = level * (level + 1) * 50;
  const prevLvEXP = (level - 1) * level * 50;
  const progress = Math.min(((totalEXP - prevLvEXP) / (nextLvEXP - prevLvEXP)) * 100, 100);

  const totalAssets = accounts.filter(a => a.type !== "負債").reduce((s, a) => s + (a.balance || 0), 0);
  const totalDebt = accounts.filter(a => a.type === "負債").reduce((s, a) => s + (a.balance || 0), 0);
  const netWorth = totalAssets - totalDebt;
  const fmt = (n) => n >= 0 ? `$${n.toLocaleString()}` : `-$${Math.abs(n).toLocaleString()}`;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#020d10", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#00ffc8", fontFamily: "monospace", fontSize: 18 }}>
        LOADING HERO DATA...
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#020d10", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Courier New', monospace", padding: "20px 0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; }
        .hero-app { font-family: 'Share Tech Mono', monospace; }
        .tab-btn { background: none; border: none; cursor: pointer; transition: all 0.2s; }
        .card { transition: all 0.2s; cursor: pointer; }
        .card:hover { transform: translateX(3px); }
        .glitch { position: relative; }
        .glitch::before { content: attr(data-text); position: absolute; top: 0; left: 2px; color: #ff0080; clip-path: inset(0 0 60% 0); animation: glitch 3s infinite; }
        @keyframes glitch { 0%,90%,100%{transform:translate(0);opacity:0} 92%{transform:translate(-2px,1px);opacity:0.8} 94%{transform:translate(2px,-1px);opacity:0.8} 96%{transform:translate(0);opacity:0} }
        .exp-float { position: fixed; top: 40%; left: 50%; transform: translateX(-50%); color: #00ffc8; font-size: 24px; font-weight: bold; animation: floatUp 1.5s ease-out forwards; pointer-events: none; z-index: 999; text-shadow: 0 0 20px #00ffc8; }
        @keyframes floatUp { 0%{opacity:1;transform:translateX(-50%) translateY(0)} 100%{opacity:0;transform:translateX(-50%) translateY(-80px)} }
        .progress-bar { background: linear-gradient(90deg,#00ffc8,#0080ff); height: 100%; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 0 12px #00ffc8,0 0 24px rgba(0,255,200,0.4); position: relative; }
        .progress-bar::after { content:''; position:absolute; right:0; top:0; bottom:0; width:4px; background:white; box-shadow:0 0 8px white; animation:pulse 1s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .neon-border { box-shadow: 0 0 0 1px rgba(0,255,200,0.3),inset 0 0 20px rgba(0,255,200,0.03); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #020d10; }
        ::-webkit-scrollbar-thumb { background: #00ffc840; border-radius: 2px; }
      `}</style>

      {gainedEXP && <div className="exp-float">{gainedEXP}</div>}

      <div className="hero-app" style={{ width: "100%", maxWidth: 390, minHeight: 780, background: "#030f14", border: "1px solid rgba(0,255,200,0.2)", borderRadius: 24, overflow: "hidden", position: "relative", boxShadow: "0 0 40px rgba(0,255,200,0.1),0 0 80px rgba(0,0,0,0.8)" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, borderRadius: 24, pointerEvents: "none", background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,200,0.015) 2px,rgba(0,255,200,0.015) 4px)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, height: 2, zIndex: 1, top: `${scanLine}%`, background: "linear-gradient(90deg,transparent,rgba(0,255,200,0.15),transparent)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ padding: "20px 20px 0", borderBottom: "1px solid rgba(0,255,200,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ color: "rgba(0,255,200,0.4)", fontSize: 10, letterSpacing: 3 }}>SYSTEM://HERO_STATUS</span>
              <span style={{ color: "rgba(0,255,200,0.4)", fontSize: 10 }}>◉ ONLINE</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 12, marginBottom: -1 }}>
              {TABS.map((tab, i) => (
                <button key={i} className="tab-btn" onClick={() => setActiveTab(i)} style={{ flex: 1, padding: "10px 4px 12px", color: activeTab === i ? "#00ffc8" : "rgba(0,255,200,0.3)", borderBottom: activeTab === i ? "2px solid #00ffc8" : "2px solid transparent", fontSize: 11, letterSpacing: 1 }}>
                  <div style={{ fontSize: 16 }}>{TAB_ICONS[i]}</div>
                  <div>{tab}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: 20, minHeight: 640, overflowY: "auto", maxHeight: 680 }}>

            {/* 英雄頁 */}
            {activeTab === 0 && (
              <div>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ width: 96, height: 96, borderRadius: "50%", margin: "0 auto 12px", background: "linear-gradient(135deg,#001a20,#003040)", border: "2px solid rgba(0,255,200,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: "0 0 20px rgba(0,255,200,0.2)" }}>🥷</div>
                  <h1 className="glitch" data-text={hero?.name || "英雄"} style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 32, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: 4 }}>{hero?.name || "英雄"}</h1>
                  <div style={{ display: "inline-block", marginTop: 6, padding: "2px 12px", border: "1px solid rgba(0,255,200,0.3)", color: "rgba(0,255,200,0.6)", fontSize: 11, letterSpacing: 3 }}>{hero?.title || "街頭浪人"}</div>
                </div>
                <div className="neon-border" style={{ background: "rgba(0,255,200,0.03)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ color: "rgba(0,255,200,0.5)", fontSize: 11, letterSpacing: 2 }}>LEVEL</span>
                    <span style={{ color: "#00ffc8", fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700 }}>Lv.{level}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "rgba(0,255,200,0.1)", overflow: "hidden", marginBottom: 8 }}>
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(0,255,200,0.4)" }}>
                    <span>{totalEXP} EXP</span>
                    <span>{nextLvEXP} EXP</span>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  {[{ label: "基礎EXP", val: baseEXP, color: "#94a3b8" }, { label: "習慣EXP", val: totalHabitEXP, color: "#4ade80" }, { label: "任務EXP", val: totalQuestEXP, color: "#818cf8" }].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{item.label}</span>
                      <span style={{ color: item.color, fontSize: 12 }}>{item.val} EXP</span>
                    </div>
                  ))}
                </div>
                <div className="neon-border" style={{ background: "rgba(0,255,200,0.03)", borderRadius: 12, padding: 16 }}>
                  <div style={{ color: "rgba(0,255,200,0.5)", fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>FINANCIAL STATUS</div>
                  {[{ label: "💰 總資產", val: totalAssets, color: "#4ade80" }, { label: "💳 總負債", val: totalDebt, color: "#f87171" }, { label: "📊 淨值", val: netWorth, color: netWorth >= 0 ? "#4ade80" : "#fb923c" }].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{item.label}</span>
                      <span style={{ color: item.color, fontSize: 13, fontWeight: 600 }}>{fmt(item.val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 習慣頁 */}
            {activeTab === 1 && (
              <div>
                <div style={{ color: "rgba(0,255,200,0.4)", fontSize: 10, letterSpacing: 3, marginBottom: 16 }}>今日習慣 · {habits.filter(h => h.done).length}/{habits.length} 完成</div>
                {habits.map(h => (
                  <div key={h.id} className="card" onClick={() => toggleHabit(h)} style={{ background: h.done ? "rgba(0,255,200,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${h.done ? "rgba(0,255,200,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${h.done ? "#00ffc8" : "rgba(255,255,255,0.2)"}`, background: h.done ? "#00ffc8" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, boxShadow: h.done ? "0 0 10px rgba(0,255,200,0.5)" : "none" }}>{h.done ? "✓" : ""}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: h.done ? "rgba(255,255,255,0.4)" : "#fff", fontSize: 14, marginBottom: 4, textDecoration: h.done ? "line-through" : "none" }}>{h.name}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: DIFF_COLORS[h.difficulty] || "#94a3b8", fontSize: 10, border: `1px solid ${DIFF_COLORS[h.difficulty] || "#94a3b8"}40`, padding: "1px 6px", borderRadius: 4 }}>{h.difficulty}</span>
                        <span style={{ color: "rgba(255,200,0,0.7)", fontSize: 11 }}>🔥 {h.streak}天</span>
                      </div>
                    </div>
                    <div style={{ color: "#00ffc8", fontSize: 13, fontWeight: 600 }}>+{h.exp}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 任務頁 */}
            {activeTab === 2 && (
              <div>
                <div style={{ color: "rgba(0,255,200,0.4)", fontSize: 10, letterSpacing: 3, marginBottom: 16 }}>副本任務 · {quests.filter(q => q.done).length}/{quests.length} 完成</div>
                {quests.map(q => (
                  <div key={q.id} className="card" onClick={() => toggleQuest(q)} style={{ background: q.done ? "rgba(0,255,200,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${q.done ? "rgba(0,255,200,0.2)" : `${DIFF_COLORS[q.difficulty] || "#94a3b8"}30`}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: q.done ? "rgba(0,255,200,0.3)" : DIFF_COLORS[q.difficulty] || "#94a3b8", boxShadow: q.done ? "none" : `0 0 8px ${DIFF_COLORS[q.difficulty] || "#94a3b8"}` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: q.done ? "rgba(255,255,255,0.3)" : "#fff", fontSize: 14, marginBottom: 6, textDecoration: q.done ? "line-through" : "none" }}>{q.name}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ color: DIFF_COLORS[q.difficulty] || "#94a3b8", fontSize: 10, border: `1px solid ${DIFF_COLORS[q.difficulty] || "#94a3b8"}40`, padding: "1px 6px", borderRadius: 4 }}>{q.difficulty}</span>
                          <span style={{ color: "#00ffc8", fontSize: 11 }}>⚡ {q.exp} EXP</span>
                          <span style={{ color: "#fbbf24", fontSize: 11 }}>🪙 {q.gold}</span>
                        </div>
                      </div>
                      {q.done && <span style={{ color: "#00ffc8", fontSize: 18 }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 金庫頁 */}
            {activeTab === 3 && (
              <div>
                <div style={{ color: "rgba(0,255,200,0.4)", fontSize: 10, letterSpacing: 3, marginBottom: 16 }}>ENTERPRISE VAULT</div>
                <div style={{ textAlign: "center", padding: "24px 16px", background: "rgba(0,255,200,0.03)", border: "1px solid rgba(0,255,200,0.15)", borderRadius: 16, marginBottom: 16 }}>
                  <div style={{ color: "rgba(0,255,200,0.4)", fontSize: 10, letterSpacing: 3, marginBottom: 8 }}>NET WORTH</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 36, fontWeight: 700, color: netWorth >= 0 ? "#4ade80" : "#fb923c" }}>{fmt(netWorth)}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>信貸清償進度 {totalDebt > 0 ? Math.round((1 - totalDebt / 654764) * 100) : 100}%</div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "12px 0 0", overflow: "hidden" }}>
                    <div style={{ width: `${totalDebt > 0 ? Math.round((1 - totalDebt / 654764) * 100) : 100}%`, height: "100%", background: "#fb923c", boxShadow: "0 0 8px #fb923c" }} />
                  </div>
                </div>
                {accounts.map((acc, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, marginBottom: 8 }}>
                    <div>
                      <div style={{ color: "#fff", fontSize: 13 }}>{acc.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{acc.type}</div>
                    </div>
                    <div style={{ color: acc.type === "負債" ? "#f87171" : "#4ade80", fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 600 }}>{fmt(acc.balance || 0)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 20px 24px", borderTop: "1px solid rgba(0,255,200,0.1)", background: "rgba(3,15,20,0.95)", backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              {TABS.map((tab, i) => (
                <button key={i} className="tab-btn" onClick={() => setActiveTab(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: activeTab === i ? "#00ffc8" : "rgba(0,255,200,0.25)", fontSize: 10, letterSpacing: 1, padding: "4px 12px" }}>
                  <span style={{ fontSize: 20 }}>{TAB_ICONS[i]}</span>
                  <span>{tab}</span>
                  {activeTab === i && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#00ffc8", boxShadow: "0 0 6px #00ffc8" }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
