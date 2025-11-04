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
        return;
      }

      const user = await fetchCurrentUser();
      const userId = user?.id || user?.data?.id;

      if (!userId) {
        setHistory([]);
        return;
      }

              const historyData = await fetchWithQuery('/appointments', {
                'filters[student][id]': userId,
                'filters[statusJadwal]': 'Completed',
                populate: ['schedule', 'konselor', 'medical_record'],
                sort: 'id:DESC'
              });

      setHistory(historyData.data || []);
    } catch (err) {
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
