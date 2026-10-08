import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next"; // Core Translation framework hook
import { PageCard, PageToolbar, ToolbarButton } from "@/components";

export default function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // Instantiates translation function (t) and engine context (i18n)

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Local state modifiers for edit/delete lifecycle phases
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<any>(null);

  // 1. Fetch single progress log summary asset from backend
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:3000/reports/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(t("details.locateError"));
        return res.json();
      })
      .then((data) => {
        setReport(data);
        setEditForm(data); // Pre-populates the edit staging form state
      })
      .catch((err) =>
        console.error("Details database retrieval exception:", err),
      )
      .finally(() => setLoading(false));
  }, [id, t]);

  // 2. DELETE LIFECYCLE ACTION HANDLER
  const handleDeleteConfirmExecution = async () => {
    if (!id) return;

    try {
      setShowDeleteConfirm(false);
      setIsDeleting(true);
      const res = await fetch(`http://localhost:3000/reports/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed dropping record.");
      }

      toast.success(t("details.deleteSuccess"));
      navigate("/reports");
    } catch (err: unknown) {
      const message = (err as Error).message;
      toast.error(message || t("details.deleteErrorFallback"));
    } finally {
      setIsDeleting(false);
    }
  };

  // 3. EDIT FORM LIFECYCLE SUBMISSION HANDLER
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editForm.userId,
          mood: editForm.mood,
          concentration: editForm.concentration,
          irritability: editForm.irritability,
          energy: editForm.energy,
          sleep: editForm.sleep,
          message: editForm.message,
          activeMedications: editForm.activeMedications,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed updating document.");
      }

      const updatedReport = await res.json();
      setReport(updatedReport);
      toast.success(t("details.updateSuccess"));
      setIsEditing(false);
    } catch (err: unknown) {
      const message = (err as Error).message;
      toast.error(message || t("details.updateErrorFallback"));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isEditing) {
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
        <p className="text-sm font-semibold text-base-content/50 tracking-wide">
          {t("details.notFoundTitle")}
        </p>
        <button
          onClick={() => navigate("/reports")}
          className="btn btn-sm btn-neutral text-white rounded-xl px-5 font-bold cursor-pointer"
        >
          {t("details.backToListBtn")}
        </button>
      </div>
    );
  }

  const isGermanActive = i18n.resolvedLanguage === "de";

  const snapshotMeds = Array.isArray(report.activeMedications)
    ? report.activeMedications
    : [];

  const displayDate = new Date(report.date).toLocaleDateString(
    isGermanActive ? "de-DE" : "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );

  const METRIC_CONFIGS = [
    {
      key: "mood",
      label: t("home.metrics.mood"),
      left: t("home.metrics.mood.low"),
      right: t("home.metrics.mood.high"),
    },
    {
      key: "irritability",
      label: t("home.metrics.irritability"),
      left: t("home.metrics.irritability.low"),
      right: t("home.metrics.irritability.high"),
    },
    {
      key: "energy",
      label: t("home.metrics.energy"),
      left: t("home.metrics.energy.low"),
      right: t("home.metrics.energy.high"),
    },
    {
      key: "sleep",
      label: t("home.metrics.sleep"),
      left: t("home.metrics.sleep.low"),
      right: t("home.metrics.sleep.high"),
    },
    {
      key: "concentration",
      label: t("home.metrics.concentration"),
      left: t("home.metrics.concentration.low"),
      right: t("home.metrics.concentration.high"),
    },
  ];

  const SCALES = [0, 1, 2, 3, 4, 5];
  return (
    <PageCard>
      <PageToolbar
        title={t("details.toolbarTitle")}
        leading={
          <span className="text-sm font-semibold tracking-wide text-white/90">
            {displayDate}
          </span>
        }
      >
        <ToolbarButton onClick={() => navigate("/reports")}>
          {t("details.backToolbarBtn")}
        </ToolbarButton>
      </PageToolbar>

      {/* Prescription Snapshot View */}
      <div className="bg-base-200/40 p-4 rounded-xl border border-base-200 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-base-content/60 block">
          {t("details.snapshotTitle")}
        </span>
        <div className="flex flex-wrap gap-2">
          {snapshotMeds.length === 0 ? (
            <span className="text-xs text-base-content/40 italic">
              {t("details.noMedsRecorded")}
            </span>
          ) : (
            snapshotMeds.map((m: any, idx: number) => (
              <span
                key={m.medicationId || idx}
                className="badge bg-base-content/5 border border-base-content/10 text-base-content/80 text-xs font-semibold px-3 py-2.5 rounded-lg shadow-sm"
              >
                💊 {m.name} ({m.dosage})
              </span>
            ))
          )}
        </div>
      </div>

      {/* Clinical Notes Summary Observation Output Context Card */}
      <div className="space-y-2 mt-4">
        <span className="text-xs font-bold uppercase tracking-widest text-base-content/60 block">
          {t("details.notesTitle")}
        </span>
        <div className="p-4 bg-base-200/40 border border-base-200 rounded-xl text-sm text-base-content/80 min-h-20 font-medium leading-relaxed shadow-inner">
          {report.message || (
            <span className="italic opacity-40 font-normal">
              {t("details.noNotesRecorded")}
            </span>
          )}
        </div>
      </div>

      {/* 5 Clinical Metric Segment Matrix */}
      <div className="space-y-6 mt-4">
        {METRIC_CONFIGS.map((item) => {
          const scoreValue =
            typeof report[item.key] === "number" ? report[item.key] : 0;

          return (
            <div
              key={item.key}
              className="p-6 border border-base-200/60 bg-base-100 rounded-3xl space-y-4 shadow-sm text-left"
            >
              <div className="flex justify-between items-center px-1">
                <span className="font-bold text-xs uppercase tracking-widest text-base-content/70">
                  {item.label}
                </span>
                <span className="text-base-content font-black bg-base-100 border border-base-300 px-3 py-1 rounded-xl text-xs shadow-xs">
                  {t("details.scoreLabel")}: {scoreValue}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between bg-base-200/10 rounded-2xl border border-base-200/40 p-1.5 gap-1 w-full">
                  {SCALES.map((val: number) => {
                    const isSelected = scoreValue === val;
                    let activeStyles =
                      "bg-base-200/30 text-base-content/40 font-medium";

                    if (isSelected) {
                      if (item.key === "irritability") {
                        if (val <= 1)
                          activeStyles =
                            "bg-emerald-600 text-white font-black shadow-md scale-[1.02]";
                        else if (val <= 3)
                          activeStyles =
                            "bg-amber-500 text-white font-black shadow-md scale-[1.02]";
                        else
                          activeStyles =
                            "bg-rose-600 text-white font-black shadow-md scale-[1.02]";
                      } else {
                        if (val <= 1)
                          activeStyles =
                            "bg-rose-600 text-white font-black shadow-md scale-[1.02]";
                        else if (val <= 3)
                          activeStyles =
                            "bg-amber-500 text-white font-black shadow-md scale-[1.02]";
                        else
                          activeStyles =
                            "bg-emerald-600 text-white font-black shadow-md scale-[1.02]";
                      }
                    }

                    return (
                      <div key={val} className="flex-1 text-center">
                        <div
                          className={`py-3.5 px-2 rounded-xl text-sm transition-all duration-200 ${activeStyles}`}
                        >
                          {val}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center px-2 text-[10px] uppercase font-bold tracking-wider text-base-content/40">
                  <span>{item.left}</span>
                  <span>{item.right}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* ACTION TOOLBAR FOOTER CONTROLS */}
      <div className="flex gap-4 items-center justify-end mt-8 border-t border-base-content/10 pt-6">
        <button
          onClick={() => {
            setEditForm({ ...report });
            setIsEditing(true);
          }}
          className="btn btn-outline btn-primary rounded-xl px-6 font-bold flex items-center gap-2"
          disabled={isDeleting}
        >
          {t("details.editReportBtn")}
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn btn-error rounded-xl px-6 font-bold flex items-center gap-2"
          disabled={isDeleting}
        >
          {t("details.deleteBtn")}
        </button>
      </div>

      {/* ACTION EDIT OVERLAY SCREEN MODAL PANEL */}
      {isEditing && editForm && (
        <div className="modal modal-open backdrop-blur-xs">
          <div className="modal-box rounded-3xl bg-base-100 max-w-2xl border border-base-200 shadow-2xl p-6 text-left">
            <h3 className="font-black text-xl mb-6 text-primary flex items-center gap-2">
              {t("details.modalTitle")}
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="form-control w-full space-y-1">
                <label className="label-text font-bold text-xs uppercase tracking-widest text-base-content/70">
                  {t("details.modalNotesLabel")}
                </label>
                <textarea
                  className="textarea textarea-bordered rounded-xl w-full bg-base-100 min-h-[100px] text-sm focus:textarea-primary"
                  placeholder={t("details.modalPlaceholder")}
                  value={editForm.message ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, message: e.target.value })
                  }
                />
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {METRIC_CONFIGS.map((item) => {
                  const currentStagedValue = editForm[item.key] ?? 0;

                  return (
                    <div
                      key={item.key}
                      className="space-y-2 border-b border-base-200 pb-4 last:border-0"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs uppercase tracking-widest text-base-content/70">
                          {item.label}
                        </span>
                        <span className="badge badge-neutral rounded-lg px-2 py-1 text-xs font-bold">
                          {t("details.modalSelectedLabel")}:{" "}
                          {currentStagedValue}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-base-200/30 rounded-2xl p-1 gap-1 w-full">
                        {SCALES.map((val: number) => {
                          const isStaged = currentStagedValue === val;
                          let activeStagedStyle =
                            "bg-base-100 text-base-content/50 hover:bg-base-200/50 cursor-pointer";

                          if (isStaged) {
                            if (item.key === "irritability") {
                              if (val <= 1)
                                activeStagedStyle =
                                  "bg-emerald-600 text-white font-black shadow-md scale-105";
                              else if (val <= 3)
                                activeStagedStyle =
                                  "bg-amber-500 text-white font-black shadow-md scale-105";
                              else
                                activeStagedStyle =
                                  "bg-rose-600 text-white font-black shadow-md scale-105";
                            } else {
                              if (val <= 1)
                                activeStagedStyle =
                                  "bg-rose-600 text-white font-black shadow-md scale-105";
                              else if (val <= 3)
                                activeStagedStyle =
                                  "bg-amber-500 text-white font-black shadow-md scale-105";
                              else
                                activeStagedStyle =
                                  "bg-emerald-600 text-white font-black shadow-md scale-105";
                            }
                          }

                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                setEditForm({ ...editForm, [item.key]: val })
                              }
                              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${activeStagedStyle}`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="modal-action gap-2 border-t border-base-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-ghost rounded-xl px-5 font-bold"
                >
                  {t("details.modalCancelBtn")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-xl px-6 font-bold"
                >
                  {t("details.modalSaveBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DAISYUI MODAL DIALOG CONTAINER FOR DELETIONS */}
      {showDeleteConfirm && (
        <div className="modal modal-open backdrop-blur-xs">
          <div className="modal-box rounded-3xl border border-base-200 shadow-2xl p-6 max-w-sm bg-base-100">
            <div className="text-center space-y-3">
              <div className="text-4xl">⚠️</div>
              <h3 className="font-black text-xl text-error">
                {t("details.deleteConfirmTitle")}
              </h3>
              <p className="text-sm font-medium text-base-content/70 leading-relaxed">
                {t("details.deleteConfirmText")}
              </p>
            </div>
            <div className="modal-action justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-primary rounded-xl px-5 font-bold"
              >
                {t("details.deleteConfirmCancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmExecution}
                className="btn btn-error rounded-xl px-5 font-bold shadow-md"
              >
                {t("details.deleteConfirmSubmit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageCard>
  );
}
