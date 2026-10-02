export type ActiveMedicationSnapshot = {
  medicationId: string;
  name: string;
  dosage: string;
};

export type Report = {
  id: string;
  userId: string;
  date: string;
  activeMedications: ActiveMedicationSnapshot[];
  mood: number;
  anxiety: number;
  energy: number;
  sleep: number;
  message: string;
  createdAt: string;
};
