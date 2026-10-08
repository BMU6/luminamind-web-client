import { useState, useEffect } from "react";
import { MedicationListType } from "@/types/medicationType";
import { getAccessToken } from "@/storage";

export function useMedications(userId: string, targetPatientId?: string) {
  const [medications, setMedications] = useState<MedicationListType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchMedications = async () => {
      try {
        setLoading(true);

        const url = targetPatientId
          ? `http://localhost:3000/medicationlist?patientId=${targetPatientId}`
          : `http://localhost:3000/medicationlist`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const processedData = data.map((med: any) => ({
          ...med,
          id: med._id || med.id,
          isExpanded: false,
          isEditing: false,
        }));

        setMedications(processedData);
        setError(null);
      } catch (err: any) {
        console.error("Database connection fault:", err);
        setError("Could not retrieve medication registry records.");
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, [userId, targetPatientId]);
  const addMedication = async () => {
    try {
      // Explicitly map either 'patientId' or 'userId' depending on backend specs
      const templateMedication = {
        name: "New Medication Entry",
        dosage: "0 mg",
        schedule: { morning: false, noon: false, evening: false, night: false },
        effect: "",
        userId: targetPatientId || userId,
        patientId: targetPatientId || userId,
      };

      const response = await fetch("http://localhost:3000/medicationlist/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify(templateMedication),
      });

      if (!response.ok) throw new Error("POST request failed");
      const data = await response.json();

      const newMedItem: MedicationListType = {
        ...data,
        id: data._id || data.id,
        isExpanded: true,
        isEditing: true,
      };

      setMedications((prev) => [newMedItem, ...prev]);
    } catch (err) {
      console.error("Failed to commit new medication record row:", err);
    }
  };

  const toggleEditMode = async (id: string) => {
    const currentMed = medications.find((m) => m.id === id);

    if (currentMed && currentMed.isEditing) {
      try {
        const response = await fetch(
          `http://localhost:3000/medicationlist/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getAccessToken()}`,
            },
            body: JSON.stringify({
              name: currentMed.name,
              dosage: currentMed.dosage,
              schedule: currentMed.schedule,
              effect: currentMed.effect,
            }),
          },
        );

        if (!response.ok) throw new Error("PUT request failed");

        const updatedDoc = await response.json();

        setMedications((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  name: updatedDoc.name,
                  dosage: updatedDoc.dosage,
                  schedule: updatedDoc.schedule,
                  effect: updatedDoc.effect,
                  isEditing: false,
                }
              : m,
          ),
        );
        return;
      } catch (err) {
        console.error("Failed updating database document reference:", err);
        return;
      }
    }

    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isEditing: !m.isEditing } : m)),
    );
  };

  const deleteMedication = async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/medicationlist/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        },
      );
      if (!response.ok) throw new Error("DELETE request failed");
      setMedications((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Failed deleting row:", err);
    }
  };

  const toggleAll = (expand: boolean) => {
    setMedications((prev) => prev.map((m) => ({ ...m, isExpanded: expand })));
  };

  const toggleExpand = (id: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isExpanded: !m.isExpanded } : m)),
    );
  };

  const handleCheckboxChange = (
    id: string,
    period: keyof MedicationListType["schedule"],
  ) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, schedule: { ...m.schedule, [period]: !m.schedule[period] } }
          : m,
      ),
    );
  };

  const handleInputChange = (
    id: string,
    field: "name" | "dosage" | "effect",
    value: string,
  ) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  };

  return {
    medications,
    loading,
    error,
    toggleAll,
    toggleExpand,
    handleCheckboxChange,
    handleInputChange,
    toggleEditMode,
    deleteMedication,
    addMedication,
  };
}
