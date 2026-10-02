import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router"; // Unified package import matching App.tsx

export default function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Fetch single progress log summary asset from your updated plural backend route
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:3000/reports/${id}`)
      .then((res) => {
        if (!res.ok)
          throw new Error(
            "Could not locate targeted reporting log document reference.",
          );
        return res.json();
      })
      .then((data) => setReport(data))
      .catch((err) =>
        console.error("Details database retrieval exception:", err),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col justify-center items-center space-y-4">
        <div className="text-3xl select-none">⚠️</div>
        <p className="text-sm font-semibold text-neutral/50 tracking-wide">
          Progress report details could not be found.
        </p>
        <button
          onClick={() => navigate("/reports")}
          className="btn btn-sm btn-neutral text-white rounded-xl px-5 font-bold cursor-pointer"
        >
          Back to Reports List
        </button>
      </div>
    );
  }

  const snapshotMeds = Array.isArray(report.activeMedications)
    ? report.activeMedications
    : [];
  const displayDate = new Date(report.date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div className="min-h-screen bg-base-200 flex justify-center items-start p-4 sm:p-10 font-sans antialiased text-neutral">
      <div className="w-full max-w-2xl bg-base-100 border border-base-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Dynamic Header Section */}
        <header className="flex justify-between items-center pb-4 border-b border-base-200">
          <div>
            <button
              onClick={() => navigate("/reports")} // Navigates back absolutely
              className="text-xs font-bold text-primary tracking-wide hover:underline cursor-pointer mb-1 block"
            >
              ← Back to Reports List
            </button>
            <h2 className="text-xl font-black text-neutral tracking-wide">
              {displayDate}
            </h2>
          </div>
          <span className="badge badge-accent bg-accent text-neutral font-bold px-3 py-2.5 rounded-lg text-xs border-none select-none">
            Saved Snapshot
          </span>
        </header>

        {/* Prescription Snapshot View */}
        <div className="bg-base-200/40 p-4 rounded-xl border border-base-200 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral/60 block">
            Prescription Snapshot on Log Date
          </span>
          <div className="flex flex-wrap gap-2">
            {snapshotMeds.length === 0 ? (
              <span className="text-xs text-neutral/40 italic">
                No active medications recorded on this timeline calendar block.
              </span>
            ) : (
              snapshotMeds.map((m: any, idx: number) => (
                <span
                  key={m.medicationId || idx}
                  className="badge bg-neutral/5 border border-neutral/10 text-neutral/80 text-xs font-semibold px-3 py-2.5 rounded-lg shadow-sm"
                >
                  💊 {m.name} ({m.dosage})
                </span>
              ))
            )}
          </div>
        </div>

        {/* 5 Clinical Metric Visual Progress Scales Grid */}
        <div className="space-y-4">
          {[
            {
              key: "mood",
              label: "Mood Scale",
              left: "Severe Low",
              right: "Excellent",
            },
            {
              key: "irritability",
              label: "Irritability",
              left: "Calm / None",
              right: "Severe",
            },
            {
              key: "energy",
              label: "Energy Level",
              left: "Fatigue",
              right: "High Alert",
            },
            {
              key: "sleep",
              label: "Sleep Quality",
              left: "Restless",
              right: "Excellent Rest",
            },
            {
              key: "concentration",
              label: "Concentration",
              left: "Brain Fog",
              right: "Very Sharp",
            },
          ].map((item) => {
            const scoreValue = report[item.key] ?? 0;
            return (
              <div
                key={item.key}
                className="p-4 border border-base-200 bg-base-200/10 rounded-xl space-y-2 shadow-inner"
              >
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-neutral/65">
                  <span>{item.label}</span>
                  <span className="text-primary font-black bg-primary/10 px-2 py-0.5 rounded-md text-[13px]">
                    {scoreValue} / 5
                  </span>
                </div>
                {/* Fixed read-only visual slider bar track map indicator line formatting */}
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={scoreValue}
                  disabled
                  className="range range-primary range-xs pointer-events-none opacity-85 select-none"
                />
                <div className="flex justify-between text-[9px] font-bold text-neutral/40 px-0.5 uppercase tracking-wider">
                  <span>{item.left}</span>
                  <span>{item.right}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clinical Notes Summary Observation Output Context Card */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral/60 block">
            Patient Observation Notes (Message)
          </span>
          <div className="p-4 bg-base-200/40 border border-base-200 rounded-xl text-sm text-neutral/80 min-h-20 font-medium leading-relaxed shadow-inner">
            {report.message || (
              <span className="italic opacity-40 font-normal">
                No custom observations or side-effect descriptions were logged
                on this day record.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
