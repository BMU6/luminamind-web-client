import { useState, useEffect } from "react";
import { useAuth } from "@/context";
import { VITE_API_URL } from "@/config";
import { getAccessToken } from "@/storage";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { PageCard, PageToolbar } from "@/components";

interface ConnectedPatient {
  id: string;
  email: string;
  needsUrgentReview: boolean;
}

interface AISummaryResponse {
  brief: string;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [patients, setPatients] = useState<ConnectedPatient[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<ConnectedPatient | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  // 1. Fetch connected patients array on initialization mount
  useEffect(() => {
    if (!user) return;

    const loadPatients = async () => {
      try {
        setLoadingPatients(true);
        const response = await fetch(`${VITE_API_URL}/doctor/doctor/patients`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
        if (!response.ok) throw new Error(t("doctor.loadPatientsError"));
        const data = await response.json();
        setPatients(data);
      } catch (err: any) {
        toast.error(err.message || t("doctor.fetchDirectoryError"));
      } finally {
        setLoadingPatients(false);
      }
    };

    loadPatients();
  }, [user, t]);

  // 2. Fetch local Llama 3.1 summary brief on-demand when a patient profile card is clicked
  const handleSelectPatient = async (patient: ConnectedPatient) => {
    setSelectedPatient(patient);
    setAiSummary("");

    try {
      setLoadingSummary(true);
      const response = await fetch(
        `${VITE_API_URL}/doctor/doctor/patient-summary/${patient.id}`,
        {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        },
      );
      if (!response.ok) throw new Error(t("doctor.aiBriefError"));
      const data: AISummaryResponse = await response.json();
      setAiSummary(data.brief);
    } catch (err: any) {
      toast.error(err.message || t("doctor.aiSummarizerError"));
    } finally {
      setLoadingSummary(false);
    }
  };

  // 3. Generate a temporary short invitation token code for a secure relationship handshake
  const handleGenerateCode = async () => {
    try {
      setLoadingCode(true);
      const response = await fetch(
        `${VITE_API_URL}/doctor/doctor/generate-code`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        },
      );
      if (!response.ok) throw new Error(t("doctor.inviteTokenError"));
      const data = await response.json();
      setInviteCode(data.code);
      toast.success(t("doctor.codeGeneratedSuccess"));
    } catch (err: any) {
      toast.error(err.message || t("doctor.handshakeCodeError"));
    } finally {
      setLoadingCode(false);
    }
  };
  return (
    <PageCard size="lg">
      <PageToolbar
        title={t("doctor.dashboardTitle", "Doctor Dashboard")}
        leading={
          !loadingPatients && (
            <span className="text-xs sm:text-sm font-semibold text-white/60">
              {patients.length}{" "}
              {patients.length === 1
                ? t("doctor.patientSingular", "patient")
                : t("doctor.patientPlural", "patients")}
            </span>
          )
        }
      />

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Patient Directory Grid & Handshake Box */}
        <div className="md:col-span-1 flex flex-col gap-6">
          {/* Patient Selection Directory */}
          <div className="border border-base-content/10 rounded-2xl p-5 flex flex-col gap-4 bg-base-100 shadow-xs">
            <h2 className="text-sm font-black uppercase tracking-wider text-base-content/70 border-b border-base-content/10 pb-2 text-left">
              {t("doctor.workspaceDirectory")}
            </h2>

            {loadingPatients ? (
              <div className="text-center py-6">
                <span className="loading loading-spinner text-primary loading-sm"></span>
              </div>
            ) : patients.length === 0 ? (
              <p className="text-xs text-base-content/50 italic text-center py-4">
                {t("doctor.noPatients")}
              </p>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {patients.map((pat) => (
                  <div
                    key={pat.id}
                    onClick={() => handleSelectPatient(pat)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex justify-between items-center select-none ${
                      selectedPatient?.id === pat.id
                        ? "border-primary bg-primary/5 shadow-xs font-bold"
                        : "border-base-content/10 bg-base-100 hover:border-primary/40"
                    }`}
                  >
                    <div className="truncate pr-2 text-left">
                      <p className="text-xs truncate">{pat.email}</p>
                      <p className="text-[9px] text-base-content/40 font-mono truncate">
                        ID: {pat.id.substring(0, 8)}...
                      </p>
                    </div>
                    {pat.needsUrgentReview && (
                      <span className="badge badge-error text-white font-bold text-[8px] uppercase tracking-wide rounded-md px-1.5 h-4">
                        {t("doctor.flaggedBadge")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secure Relationship Invitation Handshake Module */}
          <div className="border border-base-content/10 rounded-2xl p-5 flex flex-col gap-3 bg-base-100 shadow-xs text-left">
            <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/70">
              {t("doctor.connectPatientTitle")}
            </h3>
            <p className="text-[11px] text-base-content/50 leading-relaxed font-medium">
              {t("doctor.connectPatientSubtitle")}
            </p>
            {inviteCode && (
              <div className="bg-base-content/5 text-center py-2.5 rounded-xl border border-base-content/10 font-mono text-xl font-black tracking-widest text-primary animate-pulse">
                {inviteCode}
              </div>
            )}
            <button
              onClick={handleGenerateCode}
              disabled={loadingCode}
              className="btn btn-neutral btn-sm rounded-xl w-full text-xs text-white font-bold tracking-wide"
            >
              {loadingCode
                ? t("doctor.btnGenerating")
                : inviteCode
                  ? t("doctor.btnRegenerate")
                  : t("doctor.btnCreate")}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Patient Summary and Chart Workspace Panel */}
        <div className="md:col-span-2 border border-base-content/10 rounded-2xl p-6 flex flex-col gap-6 min-h-[60vh] bg-base-100 shadow-xs">
          {selectedPatient ? (
            <>
              <header className="border-b border-base-content/10 pb-3 flex flex-wrap gap-2 justify-between items-center">
                <h3 className="text-base font-black tracking-tight text-left">
                  {t("doctor.timelineAnalysisView")}
                </h3>
                <span className="text-[10px] font-mono bg-base-content/10 px-3 py-1 rounded-lg truncate max-w-xs">
                  {t("doctor.activeLabel")}: {selectedPatient.email}
                </span>
              </header>

              {/* Local Privacy AI Engine Context Output Container */}
              <div className="bg-base-content/5 border border-base-content/10 rounded-xl p-4 space-y-2 shadow-inner text-left">
                <div className="flex items-center gap-1.5 text-base-content/60">
                  <span className="text-base">🦙</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest">
                    {t("doctor.aiHeader")}
                  </span>
                </div>

                {loadingSummary ? (
                  <div className="py-2 flex items-center gap-2 text-xs text-base-content/50 italic">
                    <span className="loading loading-dots loading-xs"></span>
                    <span>{t("doctor.aiCompiling")}</span>
                  </div>
                ) : (
                  <p className="text-xs text-base-content/80 leading-relaxed font-medium pl-1">
                    {aiSummary || t("doctor.aiEmpty")}
                  </p>
                )}
              </div>

              {/* Chart Canvas Engine Box Canvas Placeholder */}
              <div className="flex-1 border border-dashed border-base-content/20 rounded-xl flex flex-col items-center justify-center bg-base-content/5 text-center p-6 min-h-[250px]">
                <span className="text-xl opacity-40 mb-1">📈</span>
                <h4 className="font-bold text-xs text-base-content/60 mb-1">
                  {t("doctor.chartHeading")}
                </h4>
                <p className="text-[10px] text-base-content/40 font-semibold max-w-xs leading-normal">
                  {t("doctor.chartSubtitle")}
                </p>
              </div>
            </>
          ) : (
            <div className="m-auto text-center space-y-2.5 text-base-content/40 select-none py-16">
              <div className="text-4xl">📋</div>
              <h3 className="font-bold text-sm tracking-wide uppercase">
                {t("doctor.emptyStateTitle")}
              </h3>
              <p className="text-xs max-w-xs mx-auto font-medium">
                {t("doctor.emptyStateSubtitle")}
              </p>
            </div>
          )}
        </div>
      </main>
    </PageCard>
  );
}
