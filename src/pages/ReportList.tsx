import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/useAuth";
import { useReports } from "@/utils/reports";
import { MedicationListType } from "@/types/medicationType";
import { PageCard, PageToolbar } from "@/components";
import { useTranslation } from "react-i18next"; // Core Translation framework hook

export default function ReportList() {
  const { user } = useAuth();
  const userId = user?._id ?? "";
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // Pulls translation controls

  const { reports, loading } = useReports(userId);
  const [, setAvailableMeds] = useState<MedicationListType[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:3000/medicationlist`)
      .then((res) => res.json())
      .then((data) => setAvailableMeds(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error pre-loading medications:", err));
  }, [userId]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col justify-center items-center p-4">
        <span className="loading loading-spinner loading-md text-primary"></span>
        <p className="ml-3 text-sm font-medium text-base-content/50">
          {t("reports.verifyingSession")}
        </p>
      </div>
    );
  }

  return (
    <PageCard>
      <PageToolbar title={t("reports.toolbarTitle")}>
        <button
          className="btn btn-sm btn-primary rounded-xl font-bold tracking-wider px-4 text-white"
          onClick={() => navigate("/reports/new")}
        >
          {t("reports.newReportBtn")}
        </button>
      </PageToolbar>

      <main className="space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary mb-3"></span>
            <p className="text-sm font-medium text-base-content/50">
              {t("reports.loading")}
            </p>
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-base-300 rounded-2xl text-center space-y-3">
            <div className="text-4xl opacity-40">📋</div>
            <h3 className="font-bold text-base-content">
              {t("reports.emptyStateTitle")}
            </h3>
            <p className="text-xs text-base-content/50 max-w-xs font-medium">
              {t("reports.emptyStateSubtitle")}
            </p>
          </div>
        )}

        {!loading &&
          reports.map((rep) => {
            const isGermanActive = i18n.resolvedLanguage === "de";

            // 1. Dynamic localized browser date parser formatting rules
            const displayDate = new Date(rep.date).toLocaleDateString(
              isGermanActive ? "de-DE" : "en-US",
              {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            );

            // 2. Dynamic localized browser time format rules (24-hour style for DE / AM-PM for EN)
            const displayTime = new Date(rep.date).toLocaleTimeString(
              isGermanActive ? "de-DE" : "en-US",
              {
                hour: "numeric",
                minute: "2-digit",
                hour12: !isGermanActive,
              },
            );

            return (
              <div
                key={rep.id}
                onClick={() => navigate(`/reports/${rep.id}`)}
                className="flex items-center justify-between p-5 border border-base-200 rounded-2xl bg-base-100 hover:border-primary/40 hover:shadow-md cursor-pointer transition-all duration-200 select-none"
              >
                <div className="space-y-1 text-left">
                  <h4 className="font-bold text-base text-base-content tracking-wide">
                    {displayDate}{" "}
                    <span className="text-base-content/40 font-medium text-sm ml-1">
                      @ {displayTime}
                    </span>
                  </h4>
                  <p className="text-xs text-base-content/50 line-clamp-1 max-w-md font-medium">
                    {rep.message || t("reports.noNotesMessage")}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="badge bg-primary/5 border-none rounded text-xs font-bold p-2.5 text-base-content/80">
                    {t("reports.metrics.mood")}: {rep.mood ?? 0}
                  </span>
                  <span className="badge bg-primary/5 border-none rounded text-xs font-bold p-2.5 text-base-content/80">
                    {t("reports.metrics.irritability")}: {rep.irritability ?? 0}
                  </span>
                  <span className="text-base-content/30 font-bold ml-2">➔</span>
                </div>
              </div>
            );
          })}
      </main>
    </PageCard>
  );
}
