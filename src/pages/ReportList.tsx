import { useState, useEffect } from "react";
import { useNavigate } from "react-router"; // Assumes standard React Router integration
import { useAuth } from "@/context/useAuth";
import { useReports } from "@/utils/reports";

export default function ReportList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId =
    user && "sub" in user
      ? (user.sub as string)
      : (user as any)?.id || (user as any)?._id || "";

  const { reports, loading, addReport } = useReports(userId);
  const [availableMeds, setAvailableMeds] = useState<any[]>([]);

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
    <div className="min-h-screen bg-base-200 flex justify-center items-start p-4 sm:p-10 font-sans antialiased text-neutral">
      <div className="w-full max-w-3xl bg-base-100 border border-base-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
        <header className="navbar bg-neutral/95 backdrop-blur-md text-white rounded-2xl px-5 py-3 shadow-lg flex justify-between items-center border border-white/10">
          <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-secondary">
            Daily Progress Reports
          </span>
          <button
            className="btn btn-sm btn-primary rounded-xl font-bold tracking-wider px-4 text-white"
            onClick={() => navigate("/reports/new")} // Translates smoothly to your fallback initialization form router if desired
          >
            + New Report
          </button>
        </header>

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
              const displayDate = new Date(rep.date).toLocaleDateString(
                undefined,
                {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                },
              );

              return (
                <div
                  key={rep.id}
                  onClick={() => navigate(`/reports/${rep.id}`)} // Routes to details view dynamically on-click
                  className="flex items-center justify-between p-5 border border-base-200 rounded-2xl bg-base-100 hover:border-primary/40 hover:shadow-md cursor-pointer transition-all duration-200 select-none"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-neutral tracking-wide">
                      {displayDate} Summary
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
      </div>
    </div>
  );
}
