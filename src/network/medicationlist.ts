import { useState, useEffect } from "react";
import { MedicationListType } from "@/types/medicationType";

export function useMedications() {
  const [medications, setMedications] = useState<MedicationListType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch live medications via native fetch on mount
  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/medicationlist/");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Formats database records for frontend UI presentation toggles
        const processedData = data.map((med: any) => ({
          ...med,
          id: med._id || med.id, // Handles standard Mongoose ObjectID mappings
          isExpanded: false, // Kept closed by default for a clean appearance
          isEditing: false, // Kept read-only until Edit is explicitly pressed
        }));

        setMedications(processedData);
        setError(null);
      } catch (err: any) {
        console.error("Database connection fault:", err);
        setError(
          "Could not retrieve medication registry records from server infrastructure.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, []);

  // 2. Commit a new tracking asset to the database via POST
  const addMedication = async () => {
    try {
      const templateMedication = {
        name: "New Medication Entry",
        dosage: "0 mg",
        schedule: { morning: false, noon: false, evening: false, night: false },
        effect: "",
      };

      const response = await fetch("http://localhost:3000/medicationlist/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  //3. Update on edit mode
  const toggleEditMode = async (id: string) => {
    const currentMed = medications.find((m) => m.id === id);

    // If the card is currently in edit mode and the user hits "SAVE"
    if (currentMed && currentMed.isEditing) {
      try {
        const response = await fetch(
          `http://localhost:3000/medicationlist/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: currentMed.name,
              dosage: currentMed.dosage,
              schedule: currentMed.schedule,
              effect: currentMed.effect,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Server rejected update configuration status: ${response.status}`,
          );
        }

        // Capture the updated document straight from the backend response body
        const updatedDoc = await response.json();

        // Map the backend payload state securely to our list array
        setMedications((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  name: updatedDoc.name,
                  dosage: updatedDoc.dosage,
                  schedule: updatedDoc.schedule,
                  effect: updatedDoc.effect,
                  isEditing: false, // Turn off editing field overlays
                }
              : m,
          ),
        );
        return; // Exit execution safely since state mapping is fully complete
      } catch (err) {
        console.error(
          "Failed updating specific database document reference:",
          err,
        );
        // Fallback: don't close edit panel if saving fails so the patient doesn't lose entered text
        return;
      }
    }

    // If the card is read-only and the user hits "EDIT", simply flip the toggle field overlay
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isEditing: !m.isEditing } : m)),
    );
  };

  // 4. Remove tracking entry out of the live ecosystem via DELETE
  const deleteMedication = async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/medicationlist/${id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) throw new Error("DELETE request failed");

      setMedications((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Failed deleting index row reference target entry:", err);
    }
  };

  // Presentation layout UI interactive helpers
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
