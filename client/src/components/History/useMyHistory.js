import { useState, useEffect } from "react";
import { fetchCurrentUser, fetchWithQuery } from "../../lib/strapiClient";

export const useMyHistory = (token) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (!token) {
        setHistory([]);
        setLoading(false);
        return;
      }

      const user = await fetchCurrentUser();
      const userId = user?.id || user?.data?.id || user?.documentId;

      if (!userId) {
        setHistory([]);
        setLoading(false);
        return;
      }

      // Fetch appointments dengan status "Completed" dan "Scheduled " (yang sudah dibuat)
      // Gunakan fetchWithQuery yang sama seperti Dashboard untuk konsistensi
      try {
        // Fetch dua query terpisah untuk Completed dan Scheduled, lalu gabungkan
        const completedData = await fetchWithQuery("/appointments", {
          "filters[student][id]": userId,
          "filters[statusJadwal]": "Completed", // Only fetch completed appointments
          populate: ["schedule", "konselor"], // Populate schedule and konselor if needed
          sort: "id:DESC",
        }).catch(() => ({ data: [] }));

        // Gabungkan dan urutkan berdasarkan id DESC
        const allHistory = [...(completedData.data || [])];

        // Sort berdasarkan id DESC (yang terbaru di atas)
        allHistory.sort((a, b) => {
          const idA = a.id || a.documentId || 0;
          const idB = b.id || b.documentId || 0;
          return idB - idA;
        });

        setHistory(allHistory);
      } catch (queryErr) {
        console.error("Error fetching history:", queryErr);
        setHistory([]);
      }
    } catch (err) {
      console.error("Error in fetchHistory:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { history, loading, refresh: fetchHistory };
};
