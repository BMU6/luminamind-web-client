import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { PageCard, PageToolbar, ToolbarButton } from "@/components";
import { VITE_API_URL } from "@/config";
import { getAccessToken } from "@/storage";

export default function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<any>(null);

  // Dynamic feedback indicators replacing react-toastify hooks
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setActionError(null);

    // ✨ FIXED: Swapped hardcoded URLs with secure global configuration and Bearer keys
    fetch(`${VITE_API_URL}/reports/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t("details.locateError"));
        return res.json();
      })
      .then((data) => {
        setReport(data);
        setEditForm(data);
      })
      .catch((err) => {
        console.error("Details database retrieval exception:", err);
        setActionError(err.message || "Failed to load medical report record.");
      })
      .finally(() => setLoading(false));
  }, [id, t]);
  const handleDeleteConfirmExecution = async () => {
    if (!id) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      setShowDeleteConfirm(false);
      setIsDeleting(true);

      // ✨ FIXED: Protected route execution parameters
      const res = await fetch(`${VITE_API_URL}/reports/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed dropping record.");
      }

      setActionSuccess(t("details.deleteSuccess"));
      setTimeout(() => navigate("/reports"), 1000);
    } catch (err: unknown) {
      const message = (err as Error).message;
      setActionError(message || t("details.deleteErrorFallback"));
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      setLoading(true);
      // ✨ FIXED: Integrated token structures for updates
      const res = await fetch(`${VITE_API_URL}/reports/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
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
      setActionSuccess(t("details.updateSuccess"));
      setIsEditing(false);
    } catch (err: unknown) {
      const message = (err as Error).message;
      setActionError(message || t("details.updateErrorFallback"));
    } finally {
      setLoading(false);
    }
  };
  if (loading && !isEditing) {
    return (
      <div className="flex w-full items-center justify-center py-24">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col justify-center items-center py-16 space-y-4 text-center">
        <div className="text-3xl select-none">⚠️</div>
        <p className="text-sm font-semibold text-base-content/50 tracking-wide">
          {actionError || t("details.notFoundTitle")}
        </p>
        <button
          onClick={() => navigate("/reports")}
          className="btn btn-sm btn-neutral text-white rounded-xl px-5 font-bold"
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

      {/* Inline Feedback Alerts */}
      {actionError && (
        <div
          role="alert"
          className="alert alert-error rounded-xl flex items-start gap-2 bg-error/10 text-error border border-error/20 p-3 text-sm text-left mb-4 animate-fadeIn"
        >
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div
          role="alert"
          className="alert alert-success rounded-xl flex items-start gap-2 bg-success/10 text-success border border-success/20 p-3 text-sm text-left mb-4 animate-fadeIn"
        >
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="space-y-4 text-left">
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

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-base-content/60 block">
            {t("details.notesTitle")}
          </span>
          <div className="p-4 bg-base-200/40 border border-base-200 rounded-xl text-sm text-base-content/80 min-h-20 font-medium leading-relaxed shadow-inner">
            {report.message || (
              <span className="italic opacity-40 font-normal">
                {t("details.noMedsRecorded")}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6 mt-4">
          {METRIC_CONFIGS.map((item) => {
            const scoreValue =
              typeof report[item.key] === "number" ? report[item.key] : 0;
            return (
              <div
                key={item.key}
                className="p-5 border border-base-200 bg-base-100 rounded-2xl space-y-4 shadow-xs"
              >
                <div className="flex justify-between items-center px-1">
                  <span className="font-bold text-xs uppercase tracking-widest text-base-content/70">
                    {item.label}
                  </span>
                  <span className="text-base-content font-black bg-base-100 border border-base-200 px-3 py-1 rounded-xl text-xs">
                    {t("details.scoreLabel")}: {scoreValue}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-base-200/10 rounded-2xl border border-base-200/40 p-1.5 gap-1 w-full">
                    {SCALES.map((val: number) => {
                      const isSelected = scoreValue === val;
                      let activeStyles =
                        "bg-base-200/20 text-base-content/30 font-medium";
                      if (isSelected) {
                        if (item.key === "irritability") {
                          activeStyles =
                            val <= 1
                              ? "bg-emerald-600 text-white font-black shadow-xs"
                              : val <= 3
                                ? "bg-amber-500 text-white font-black shadow-xs"
                                : "bg-rose-600 text-white font-black shadow-xs";
                        } else {
                          activeStyles =
                            val <= 1
                              ? "bg-rose-600 text-white font-black shadow-xs"
                              : val <= 3
                                ? "bg-amber-500 text-white font-black shadow-xs"
                                : "bg-emerald-600 text-white font-black shadow-xs";
                        }
                      }
                      return (
                        <div key={val} className="flex-1 text-center">
                          <div
                            className={`py-3 px-1 rounded-xl text-xs transition-all duration-150 ${activeStyles}`}
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

        <div className="flex gap-4 items-center justify-end mt-8 border-t border-base-200 pt-6">
          <button
            onClick={() => {
              setEditForm({ ...report });
              setIsEditing(true);
            }}
            className="btn btn-outline btn-primary rounded-xl px-6 font-bold"
            disabled={isDeleting}
          >
            {t("details.editReportBtn")}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-error rounded-xl px-6 font-bold"
            disabled={isDeleting}
          >
            {t("details.deleteBtn")}
          </button>
        </div>
      </div>
      {/* Edit Form Modal Overlay */}
      {isEditing && editForm && (
        <div className="modal modal-open backdrop-blur-xs">
          <div className="modal-box rounded-2xl bg-base-100 max-w-2xl border border-base-200 shadow-2xl p-6 text-left">
            <h3 className="font-black text-xl mb-4 text-primary">
              {t("details.modalTitle")}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="form-control w-full space-y-1">
                <label className="label-text font-bold text-xs uppercase tracking-widest text-base-content/70">
                  {t("details.modalNotesLabel")}
                </label>
                <textarea
                  className="textarea textarea-bordered rounded-xl w-full bg-base-100 min-h-[80px] text-sm focus:textarea-primary"
                  value={editForm.message ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, message: e.target.value })
                  }
                />
              </div>

              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                {METRIC_CONFIGS.map((item) => {
                  const currentStagedValue = editForm[item.key] ?? 0;
                  return (
                    <div
                      key={item.key}
                      className="space-y-2 border-b border-base-200 pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs uppercase tracking-widest text-base-content/70">
                          {item.label}
                        </span>
                        <span className="badge badge-neutral rounded-lg px-2 py-0.5 text-xs font-bold">
                          {t("details.modalSelectedLabel")}:{" "}
                          {currentStagedValue}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-base-200/30 rounded-2xl p-1 gap-1 w-full">
                        {SCALES.map((val: number) => {
                          const isStaged = currentStagedValue === val;
                          let activeStagedStyle =
                            "bg-base-100 text-base-content/40 hover:bg-base-200/50 cursor-pointer";
                          if (isStaged) {
                            if (item.key === "irritability") {
                              activeStagedStyle =
                                val <= 1
                                  ? "bg-emerald-600 text-white font-black shadow-xs"
                                  : val <= 3
                                    ? "bg-amber-500 text-white font-black shadow-xs"
                                    : "bg-rose-600 text-white font-black shadow-xs";
                            } else {
                              activeStagedStyle =
                                val <= 1
                                  ? "bg-rose-600 text-white font-black shadow-xs"
                                  : val <= 3
                                    ? "bg-amber-500 text-white font-black shadow-xs"
                                    : "bg-emerald-600 text-white font-black shadow-xs";
                            }
                          }
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                setEditForm({ ...editForm, [item.key]: val })
                              }
                              className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all duration-150 ${activeStagedStyle}`}
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

      {/* Delete Confirmation Modal Overlay */}
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
