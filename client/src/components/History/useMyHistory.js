import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://ethical-benefit-bb8bd25123.strapiapp.com";

export const useMyHistory = (token) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const meRes = await axios.get(
        `${API_URL}/api/users/me`,
        config
      );
      const userId = meRes.data?.id || meRes.data?.data?.id;

      if (!userId) {
        setHistory([]);
        return;
      }

      // filter completed appointments for this user
      const res = await axios.get(
        `${API_URL}/api/appointments?filters[student][id]=${userId}&filters[statusJadwal]=Completed&populate=schedule.schedule,konselor,medical_record&sort=date:DESC`,
        config
      );

      setHistory(res.data?.data || []);
    } catch (err) {
      console.error("fetchHistory", err);
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
