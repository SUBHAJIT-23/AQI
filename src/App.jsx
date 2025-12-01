import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

function getAQICategory(aqi) {
  if (aqi <= 50) return { label: "Good", color: "#16A34A" };
  if (aqi <= 100) return { label: "Satisfactory", color: "#84CC16" };
  if (aqi <= 200) return { label: "Moderate", color: "#F59E0B" };
  if (aqi <= 300) return { label: "Poor", color: "#F97316" };
  if (aqi <= 400) return { label: "Very Poor", color: "#DC2626" };
  return { label: "Severe", color: "#7034D5" };
}

const LABEL_MAP = {
  PM2_5: "PM 2.5",
  PM10: "PM10",
  NO2: "NO2",
  SO2: "SO2",
  CO: "CO",
  O3: "O3",
  temperature: "Temperature",
  humidity: "Humidity",
  wind_speed: "Wind Speed",
};

export default function App() {
  const [values, setValues] = useState({
    PM2_5: "",
    PM10: "",
    NO2: "",
    SO2: "",
    CO: "",
    O3: "",
    temperature: "",
    humidity: "",
    wind_speed: "",
  });

  const [result, setResult] = useState(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [csvRows, setCsvRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState("");

  useEffect(() => {
    fetch(`${API}/api/csv-rows`)
      .then((res) => res.json())
      .then((data) => {
        const cleanRows = data.filter((row) =>
          Object.values(row).some((v) => !Number.isNaN(v) && v !== 0)
        );
        setCsvRows(cleanRows);
      })
      .catch(() => setCsvRows([]));
  }, []);

  function handleChange(k, v) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function handlePredict(e) {
    e.preventDefault();

    const v = Object.fromEntries(
      Object.entries(values).map(([k, val]) => [k, Number(val || 0)])
    );

    fetch(`${API}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    })
      .then((res) => res.json())
      .then((data) => setResult(data.predictedAQI));
  }

  useEffect(() => {
    if (result === null) return;
    const startTime = performance.now();

    function animate(now) {
      const progress = Math.min((now - startTime) / 900, 1);
      setDisplayValue(Math.floor(progress * result));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [result]);

  function loadSample(type) {
    const presets = {
      clean: { PM2_5: 18, PM10: 35, NO2: 15, SO2: 5, CO: 0.4, O3: 25, temperature: 26, humidity: 60, wind_speed: 4 },
      moderate: { PM2_5: 72, PM10: 130, NO2: 55, SO2: 18, CO: 1.2, O3: 45, temperature: 32, humidity: 48, wind_speed: 2 },
      polluted: { PM2_5: 180, PM10: 320, NO2: 140, SO2: 45, CO: 3.1, O3: 95, temperature: 36, humidity: 38, wind_speed: 1 },
    };

    setValues(presets[type]);
    setResult(null);
    setDisplayValue(0);
    setSelectedRow("");
  }

  function loadFromCSV(index) {
    const i = Number(index);
    if (Number.isNaN(i) || i < 0 || i >= csvRows.length) return;

    const row = csvRows[i];
    const safeRow = Object.fromEntries(
      Object.keys(values).map((k) => [k, row[k] ?? ""])
    );

    setValues(safeRow);
    setResult(null);
    setDisplayValue(0);
  }

  const cat = result !== null ? getAQICategory(result) : null;

  const adaptiveShadow = result ? cat?.label === "Severe" ? `0 0 40px ${cat.color}aa, 0 12px 36px ${cat.color}55` : `0 0 28px ${cat.color}` : "0 0 12px rgba(0,0,0,0.1)";

  return (
    <div className={`relative min-h-screen overflow-hidden flex items-center justify-center p-4 transition-colors duration-1000 ${result === null ? "bg-gradient-to-br from-green-50 via-lime-50 to-emerald-100" : result <= 100 ? "bg-gradient-to-br from-green-100 via-emerald-100 to-green-200" : result <= 200 ? "bg-gradient-to-br from-yellow-100 via-orange-100 to-amber-200" : result <= 300 ? "bg-gradient-to-br from-orange-200 via-red-100 to-orange-300" : result <= 400 ? "bg-gradient-to-br from-red-200 via-rose-200 to-red-300" : "bg-gradient-to-br from-[#c994ec] via-[#a87ff0] to-[#c4aeee]"}`}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-3 h-3 bg-green-400/40 rounded-full animate-[float_12s_linear_infinite] left-[10%] top-[90%]" />
        <div className="absolute w-4 h-4 bg-green-300/40 rounded-full animate-[float_15s_linear_infinite] left-[35%] top-[95%]" />
        <div className="absolute w-2 h-2 bg-emerald-400/40 rounded-full animate-[float_10s_linear_infinite] left-[65%] top-[92%]" />
        <div className="absolute w-5 h-5 bg-lime-400/40 rounded-full animate-[float_18s_linear_infinite] left-[85%] top-[94%]" />
      </div>

      <div
        className="w-full max-w-3xl rounded-3xl p-8 border border-white/50 bg-white/40 backdrop-blur-xl
        shadow-lg transition-transform duration-[1000ms] hover:scale-[1.008]"
        style={{ boxShadow: adaptiveShadow }}
      >
        <h1 className="text-3xl font-bold text-center text-emerald-700 mb-4">🌿 AQI STUDIO</h1>

        <div className="flex gap-2 justify-center mb-4 flex-wrap">
          <button onClick={() => loadSample("clean")} className="px-3 py-1 rounded-full bg-green-200/60">Clean</button>
          <button onClick={() => loadSample("moderate")} className="px-3 py-1 rounded-full bg-lime-200/60">Moderate</button>
          <button onClick={() => loadSample("polluted")} className="px-3 py-1 rounded-full bg-orange-200/60">Polluted</button>
        </div>

        <select
          value={selectedRow}
          onChange={(e) => {
            setSelectedRow(e.target.value);
            loadFromCSV(e.target.value);
          }}
          className="w-full px-4 py-2 rounded-xl border border-green-200 bg-white/60 transition-transform duration-200 active:scale-[0.96] mb-5">
          <option value="">Load From CSV</option>
          {csvRows.map((_, i) => (
            <option key={i} value={i}>Dataset Row {i + 1}</option>
          ))}
        </select>

        <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(values).map((k) => (
            <div key={k}>
              <label className="text-xs text-emerald-700">{LABEL_MAP[k]}</label>
              <input type="number" value={values[k]} onChange={(e) => handleChange(k, e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-green-200 bg-white/60 backdrop-blur" />
            </div>
          ))}

          <div className="sm:col-span-2 flex gap-4 mt-2 justify-center">
            <button
              type="submit"
              className="relative overflow-hidden px-6 py-2 rounded-full bg-green-600 text-white shadow-lg transition-transform duration-300 hover:scale-[1.05] hover:shadow-[0_0_20px_#16a34a]">
              <span className="relative z-10">Predict</span>
              <span className="absolute inset-0 ripple-effect" />
            </button>

            <button type="button" onClick={() => window.location.reload()} className="relative overflow-hidden px-6 py-2 rounded-full border bg-white/60 transition-transform duration-300 hover:scale-[1.05] hover:shadow-[0_0_18px_rgba(0,0,0,0.25)]" >
              <span className="relative z-10">Reset</span>
              <span className="absolute inset-0 ripple-effect" />
            </button>
          </div>
        </form>

        {result !== null && (
          <div className="mt-8 text-center">
            <div className="text-sm text-gray-500">Predicted AQI</div>

            <div
              className="text-5xl font-extrabold tracking-wide animate-[breathGlow_2s_infinite]"
              style={{
                color: cat?.color,
                textShadow: `0 0 16px ${cat?.color}`,
              }}
            >
              {displayValue}
            </div>

            <div className="text-lg font-semibold mt-1" style={{ color: cat?.color }}>
              {cat?.label}
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            ["Good", "#16A34A", "0-50"],
            ["Satisfactory", "#84CC16", "51-100"],
            ["Moderate", "#F59E0B", "101-200"],
            ["Poor", "#F97316", "201-300"],
            ["Very Poor", "#DC2626", "301-400"],
            ["Severe", "#7034D5", "401+"],
          ].map(([t, c, r]) => (
            <LegendItem
              key={t}
              active={cat?.label === t}
              color={c}
              label={r}
              text={t}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0); opacity: 0 }
          10% { opacity: 0.6 }
          100% { transform: translateY(-120vh); opacity: 0 }
        }

        @keyframes breathGlow {
          0%,100% { text-shadow: 0 0 6px currentColor; }
          50% { text-shadow: 0 0 28px currentColor; }
        }

        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 6px currentColor; }
          50% { box-shadow: 0 0 22px currentColor; }
        }

        .ripple-btn {
          position: relative;
          overflow: hidden;
          padding: 8px 20px;
          border-radius: 999px;
          background: rgba(255,255,255,0.6);
          transition: transform 0.3s;
        }
        .ripple-btn:hover {
          transform: scale(1.05);
        }
        .ripple-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(255,255,255,0.5) 10%, transparent 10%);
          opacity: 0;
        }
        .ripple-btn:hover::after {
          opacity: 1;
          animation: ripple 0.8s linear;
        }

        @keyframes ripple {
          from { background-position: 50% 50%; }
          to { background-position: 120% 120%; }
        }
      `}</style>
    </div>
  );
}

function LegendItem({ color, label, text, active }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-white/40 rounded-lg backdrop-blur transition-transform duration-[900ms] hover:scale-[1.05]" style={{
        outline: active ? `3px solid ${color}` : "none",
        boxShadow: active ? `0 0 20px ${color}` : "none",
        animation: active ? "pulseGlow 2s infinite" : "none",
      }}
    >
      <div style={{ width: 36, height: 20, background: color, borderRadius: 6 }} />
      <div>
        <div className="text-sm font-semibold">{text}</div>
        <div className="text-xs text-gray-600">{label}</div>
      </div>
    </div>
  );
}
