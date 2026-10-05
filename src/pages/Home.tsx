import { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { Line } from 'react-chartjs-2';
import { fetchReports, fetchSummary, type ApiReport } from '@/network';

ChartJS.register(LinearScale, TimeScale, PointElement, LineElement, Tooltip, Legend);

type Orientation = 'horizontal' | 'vertical';

// The keys are the field names of the reports collection. Renaming a metric later only changes its label.
const METRICS = [
  { key: 'mood', label: 'Mood', color: '#3b82f6' },
  { key: 'energy', label: 'Energy', color: '#f59e0b' },
  { key: 'sleep', label: 'Sleep', color: '#8b5cf6' },
  { key: 'concentration', label: 'Concentration', color: '#10b981' },
  { key: 'irritability', label: 'Irritability', color: '#ef4444' },
] as const;

type MetricKey = (typeof METRICS)[number]['key'];

// The same report as the client uses it (timestamp as number, id instead of _id)
type Medication = { id: string; name: string; dosage: string };
type Report = {
  id: string;
  at: number;
  message: string;
  medications: Medication[];
} & Record<MetricKey, number>;

const toReport = ({ _id, date, activeMedications, ...rest }: ApiReport): Report => ({
  ...rest,
  id: _id,
  at: new Date(date).getTime(),
  medications: activeMedications.map((m) => ({ id: m.medicationId, name: m.name, dosage: m.dosage })),
});

// ---------------------------------------------------------------------------
// Time window settings
// ---------------------------------------------------------------------------

const WINDOW_DAYS = 7; // days visible in the chart at once
const BLOCK_DAYS = 7; // days loaded per request
const WHEEL_STEP = 100; // mouse wheel distance that moves the window by one day

const TODAY = startOfDay(new Date());

// Block k covers the days [TODAY + k*7, TODAY + k*7 + 7). k is negative for the past.
const blockStart = (k: number) => addDays(TODAY, k * BLOCK_DAYS);
const blockOf = (date: Date) => Math.floor(differenceInCalendarDays(date, TODAY) / BLOCK_DAYS);

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

const fetchBlock = async (k: number): Promise<Report[]> => {
  const apiReports = await fetchReports(blockStart(k), blockStart(k + 1));
  return apiReports.map(toReport);
};

// ---------------------------------------------------------------------------
// Chart helpers
// ---------------------------------------------------------------------------

// The markers for the check-ins themselves sit in a "lane" just below the 0 line of the rating scale
const REPORT_LANE = -0.5;
const REPORT_DATASET_INDEX = METRICS.length;

// Inline style so square corners win over DaisyUI's theme radius, whatever the Tailwind version
const SHARP = { borderRadius: 0 } as const;

const formatDateTime = (t: number) =>
  new Date(t).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Home = () => {
  const [orientation, setOrientation] = useState<Orientation>(() =>
    window.matchMedia('(max-width: 1023px)').matches ? 'vertical' : 'horizontal',
  );
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // First day of the visible window. Moving it is what "scrolling" means here.
  const [windowStart, setWindowStart] = useState<Date>(() => addDays(TODAY, -(WINDOW_DAYS - 1)));

  // Every block loaded so far, by block number. It only grows, so scrolling back never reloads.
  const [blocks, setBlocks] = useState<Record<number, Report[]>>({});
  const [pending, setPending] = useState(0); // number of requests in flight
  const [loadError, setLoadError] = useState<string | null>(null);
  const requested = useRef(new Set<number>()); // blocks already requested (or loaded)

  // AI summary of the visible week
  const [summary, setSummary] = useState<{ range: string; text: string } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const chartBoxRef = useRef<HTMLDivElement>(null);
  const wheelDistance = useRef(0);

  const vertical = orientation === 'vertical';

  const rangeLabel = `${format(windowStart, 'dd.MM.')} – ${format(addDays(windowStart, WINDOW_DAYS - 1), 'dd.MM.yyyy')}`;

  const handleSummarize = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      // the same days that are visible in the chart
      const text = await fetchSummary(windowStart, addDays(windowStart, WINDOW_DAYS));
      setSummary({ range: rangeLabel, text });
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : 'Could not create the summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const shiftWindow = (days: number) => setWindowStart((start) => addDays(start, days));

  // Load the blocks around the visible window: one week before and one week after it
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
          requested.current.delete(k); // allow a retry on the next move
          setLoadError(error instanceof Error ? error.message : 'Could not load the reports.');
        })
        .finally(() => setPending((n) => n - 1));
    }
  }, [windowStart]);

  // Mouse wheel over the chart moves the window. React's onWheel is a passive listener and
  // cannot call preventDefault(), so we attach a native, non-passive listener instead.
  useEffect(() => {
    const box = chartBoxRef.current;
    if (!box) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault(); // keep the page itself from scrolling

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      wheelDistance.current += delta;

      const steps = Math.trunc(wheelDistance.current / WHEEL_STEP);
      if (steps === 0) return;
      wheelDistance.current -= steps * WHEEL_STEP;

      // Vertical: newest is on top, so scrolling down goes back in time. Horizontal: right = later.
      const days = vertical ? -steps : steps;
      setWindowStart((start) => addDays(start, days));
    };

    box.addEventListener('wheel', onWheel, { passive: false });
    return () => box.removeEventListener('wheel', onWheel);
  }, [vertical]);

  // All loaded reports as one flat list, sorted by time
  const reports = useMemo(() => Object.values(blocks).flat().sort((a, b) => a.at - b.at), [blocks]);

  const data = useMemo<ChartData<'line'>>(() => {
    // The single place that knows about orientation: time goes on one axis, the rating on the other.
    const point = (time: number, value: number) =>
      vertical ? { x: value, y: time } : { x: time, y: value };

    return {
      // Every dataset has one point per report, in the same order. So point number i of ANY
      // dataset belongs to reports[i], which is how a click finds its report.
      datasets: [
        ...METRICS.map((m) => ({
          label: m.label,
          data: reports.map((r) => point(r.at, r[m.key])),
          borderColor: m.color,
          backgroundColor: m.color,
          borderWidth: 2,
          // smooth curves that never overshoot: a line between two 1s stays at 1 and can't dip below it
          cubicInterpolationMode: 'monotone' as const,
          pointStyle: 'rect' as const,
          pointRadius: 5,
          pointHitRadius: 10,
        })),
        {
          label: 'Check-ins (click to read)',
          data: reports.map((r) => point(r.at, REPORT_LANE)),
          showLine: false,
          borderColor: '#64748b',
          backgroundColor: '#64748b',
          pointStyle: 'rect',
          pointRadius: 8,
          pointHoverRadius: 10,
          pointHitRadius: 16,
        },
      ],
    };
  }, [vertical, reports]);

  const options = useMemo<ChartOptions<'line'>>(() => {
    const timeScale = {
      type: 'time' as const,
      // The visible window. Days without data simply stay empty.
      min: windowStart.getTime(),
      max: addDays(windowStart, WINDOW_DAYS).getTime(),
      time: {
        unit: 'day' as const,
        tooltipFormat: 'dd.MM.yyyy HH:mm',
        displayFormats: { day: 'dd.MM.' },
      },
    };

    const valueScale = {
      type: 'linear' as const,
      min: -1,
      max: 5,
      ticks: {
        stepSize: 1,
        // hide the labels of the check-in lane (negative values)
        callback: (v: string | number) => (Number(v) >= 0 ? v : ''),
      },
    };

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // no animation, so moving the window feels immediate
      indexAxis: vertical ? 'y' : 'x',
      interaction: { mode: 'nearest', intersect: true },
      scales: vertical ? { x: valueScale, y: timeScale } : { x: timeScale, y: valueScale },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.datasetIndex === REPORT_DATASET_INDEX) return 'Check-in – click to read';
              const raw = ctx.raw as { x: number; y: number };
              return `${ctx.dataset.label}: ${vertical ? raw.x : raw.y}`;
            },
          },
        },
      },
      onClick: (_event, elements) => {
        // Any point opens the report it belongs to
        const hit = elements[0];
        if (!hit) return;
        const report = reports[hit.index];
        if (report) setSelectedReport(report);
      },
    };
  }, [vertical, windowStart, reports]);

  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
      <h1 className='text-2xl font-bold lg:col-span-4'>Welcome to LuminaMind</h1>

      <section className='card bg-base-100 shadow lg:col-span-3' style={SHARP}>
        <div className='card-body'>
          {loadError && (
            <div role='alert' className='alert alert-error' style={SHARP}>
              {loadError}
            </div>
          )}

          <div className='flex flex-wrap items-center justify-between gap-2'>
            <h2 className='card-title'>
              {rangeLabel}
              {pending > 0 && <span className='loading loading-spinner loading-xs' aria-label='Loading' />}
            </h2>

            <div className='flex flex-wrap items-center gap-2'>
              <div className='join'>
                <button type='button' className='btn btn-sm join-item' style={SHARP} onClick={() => shiftWindow(-WINDOW_DAYS)}>
                  {vertical ? '↓' : '←'} Earlier
                </button>
                <button
                  type='button'
                  className='btn btn-sm join-item'
                  style={SHARP}
                  onClick={() => setWindowStart(addDays(TODAY, -(WINDOW_DAYS - 1)))}
                >
                  Today
                </button>
                <button type='button' className='btn btn-sm join-item' style={SHARP} onClick={() => shiftWindow(WINDOW_DAYS)}>
                  Later {vertical ? '↑' : '→'}
                </button>
              </div>

              <div className='join'>
                <button
                  type='button'
                  className={`btn btn-sm join-item ${!vertical ? 'btn-active' : ''}`}
                  style={SHARP}
                  onClick={() => setOrientation('horizontal')}
                >
                  Horizontal
                </button>
                <button
                  type='button'
                  className={`btn btn-sm join-item ${vertical ? 'btn-active' : ''}`}
                  style={SHARP}
                  onClick={() => setOrientation('vertical')}
                >
                  Vertical
                </button>
              </div>
            </div>
          </div>

          {/* Chart.js needs a sized, relatively positioned parent when maintainAspectRatio is false */}
          <div ref={chartBoxRef} className={`relative w-full ${vertical ? 'h-[70vh]' : 'h-80'}`}>
            <Line key={orientation} data={data} options={options} />
          </div>

          <div className='divider my-1' />

          <div className='flex flex-wrap items-center gap-3'>
            <button
              type='button'
              className='btn btn-sm btn-primary'
              style={SHARP}
              onClick={handleSummarize}
              disabled={summaryLoading}
            >
              {summaryLoading ? 'Summarizing…' : 'Summarize this week'}
            </button>
            {summaryLoading && <span className='loading loading-spinner loading-sm' aria-label='Loading' />}
            <span className='text-sm opacity-70'>AI summary of {rangeLabel}</span>
          </div>

          {summaryError && (
            <div role='alert' className='alert alert-error' style={SHARP}>
              {summaryError}
            </div>
          )}

          {summary && (
            <div className='bg-base-200 p-4' style={SHARP}>
              <h3 className='font-bold text-sm mb-2'>Summary {summary.range}</h3>
              <p className='whitespace-pre-line text-sm'>{summary.text}</p>
              <p className='text-xs opacity-60 mt-3'>Generated by AI from your check-ins. Not a medical assessment.</p>
            </div>
          )}
        </div>
      </section>

      <aside className='card bg-base-100 shadow lg:col-span-1' style={SHARP}>
        <div className='card-body'>
          <h2 className='card-title'>Check-in</h2>
          {selectedReport ? (
            <>
              <p className='text-sm opacity-70'>{formatDateTime(selectedReport.at)}</p>
              <p>{selectedReport.message}</p>

              <ul className='text-sm'>
                {METRICS.map((m) => (
                  <li key={m.key} className='flex justify-between'>
                    <span>{m.label}</span>
                    <span className='font-bold'>{selectedReport[m.key]}</span>
                  </li>
                ))}
              </ul>

              <h3 className='font-bold text-sm'>Medications</h3>
              {selectedReport.medications.length === 0 ? (
                <p className='text-sm opacity-70'>None</p>
              ) : (
                <ul className='text-sm'>
                  {selectedReport.medications.map((m) => (
                    <li key={m.id}>
                      {m.name} – {m.dosage}
                    </li>
                  ))}
                </ul>
              )}

              <div className='card-actions justify-end'>
                <button type='button' className='btn btn-sm btn-ghost' style={SHARP} onClick={() => setSelectedReport(null)}>
                  Close
                </button>
              </div>
            </>
          ) : (
            <p className='opacity-70'>Click a point in the chart to read that check-in.</p>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Home;
