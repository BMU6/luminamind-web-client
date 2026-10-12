import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/useAuth";
import { useReports } from "@/utils/reports";
import { MedicationListType } from "@/types/medicationType";
import { PageCard, PageToolbar } from "@/components";
import { useTranslation } from "react-i18next";
import { VITE_API_URL } from "@/config";
import { getAccessToken } from "@/storage";

export default function ReportList() {
  const { user } = useAuth();
  const userId = user?._id ?? "";
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { reports, loading } = useReports(userId);
  const [, setAvailableMeds] = useState<MedicationListType[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    // ✨ FIXED: Added dynamic configuration URLs and attached strict Authorization keys
    fetch(`${VITE_API_URL}/medicationlist`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
    })
      .then((res) => {
        if (!res.ok)
          throw new Error(
            "Failed to authenticate medication reference mapping context",
          );
        return res.json();
      })
      .then((data) => {
        setAvailableMeds(Array.isArray(data) ? data : []);
        setFetchError(null);
      })
      .catch((err) => {
        console.error("Error pre-loading medications:", err);
        setFetchError(
          t("reports.loadMedsError") ||
            "Could not retrieve current medication listings",
        );
      });
  }, [userId, t]);

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
        {/* Visual Inline Feedback Banner Box */}
        {fetchError && (
          <div
            role="alert"
            className="alert alert-error rounded-xl flex items-start gap-2 bg-error/10 text-error border border-error/20 p-3 text-sm text-left animate-fadeIn"
          >
            <svg
              xmlns="http://w3.org"
              className="stroke-current shrink-0 h-5 w-5 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{fetchError}</span>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary mb-3"></span>
            <p className="text-sm font-medium text-base-content/50">
              {t("reports.loading")}
            </p>
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-base-300 rounded-2xl text-center space-y-3 animate-fadeIn">
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

            const displayDate = new Date(rep.date).toLocaleDateString(
              isGermanActive ? "de-DE" : "en-US",
              {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            );

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
                className="flex items-center justify-between p-5 border border-base-200 rounded-2xl bg-base-100 hover:border-primary/40 hover:shadow-md cursor-pointer transition-all duration-200 select-none animate-fadeIn text-left"
              >
                <div className="space-y-1 text-left grow pr-4">
                  <h4 className="font-bold text-base text-base-content tracking-wide flex items-center flex-wrap gap-1">
                    <span>{displayDate}</span>
                    <span className="text-base-content/40 font-medium text-sm">
                      @ {displayTime}
                    </span>
                  </h4>
                  <p className="text-xs text-base-content/50 line-clamp-1 max-w-md font-medium">
                    {rep.message || t("reports.noNotesMessage")}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <span className="badge bg-primary/5 border-none rounded-lg text-xs font-bold p-2.5 text-base-content/80">
                    {t("reports.metrics.mood")}: {rep.mood ?? 0}
                  </span>
                  <span className="badge bg-primary/5 border-none rounded-lg text-xs font-bold p-2.5 text-base-content/80">
                    {t("reports.metrics.irritability")}: {rep.irritability ?? 0}
                  </span>
                  <span className="text-primary/70 font-bold ml-2 transition-transform duration-200 group-hover:translate-x-1">
                    ➔
                  </span>
                </div>
              </div>
            );
          })}
      </main>
    </PageCard>
  );
}
