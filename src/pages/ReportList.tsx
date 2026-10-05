import { useState, useEffect } from "react";
import { useNavigate } from "react-router"; // Assumes standard React Router integration
import { useAuth } from "@/context/useAuth";
import { useReports } from "@/utils/reports";
import { MedicationListType } from "@/types/medicationType";
import { PageCard, PageToolbar } from "@/components";

export default function ReportList() {
  const { user } = useAuth();
  const userId = user?._id ?? "";
  // const { user } = useAuth();
  const navigate = useNavigate();
  // const userId =
  //   user && "sub" in user
  //     ? (user.sub as string)
  //     : (user as any)?.id || (user as any)?._id || "";

  const { reports, loading } = useReports(userId);
  const [, setAvailableMeds] = useState<MedicationListType[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:3000/medicationlist?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setAvailableMeds(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error pre-loading medications:", err));
  }, [userId]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col justify-center items-center p-4">
        <span className="loading loading-spinner loading-md text-primary"></span>
        <p className="ml-3 text-sm font-medium text-neutral/50">
          Verifying session...
        </p>
      </div>
    );
  }

  return (
    <PageCard>
      <PageToolbar title="Daily Progress Reports">
        <button
          className="btn btn-sm btn-primary rounded-xl font-bold tracking-wider px-4 text-white"
          onClick={() => navigate("/reports/new")}
        >
          + New Report
        </button>
      </PageToolbar>

      <main className="space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary mb-3"></span>
            <p className="text-sm font-medium text-neutral/50">
              Loading historical trend entries...
            </p>
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-base-300 rounded-2xl text-center space-y-3">
            <div className="text-4xl opacity-40">📋</div>
            <h3 className="font-bold text-neutral">
              No Progress Reports Found
            </h3>
            <p className="text-xs text-neutral/50 max-w-xs font-medium">
              Click the button above to log today's initial clinical tracking
              metrics.
            </p>
          </div>
        )}

        {!loading &&
          reports.map((rep) => {
            // 1. Format the standard date string block
            const displayDate = new Date(rep.date).toLocaleDateString(
              undefined,
              {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            );

            // 2. Format the custom historical AM/PM time string block
            const displayTime = new Date(rep.date).toLocaleTimeString(
              undefined,
              {
                hour: "numeric",
                minute: "2-digit",
                hour12: true, // Forces clean AM/PM output format matching your form header
              },
            );

            return (
              <div
                key={rep.id}
                onClick={() => navigate(`/reports/${rep.id}`)}
                className="flex items-center justify-between p-5 border border-base-200 rounded-2xl bg-base-100 hover:border-primary/40 hover:shadow-md cursor-pointer transition-all duration-200 select-none"
              >
                <div className="space-y-1">
                  {/* Updated Header Title combining Date @ Time */}
                  <h4 className="font-bold text-base text-neutral tracking-wide">
                    {displayDate}{" "}
                    <span className="text-neutral/40 font-medium text-sm ml-1">
                      @ {displayTime}
                    </span>
                  </h4>
                  <p className="text-xs text-neutral/50 line-clamp-1 max-w-md font-medium">
                    {rep.message ||
                      "No logging notes submitted on this day entry."}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="badge bg-primary/5 border-none rounded text-xs font-bold p-2.5 text-neutral/80">
                    Mood: {rep.mood ?? 0}
                  </span>
                  <span className="badge bg-primary/5 border-none rounded text-xs font-bold p-2.5 text-neutral/80">
                    Irritability: {rep.irritability ?? 0}
                  </span>
                  <span className="text-neutral/30 font-bold ml-2">➔</span>
                </div>
              </div>
            );
          })}
      </main>
    </PageCard>
  );
}
