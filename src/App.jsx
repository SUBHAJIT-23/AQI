import React, { useState, useEffect } from "react";

function getAQICategory(aqi) {
  if (aqi <= 50) return { label: "Good", color: "#16A34A" };
  if (aqi <= 100) return { label: "Satisfactory", color: "#84CC16" };
  if (aqi <= 200) return { label: "Moderate", color: "#F59E0B" };
  if (aqi <= 300) return { label: "Poor", color: "#F97316" };
  if (aqi <= 400) return { label: "Very Poor", color: "#DC2626" };
  return { label: "Severe", color: "#6B7280" };
}

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

  function handleChange(k, v) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function handlePredict(e) {
    e.preventDefault();

    const v = Object.fromEntries(
      Object.entries(values).map(([k, val]) => [k, Number(val || 0)])
    );

    const score =
      v.PM2_5 * 0.45 +
      v.PM10 * 0.25 +
      v.NO2 * 0.08 +
      v.SO2 * 0.06 +
      v.CO * 2.5 +
      v.O3 * 0.06 -
      (v.wind_speed * 2 + (50 - v.humidity) * 0.2);

    const predicted = Math.min(600, Math.round(Math.max(0, score)));
    setResult(predicted);
  }

  useEffect(() => {
    if (result === null) return;
    const startTime = performance.now();
    const duration = 900;

    function animate(now) {
      const progress = Math.min((now - startTime) / duration, 1);
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
  }

  const cat = result !== null ? getAQICategory(result) : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-lime-50 to-emerald-100 flex items-center justify-center p-4">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-3 h-3 bg-green-400/40 rounded-full animate-[float_12s_linear_infinite] left-[10%] top-[90%]" />
        <div className="absolute w-4 h-4 bg-green-300/40 rounded-full animate-[float_15s_linear_infinite] left-[35%] top-[95%]" />
        <div className="absolute w-2 h-2 bg-emerald-400/40 rounded-full animate-[float_10s_linear_infinite] left-[65%] top-[92%]" />
        <div className="absolute w-5 h-5 bg-lime-400/40 rounded-full animate-[float_18s_linear_infinite] left-[85%] top-[94%]" />
      </div>

      <div className="w-full max-w-3xl rounded-3xl p-8 shadow-2xl border border-white/50 bg-white/40 backdrop-blur-xl transition-transform duration-500 hover:scale-[1.015] hover:shadow-[0_30px_80px_rgba(0,0,0,0.15)]">

        <h1 className="text-3xl font-bold text-center text-emerald-700 mb-4">
          🌿 AQI STUDIO
        </h1>

        <div className="flex gap-2 justify-center mb-4 flex-wrap">
          <button onClick={() => loadSample("clean")} className="px-3 py-1 rounded-full bg-green-200/60">Clean</button>
          <button onClick={() => loadSample("moderate")} className="px-3 py-1 rounded-full bg-lime-200/60">Moderate</button>
          <button onClick={() => loadSample("polluted")} className="px-3 py-1 rounded-full bg-orange-200/60">Polluted</button>
        </div>

        <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(values).map((k) => (
            <div key={k}>
              <label className="text-xs text-emerald-700">{k.replace(/_/g, " ")}</label>
              <input
                type="number"
                value={values[k]}
                onChange={(e) => handleChange(k, e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-green-200 bg-white/60 backdrop-blur focus:outline-none"
              />
            </div>
          ))}

          <div className="sm:col-span-2 flex gap-4 mt-2 justify-center">
            <button type="submit" className="px-6 py-2 rounded-full bg-green-600 text-white shadow-lg">Predict</button>
            <button
              type="button"
              onClick={() => {
                const empty = {};
                Object.keys(values).forEach((k) => (empty[k] = ""));
                setValues(empty);
                setResult(null);
                setDisplayValue(0);
              }}
              className="px-6 py-2 rounded-full border bg-white/50"
            >
              Reset
            </button>
          </div>
        </form>

        {result !== null && (
          <div className="mt-8 text-center">
            <div className="text-sm text-gray-500">Predicted AQI</div>
            <div className="text-5xl font-extrabold tracking-wide" style={{ color: cat?.color }}>
              {displayValue}
            </div>
            <div className="text-lg font-semibold mt-1" style={{ color: cat?.color }}>
              {cat?.label}
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <LegendItem color="#16A34A" label="0-50" text="Good" />
          <LegendItem color="#84CC16" label="51-100" text="Satisfactory" />
          <LegendItem color="#F59E0B" label="101-200" text="Moderate" />
          <LegendItem color="#F97316" label="201-300" text="Poor" />
          <LegendItem color="#DC2626" label="301-400" text="Very Poor" />
          <LegendItem color="#6B7280" label="401+" text="Severe" />
        </div>

      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0); opacity: 0 }
          10% { opacity: 0.6 }
          100% { transform: translateY(-120vh); opacity: 0 }
        }
      `}</style>

    </div>
  );
}

function LegendItem({ color, label, text }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-white/40 rounded-lg backdrop-blur transition-transform hover:scale-105">
      <div style={{ width: 36, height: 20, background: color, borderRadius: 6 }} />
      <div>
        <div className="text-sm font-semibold">{text}</div>
        <div className="text-xs text-gray-600">{label}</div>
      </div>
    </div>
  );
}
