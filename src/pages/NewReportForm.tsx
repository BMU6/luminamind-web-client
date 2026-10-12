import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/useAuth";
import { useTranslation } from "react-i18next"; // Core Translation framework hook
import { PageCard, PageToolbar, ToolbarButton } from "@/components";

export default function NewReportForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // Pulls the lookup translation handles

  const userId =
    user && "sub" in user
      ? (user.sub as string)
      : (user as any)?.id || (user as any)?._id || "";

  // 1. Core Clinical Metric Sliders State
  const [mood, setMood] = useState<number>(3);
  const [irritability, setIrritability] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(3);
  const [sleep, setSleep] = useState<number>(3);
  const [concentration, setConcentration] = useState<number>(3);
  const [message, setMessage] = useState<string>("");

  // 2. Active Medications State parameters
  const [availableMeds, setAvailableMeds] = useState<any[]>([]);
  const [loadingMeds, setLoadingMeds] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 3. Auto-populate current treatments on mount
  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:3000/medicationlist`)
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

      const activeMedicationsSnapshot = availableMeds.map((m) => ({
        medicationId: m.id || m._id,
        name: m.name,
        dosage: m.dosage,
      }));

      const response = await fetch("http://localhost:3000/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          irritability,
          energy,
          sleep,
          concentration,
          message,
          activeMedications: activeMedicationsSnapshot,
        }),
      });

      if (!response.ok)
        throw new Error("Failed committing progress metrics log.");

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
        <p className="ml-3 text-sm font-medium text-base-content/50">
          {t("newReport.verifyingSession")}
        </p>
      </div>
    );
  }

  const isGermanActive = i18n.resolvedLanguage === "de";

  const METRIC_CONFIGS = [
    {
      label: t("newReport.metrics.mood.label"),
      state: mood,
      setter: setMood,
      left: t("newReport.metrics.mood.left"),
      right: t("newReport.metrics.mood.right"),
    },
    {
      label: t("newReport.metrics.irritability.label"),
      state: irritability,
      setter: setIrritability,
      left: t("newReport.metrics.irritability.left"),
      right: t("newReport.metrics.irritability.right"),
    },
    {
      label: t("newReport.metrics.energy.label"),
      state: energy,
      setter: setEnergy,
      left: t("newReport.metrics.energy.left"),
      right: t("newReport.metrics.energy.right"),
    },
    {
      label: t("newReport.metrics.sleep.label"),
      state: sleep,
      setter: setSleep,
      left: t("newReport.metrics.sleep.left"),
      right: t("newReport.metrics.sleep.right"),
    },
    {
      label: t("newReport.metrics.concentration.label"),
      state: concentration,
      setter: setConcentration,
      left: t("newReport.metrics.concentration.left"),
      right: t("newReport.metrics.concentration.right"),
    },
  ];
  return (
    <PageCard>
      <PageToolbar
        title={t("newReport.toolbarTitle")}
        leading={
          <span className="text-sm font-semibold tracking-wide text-white/90">
            {new Date().toLocaleDateString(isGermanActive ? "de-DE" : "en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            @{" "}
            {new Date().toLocaleTimeString(isGermanActive ? "de-DE" : "en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: !isGermanActive,
            })}
          </span>
        }
      >
        <ToolbarButton onClick={() => navigate("/reports")}>
          {t("newReport.cancelBtn")}
        </ToolbarButton>
      </PageToolbar>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Automated Medication Treatment Snapshot Badge Display */}
        <div className="bg-base-200/40 p-4 rounded-xl border border-base-200 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-base-content/60 block">
            {t("newReport.snapshotTitle")}
          </span>
          <div className="flex flex-wrap gap-2">
            {loadingMeds ? (
              <span className="loading loading-dots loading-xs text-base-content/40"></span>
            ) : availableMeds.length === 0 ? (
              <span className="text-xs text-base-content/40 italic">
                {t("newReport.noMeds")}
              </span>
            ) : (
              availableMeds.map((m) => (
                <span
                  key={m.id || m._id}
                  className="badge bg-primary/10 border border-primary/20 text-base-content text-xs font-semibold px-3 py-2.5 rounded-lg shadow-sm"
                >
                  💊 {m.name} ({m.dosage})
                </span>
              ))
            )}
          </div>
        </div>

        {/* Notes Log Message Fields */}
        <div className="form-control space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-base-content/60 block">
            {t("newReport.notesLabel")}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("newReport.notesPlaceholder")}
            className="textarea textarea-bordered rounded-2xl text-sm focus:outline-primary shadow-inner h-24 p-4 border-base-200 bg-base-100 w-full"
          />
        </div>

        {/* 5-Metric Dynamic Color-Shifting Radio Button Matrix */}
        <div className="space-y-6">
          {METRIC_CONFIGS.map((item) => (
            <div
              key={item.label}
              className="p-5 border border-base-200 bg-base-200/10 rounded-2xl space-y-3 shadow-inner"
            >
              {/* Metric Label and Active Selection Badge */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-widest text-base-content/70">
                  {item.label}
                </span>
                <span className="text-base-content font-black bg-base-100 border border-base-300 px-3 py-1 rounded-xl text-xs shadow-xs">
                  {t("newReport.scoreLabel")}: {item.state}
                </span>
              </div>

              {/* Horizontal Radio Inputs Row Container */}
              <div className="flex justify-between items-center bg-base-100 p-3 rounded-xl border border-base-200 gap-2">
                {[0, 1, 2, 3, 4, 5].map((score) => {
                  const isSelected = item.state === score;

                  // Unselected fallback look and feel classes
                  let activeStyles =
                    "bg-base-200/40 text-base-content/50 border-base-200/20 hover:bg-base-200 hover:text-base-content hover:border-base-300";

                  // Apply static, unpurgeable classes explicitly when selected
                  if (isSelected) {
                    if (
                      item.label === t("newReport.metrics.irritability.label")
                    ) {
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
              <div className="flex justify-between text-[10px] font-bold text-base-content/40 px-1 uppercase tracking-wider select-none">
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
            {submitting ? t("newReport.submitting") : t("newReport.submitBtn")}
          </button>
        </div>
      </form>
    </PageCard>
  );
}
