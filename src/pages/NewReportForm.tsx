import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/useAuth";

export default function NewReportForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId =
    user && "sub" in user
      ? (user.sub as string)
      : (user as any)?.id || (user as any)?._id || "";

  // 1. Core Clinical Metric Sliders State (Defaults to neutral 3 or safe baseline 0)
  const [mood, setMood] = useState<number>(3);
  const [irritability, setIrritability] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(3);
  const [sleep, setSleep] = useState<number>(3);
  const [concentration, setConcentration] = useState<number>(3);
  const [message, setMessage] = useState<string>("");

  // 2. Active Medications Auto-population Registry Memory
  const [availableMeds, setAvailableMeds] = useState<any[]>([]);
  const [loadingMeds, setLoadingMeds] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 3. Auto-populate current treatments on mount
  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:3000/medicationlist?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setAvailableMeds(Array.isArray(data) ? data : []))
      .catch((err) =>
        console.error("Error pre-populating active medications payload:", err),
      )
      .finally(() => setLoadingMeds(false));
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // Automated snapshot creation matching your backend schema bounds
      const activeMedicationsSnapshot = availableMeds.map((m) => ({
        medicationId: m.id || m._id,
        name: m.name,
        dosage: m.dosage,
      }));

      const response = await fetch("http://localhost:3000/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          mood,
          irritability,
          energy,
          sleep,
          concentration,
          message,
          activeMedications: activeMedicationsSnapshot, // Sent automatically
        }),
      });

      if (!response.ok)
        throw new Error("Failed committing progress metrics log.");

      // Route smoothly back to the historical logs dashboard upon success
      navigate("/reports");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col justify-center items-center p-4">
        <span className="loading loading-spinner loading-md text-primary"></span>
        <p className="ml-3 text-sm font-medium text-neutral/50">
          Verifying session context...
        </p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-base-200 flex justify-center items-start p-4 sm:p-10 font-sans antialiased text-neutral">
      <div className="w-full max-w-2xl bg-base-100 border border-base-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <header className="flex justify-between items-center pb-4 border-b border-base-200">
          <div>
            <button
              type="button"
              onClick={() => navigate("/reports")}
              className="text-xs font-bold text-primary tracking-wide hover:underline cursor-pointer mb-1 block"
            >
              ← Cancel & Go Back
            </button>
            <h2 className="text-xl font-black text-neutral tracking-wide">
              Log Daily Progress
            </h2>
          </div>
          {/* Updated Time & Date Display */}
          <span className="text-xs font-bold text-neutral/40 tracking-wider bg-base-200 px-3 py-1.5 rounded-xl text-right">
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            @{" "}
            {new Date().toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
              hour12: true, // Forces AM/PM output format
            })}
          </span>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Automated Medication Treatment Snapshot Badge Display */}
          <div className="bg-base-200/40 p-4 rounded-xl border border-base-200 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral/60 block">
              Auto-Attaching Current Prescription Snapshot
            </span>
            <div className="flex flex-wrap gap-2">
              {loadingMeds ? (
                <span className="loading loading-dots loading-xs text-neutral/40"></span>
              ) : availableMeds.length === 0 ? (
                <span className="text-xs text-neutral/40 italic">
                  No scheduled active medications logged on your profile today.
                </span>
              ) : (
                availableMeds.map((m) => (
                  <span
                    key={m.id}
                    className="badge bg-primary/10 border border-primary/20 text-neutral text-xs font-semibold px-3 py-2.5 rounded-lg shadow-sm"
                  >
                    💊 {m.name} ({m.dosage})
                  </span>
                ))
              )}
            </div>
          </div>
          {/* Notes Log Message Fields */}
          <div className="form-control space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral/60 block">
              Daily Notes & Observations (Message)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe any custom psychological observations, side-effects, or notable therapy milestones encountered today..."
              className="textarea textarea-bordered rounded-2xl text-sm focus:outline-primary shadow-inner h-24 p-4 border-base-200 bg-base-100 w-full"
            />
          </div>
          {/* 5-Metric Dynamic Color-Shifting Radio Button Matrix */}
          <div className="space-y-6">
            {[
              {
                label: "Mood",
                state: mood,
                setter: setMood,
                left: "Severe Low",
                right: "Excellent",
                invertColor: true,
              },
              {
                label: "Irritability",
                state: irritability,
                setter: setIrritability,
                left: "Calm / None",
                right: "Severe",
                invertColor: false,
              },
              {
                label: "Energy Level",
                state: energy,
                setter: setEnergy,
                left: "Fatigue",
                right: "High Alert",
                invertColor: true,
              },
              {
                label: "Sleep Quality",
                state: sleep,
                setter: setSleep,
                left: "Restless",
                right: "Excellent Rest",
                invertColor: true,
              },
              {
                label: "Concentration",
                state: concentration,
                setter: setConcentration,
                left: "Brain Fog",
                right: "Very Sharp",
                invertColor: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="p-5 border border-base-200 bg-base-200/10 rounded-2xl space-y-3 shadow-inner"
              >
                {/* Metric Label and Active Selection Badge */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs uppercase tracking-widest text-neutral/70">
                    {item.label}
                  </span>
                  <span className="text-neutral font-black bg-base-100 border border-base-300 px-3 py-1 rounded-xl text-xs shadow-xs">
                    Score: {item.state}
                  </span>
                </div>

                {/* Horizontal Radio Inputs Row Container */}
                <div className="flex justify-between items-center bg-base-100 p-3 rounded-xl border border-base-200 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((score) => {
                    const isSelected = item.state === score;

                    // Unselected fallback look and feel classes
                    let activeStyles =
                      "bg-base-200/40 text-neutral/50 border-base-200/20 hover:bg-base-200 hover:text-neutral hover:border-base-300";

                    // Apply static, unpurgeable classes explicitly when selected
                    if (isSelected) {
                      if (item.label === "Irritability") {
                        // High is BAD (e.g., Irritability turning red)
                        if (score <= 1)
                          activeStyles =
                            "bg-emerald-600 border-emerald-600 text-white font-black shadow-md scale-105";
                        else if (score <= 3)
                          activeStyles =
                            "bg-amber-500 border-amber-500 text-white font-black shadow-md scale-105";
                        else
                          activeStyles =
                            "bg-rose-600 border-rose-600 text-white font-black shadow-md scale-105";
                      } else {
                        // High is GOOD (e.g., Mood, Energy, Sleep, Concentration turning green)
                        if (score <= 1)
                          activeStyles =
                            "bg-rose-600 border-rose-600 text-white font-black shadow-md scale-105";
                        else if (score <= 3)
                          activeStyles =
                            "bg-amber-500 border-amber-500 text-white font-black shadow-md scale-105";
                        else
                          activeStyles =
                            "bg-emerald-600 border-emerald-600 text-white font-black shadow-md scale-105";
                      }
                    }

                    return (
                      <label
                        key={score}
                        className={`flex flex-col items-center justify-center flex-1 py-2.5 rounded-xl cursor-pointer border transition-all duration-200 select-none ${activeStyles}`}
                      >
                        <input
                          type="radio"
                          name={`radio-${item.label}`}
                          value={score}
                          checked={isSelected}
                          onChange={() => item.setter(score)}
                          className="sr-only"
                        />
                        <span className="text-sm font-bold tracking-wide">
                          {score}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Contextual Boundary Anchors Text Help Line */}
                <div className="flex justify-between text-[10px] font-bold text-neutral/40 px-1 uppercase tracking-wider select-none">
                  <span>{item.left}</span>
                  <span>{item.right}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Submission Operational Bar */}
          <div className="flex justify-end pt-4 border-t border-base-200">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-md btn-neutral text-white rounded-xl px-8 font-bold tracking-wider cursor-pointer shadow-md hover:bg-neutral/90 transition-all uppercase"
            >
              {submitting ? "Saving Entry Log..." : "Submit Progress Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
