import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context";
import { VITE_API_URL } from "@/config";
import { getAccessToken } from "@/storage";
import {
  Chart as ChartJS,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import "chartjs-adapter-date-fns";
import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfDay,
} from "date-fns";
import { Line } from "react-chartjs-2";
import {
  PageCard,
  PageToolbar,
  ToolbarButton,
  ToolbarDivider,
} from "@/components";
import { fetchReports, fetchSummary, type ApiReport } from "@/network";

ChartJS.register(
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

const readChartColors = () => {
  const root = getComputedStyle(document.documentElement);
  const text =
    root.getPropertyValue("--color-base-content").trim() || "#1f2937";
  return {
    text,
    grid: `color-mix(in oklab, ${text} 15%, transparent)`,
  };
};

const useChartColors = () => {
  const [colors, setColors] = useState(readChartColors);
  useEffect(() => {
    const update = () => setColors(readChartColors());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  return colors;
};

type Orientation = "horizontal" | "vertical";
type MetricKey = "mood" | "energy" | "sleep" | "concentration" | "irritability";
type Medication = { id: string; name: string; dosage: string };

type Report = {
  id: string;
  at: number;
  message: string;
  medications: Medication[];
} & {
  [key in MetricKey]: number;
};

const WINDOW_DAYS = 7;
const BLOCK_DAYS = 7;
const WHEEL_STEP = 100;
const TODAY = startOfDay(new Date());

const blockStart = (k: number) => addDays(TODAY, k * BLOCK_DAYS);
const blockOf = (date: Date) =>
  Math.floor(differenceInCalendarDays(date, TODAY) / BLOCK_DAYS);

const fetchBlock = async (k: number): Promise<Report[]> => {
  const apiReports = await fetchReports(blockStart(k), blockStart(k + 1));
  return apiReports.map(
    ({ _id, date, activeMedications, ...rest }: ApiReport) =>
      ({
        ...rest,
        id: _id,
        at: new Date(date).getTime(),
        medications: activeMedications.map((m) => ({
          id: m.medicationId,
          name: m.name,
          dosage: m.dosage,
        })),
      }) as unknown as Report,
  );
};

const REPORT_LANE = -0.5;

export const Home = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.roles?.includes("doctor")) {
      navigate("/doctor/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const [orientation, setOrientation] = useState<Orientation>(() =>
    window.matchMedia("(max-width: 1023px)").matches
      ? "vertical"
      : "horizontal",
  );
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [windowStart, setWindowStart] = useState<Date>(() =>
    addDays(TODAY, -(WINDOW_DAYS - 1)),
  );
  const [blocks, setBlocks] = useState<Record<number, Report[]>>({});
  const [pending, setPending] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requested = useRef(new Set<number>());

  const [summary, setSummary] = useState<{
    range: string;
    text: string;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const chartBoxRef = useRef<HTMLDivElement>(null);
  const wheelDistance = useRef(0);

  const vertical = orientation === "vertical";
  const chartColors = useChartColors();

  const METRICS = useMemo(
    () => [
      {
        key: "mood" as MetricKey,
        label: t("home.metrics.mood"),
        color: "#3b82f6",
      },
      {
        key: "energy" as MetricKey,
        label: t("home.metrics.energy"),
        color: "#f59e0b",
      },
      {
        key: "sleep" as MetricKey,
        label: t("home.metrics.sleep"),
        color: "#8b5cf6",
      },
      {
        key: "concentration" as MetricKey,
        label: t("home.metrics.concentration"),
        color: "#10b981",
      },
      {
        key: "irritability" as MetricKey,
        label: t("home.metrics.irritability"),
        color: "#ef4444",
      },
    ],
    [t],
  );

  const REPORT_DATASET_INDEX = METRICS.length;
  const rangeLabel = `${format(windowStart, "dd.MM.")} – ${format(addDays(windowStart, WINDOW_DAYS - 1), "dd.MM.yyyy")}`;

  const formatDateTime = (tStamp: number) =>
    new Date(tStamp).toLocaleString(
      i18n.resolvedLanguage === "de" ? "de-DE" : "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    );
  const handleSummarize = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const text = await fetchSummary(
        windowStart,
        addDays(windowStart, WINDOW_DAYS),
      );
      setSummary({ range: rangeLabel, text });
    } catch (error) {
      setSummaryError(
        error instanceof Error ? error.message : t("home.summaryError"),
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const shiftWindow = (days: number) =>
    setWindowStart((start) => addDays(start, days));

  useEffect(() => {
    const first = blockOf(addDays(windowStart, -BLOCK_DAYS));
    const last = blockOf(addDays(windowStart, WINDOW_DAYS + BLOCK_DAYS - 1));

    for (let k = first; k <= last; k++) {
      if (requested.current.has(k)) continue;
      requested.current.add(k);
      setPending((n) => n + 1);

      fetchBlock(k)
        .then((data) => {
          setBlocks((prev) => ({ ...prev, [k]: data }));
          setLoadError(null);
        })
        .catch((error: unknown) => {
          requested.current.delete(k);
          setLoadError(
            error instanceof Error ? error.message : t("home.loadError"),
          );
        })
        .finally(() => setPending((n) => n - 1));
    }
  }, [windowStart, t]);

  useEffect(() => {
    const box = chartBoxRef.current;
    if (!box) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      wheelDistance.current += delta;

      const steps = Math.trunc(wheelDistance.current / WHEEL_STEP);
      if (steps === 0) return;
      wheelDistance.current -= steps * WHEEL_STEP;

      const days = vertical ? -steps : steps;
      setWindowStart((start) => addDays(start, days));
    };

    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, [vertical]);

  const reports = useMemo(
    () =>
      Object.values(blocks)
        .flat()
        .sort((a, b) => a.at - b.at),
    [blocks],
  );

  const data = useMemo<ChartData<"line">>(() => {
    const point = (time: number, value: number) =>
      vertical ? { x: value, y: time } : { x: time, y: value };
    return {
      datasets: [
        ...METRICS.map((m) => ({
          label: m.label,
          data: reports.map((r) =>
            point(r.at, r[m.key as keyof typeof r] as number),
          ),
          borderColor: m.color,
          backgroundColor: m.color,
          borderWidth: 2,
          cubicInterpolationMode: "monotone" as const,
          pointStyle: "rect" as const,
          pointRadius: 5,
          pointHitRadius: 10,
        })),
        {
          label: t("home.checkInLaneLabel"),
          data: reports.map((r) => point(r.at, REPORT_LANE)),
          showLine: false,
          borderColor: "#64748b",
          backgroundColor: "#64748b",
          pointStyle: "rect" as const,
          pointRadius: 8,
          pointHoverRadius: 10,
          pointHitRadius: 16,
        },
      ],
    };
  }, [vertical, reports, METRICS, t]);

  const options = useMemo<ChartOptions<"line">>(() => {
    const timeScale = {
      type: "time" as const,
      min: windowStart.getTime(),
      max: addDays(windowStart, WINDOW_DAYS).getTime(),
      ticks: { color: chartColors.text },
      grid: { color: chartColors.grid },
      time: {
        unit: "day" as const,
        tooltipFormat: "dd.MM.yyyy HH:mm",
        displayFormats: { day: "dd.MM." },
      },
    };

    const valueScale = {
      type: "linear" as const,
      min: -1,
      max: 5,
      grid: { color: chartColors.grid },
      ticks: {
        color: chartColors.text,
        stepSize: 1,
        callback: (v: string | number) => (Number(v) >= 0 ? v : ""),
      },
    };

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: vertical ? ("y" as const) : ("x" as const),
      interaction: { mode: "nearest" as const, intersect: true },
      scales: vertical
        ? { x: valueScale, y: timeScale }
        : { x: timeScale, y: valueScale },
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: { usePointStyle: true, color: chartColors.text },
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              if (ctx.datasetIndex === REPORT_DATASET_INDEX)
                return t("home.tooltipCheckIn");
              const raw = ctx.raw as { x: number; y: number };
              return `${ctx.dataset.label}: ${vertical ? raw.x : raw.y}`;
            },
          },
        },
      },
      onClick: (_event: any, elements: any) => {
        const hit = elements[0];
        if (!hit) return;
        const clickedReport = reports[hit.index];
        if (clickedReport) setSelectedReport(clickedReport);
      },
    };
  }, [vertical, windowStart, reports, chartColors, t, REPORT_DATASET_INDEX]);

  return (
    <PageCard size="lg">
      <PageToolbar
        title={t("home.title")}
        leading={
          <>
            <span className="text-sm font-semibold tracking-wide text-white/90">
              {rangeLabel}
            </span>
            {pending > 0 && (
              <span
                className="loading loading-spinner loading-xs text-secondary"
                aria-label="Loading"
              />
            )}
          </>
        }
      >
        <ToolbarButton onClick={() => shiftWindow(-WINDOW_DAYS)}>
          {vertical ? "↓" : "←"} {t("home.earlier")}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setWindowStart(addDays(TODAY, -(WINDOW_DAYS - 1)))}
        >
          {t("home.today")}
        </ToolbarButton>
        <ToolbarButton onClick={() => shiftWindow(WINDOW_DAYS)}>
          {t("home.later")} {vertical ? "↑" : "→"}
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          active={!vertical}
          onClick={() => setOrientation("horizontal")}
        >
          {t("home.horizontal")}
        </ToolbarButton>
        <ToolbarButton
          active={vertical}
          onClick={() => setOrientation("vertical")}
        >
          {t("home.vertical")}
        </ToolbarButton>
      </PageToolbar>

      {/* ✨ UPDATED: Crash-Proof Elegant Inline Alert Banner */}
      {loadError && (
        <div className="alert alert-error rounded-xl flex items-start gap-2 bg-error/10 text-error border border-error/20 p-3 text-sm mb-4 animate-fadeIn">
          <svg
            xmlns="http://w3.org"
            className="stroke-current shrink-0 h-5 w-5"
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
          <span>{loadError}</span>
        </div>
      )}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section className="lg:col-span-3 border border-base-200 rounded-2xl p-5 space-y-4">
          <div
            ref={chartBoxRef}
            className={`relative w-full ${vertical ? "h-[70vh]" : "h-80"}`}
          >
            <Line key={orientation} data={data} options={options} />
          </div>

          <div className="border-t border-base-200 pt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-xl font-bold tracking-wider px-4 text-white"
                onClick={handleSummarize}
                disabled={summaryLoading}
              >
                {summaryLoading
                  ? t("home.summarizing")
                  : t("home.summarizeBtn")}
              </button>
              {summaryLoading && (
                <span
                  className="loading loading-spinner loading-sm text-primary"
                  aria-label="Loading"
                />
              )}
              <span className="text-xs font-medium text-base-content/50">
                {t("home.aiSummaryHeading")} {rangeLabel}
              </span>
            </div>

            {summaryError && (
              <div
                role="alert"
                className="alert alert-error rounded-xl flex items-start gap-2 bg-error/10 text-error border border-error/20 p-3 text-sm animate-fadeIn text-left"
              >
                <span>{summaryError}</span>
              </div>
            )}

            {summary && (
              <div className="bg-base-200/60 border border-base-200 rounded-2xl p-4 animate-fadeIn">
                <h3 className="font-bold text-sm text-base-content mb-2">
                  {t("home.summaryTitle")} {summary.range}
                </h3>
                <p className="whitespace-pre-line text-sm text-base-content/80 leading-relaxed text-left">
                  {summary.text}
                </p>
                <p className="text-xs text-base-content/40 mt-3 text-left">
                  {t("home.aiNotice")}
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="lg:col-span-1 border border-base-200 rounded-2xl p-5 space-y-3 text-left">
          <PatientLinkHandshakeWidget />
          <h2 className="text-xs font-bold tracking-widest uppercase text-secondary mt-2">
            {t("home.checkInHeading")}
          </h2>
          {selectedReport ? (
            <div className="animate-fadeIn space-y-3">
              <div>
                <p className="text-xs font-medium text-base-content/50">
                  {formatDateTime(selectedReport.at)}
                </p>
                <p className="text-sm text-base-content/80 font-medium mt-1">
                  {selectedReport.message}
                </p>
              </div>

              <ul className="text-sm space-y-1">
                {METRICS.map((m) => (
                  <li
                    key={m.key}
                    className="flex justify-between items-center py-0.5"
                  >
                    <span className="text-base-content/70">{m.label}</span>
                    <span className="badge bg-primary/10 border-none rounded-lg text-xs font-bold px-2 py-1 text-primary">
                      {
                        selectedReport[
                          m.key as keyof typeof selectedReport
                        ] as number
                      }
                    </span>
                  </li>
                ))}
              </ul>

              <h3 className="font-bold text-sm text-base-content mt-4 border-t border-base-100 pt-2">
                {t("home.medicationsTitle")}
              </h3>
              {!selectedReport.medications ||
              (selectedReport.medications as any).length === 0 ? (
                <p className="text-sm text-base-content/50 italic">
                  {t("home.medsNone")}
                </p>
              ) : (
                <ul className="text-sm text-base-content/80 space-y-1 list-disc list-inside">
                  {(selectedReport.medications as any).map((m: any) => (
                    <li key={m.id} className="truncate">
                      {m.name} – <span className="opacity-60">{m.dosage}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                className="btn btn-xs btn-ghost rounded-lg mt-2 w-full border border-base-content/10"
                onClick={() => setSelectedReport(null)}
              >
                {t("home.closeBtn")}
              </button>
            </div>
          ) : (
            <p className="text-sm text-base-content/50 italic leading-relaxed">
              {t("home.emptyAside")}
            </p>
          )}
        </aside>
      </main>
    </PageCard>
  );
};

export function PatientLinkHandshakeWidget() {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✨ Internal local widget states for explicit contextual layout feedback
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessStatus(null);

    if (!code.trim() || code.length !== 6) {
      return setErrorStatus(t("home.handshake.warning"));
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${VITE_API_URL}/doctor/patient/redeem-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || t("home.handshake.errorFallback"));

      setSuccessStatus(data.message || t("home.handshake.successFallback"));
      setCode("");
    } catch (err: any) {
      setErrorStatus(err.message || t("home.handshake.errorFallback"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleLinkSubmit}
      className="card bg-base-100 p-4 border border-base-200 rounded-2xl shadow-xs max-w-md space-y-3 font-sans text-neutral"
    >
      <div>
        <h3 className="font-bold text-xs uppercase tracking-wide opacity-70">
          {t("home.handshake.title")}
        </h3>
        <p className="text-[11px] opacity-50 leading-relaxed font-medium mt-0.5">
          {t("home.handshake.subtitle")}
        </p>
      </div>

      {/* ✨ Local Widget Contextual Inline Feedback Banners */}
      {errorStatus && (
        <div className="alert alert-error text-left rounded-xl p-2.5 text-xs bg-error/10 text-error border border-error/10 animate-fadeIn">
          <span>{errorStatus}</span>
        </div>
      )}

      {successStatus && (
        <div className="alert alert-success text-left rounded-xl p-2.5 text-xs bg-success/10 text-success border border-success/10 animate-fadeIn">
          <span>{successStatus}</span>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t("home.handshake.placeholder")}
          value={code}
          onChange={(e) => {
            if (errorStatus) setErrorStatus(null);
            if (successStatus) setSuccessStatus(null);
            setCode(e.target.value.toUpperCase());
          }}
          className={`input input-bordered rounded-xl text-xs font-mono tracking-widest grow bg-base-100 focus:outline-primary ${errorStatus ? "border-error focus:outline-error" : ""}`}
          maxLength={6}
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-sm rounded-xl font-bold h-full px-4 text-xs min-w-[90px]"
        >
          {submitting
            ? t("home.handshake.connecting")
            : t("home.handshake.connectBtn")}
        </button>
      </div>
    </form>
  );
}

export default Home;
