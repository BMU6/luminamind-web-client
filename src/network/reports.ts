import { VITE_API_URL } from '@/config';
import { AUTH_URL } from '@/config';
import { getAccessToken } from '@/storage';

// The medication snapshot stored inside a report (name and dosage as they were at that time)
export type ApiActiveMedication = { medicationId: string; name: string; dosage: string };

// One document of the reports collection as it arrives over the wire (dates are ISO strings)
export type ApiReport = {
  _id: string;
  date: string;
  message: string;
  activeMedications: ApiActiveMedication[];
  mood: number;
  concentration: number;
  irritability: number;
  energy: number;
  sleep: number;
};

// Reports of the logged-in user from 'from' (included) until 'to' (excluded)
export const fetchReports = async (from: Date, to: Date): Promise<ApiReport[]> => {
  const query = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  const res = await fetch(`${VITE_API_URL}/home?${query}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error ?? 'Could not load the reports.');
  }
  return (await res.json()) as ApiReport[];
};

// AI summary of the reports of the logged-in user in the same kind of time range
export const fetchSummary = async (from: Date, to: Date): Promise<string> => {
  const res = await fetch(`${VITE_API_URL}/home/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
    body: JSON.stringify({ from: from.toISOString(), to: to.toISOString() }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error ?? 'Could not create the summary.');
  }
  const { summary } = (await res.json()) as { summary: string };
  return summary;
};
