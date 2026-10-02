import { useState, useEffect } from "react";

export function useReports(userId: string) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch historical reports for the authenticated patient
  useEffect(() => {
    if (!userId) return;

    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3000/reports?userId=${userId}`,
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        // Inject layout state properties locally
        const processedData = data.map((rep: any) => ({
          ...rep,
          id: rep._id || rep.id,
          isExpanded: false,
          isEditing: false,
        }));

        setReports(processedData);
        setError(null);
      } catch (err) {
        console.error("Failed pulling reports database logs:", err);
        setError("Could not retrieve daily clinical reports records.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [userId]);

  // 2. Add an empty report template container at the top of the list row safely
  const addReport = async () => {
    const newReportTemplate = {
      id: "temp_" + Date.now(),
      userId,
      date: new Date().toISOString(),
      mood: 3, // Neutral default baseline
      irritability: 0, // Clear numeric default (never undefined!)
      concentration: 3, // Clear numeric default (never undefined!)
      energy: 3, // Neutral default baseline
      sleep: 3, // Neutral default baseline
      message: "",
      activeMedications: [],
      isExpanded: true,
      isEditing: true, // Triggers inline editor open
    };

    setReports((prev) => [newReportTemplate, ...prev]);
  };

  // 3. UI interaction helpers matching the medication view framework
  const toggleAll = (expand: boolean) => {
    setReports((prev) => prev.map((r) => ({ ...r, isExpanded: expand })));
  };

  const toggleExpand = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isExpanded: !r.isExpanded } : r)),
    );
  };

  const handleInputChange = (id: string, field: string, value: any) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const deleteReport = async (id: string) => {
    if (id.startsWith("temp_")) {
      setReports((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/report/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("DELETE action failed");
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return {
    reports,
    loading,
    error,
    addReport,
    toggleAll,
    toggleExpand,
    handleInputChange,
    deleteReport,
    setReports,
  };
}
