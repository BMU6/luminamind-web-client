export type MedicationListType = {
  id: string;
  name: string;
  dosage: string;
  schedule: {
    morning: boolean;
    noon: boolean;
    evening: boolean;
    night: boolean;
  };
  effect: string;
  isExpanded: boolean;
  isEditing: boolean;
  userId: string;
};
