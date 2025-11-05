import { useState, useEffect } from "react";
import { fetchCurrentUser, strapiAxios } from "../../lib/strapiClient";

export const useDashboard = (token) => {
  const [profile, setProfile] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const data = await fetchCurrentUser();
      setProfile(data);
    } catch (err) {
      setProfile(null);
    }
  };

  const fetchAppointments = async () => {
    try {
      if (!token) {
        setUpcoming([]);
        setHistory([]);
        return;
      }

      const user = await fetchCurrentUser();
      const userId = user?.id || user?.data?.id || user?.documentId;

      if (!userId) {
        setUpcoming([]);
        setHistory([]);
        return;
      }

      // Upcoming schedules - hapus populate yang bermasalah
      try {
        // NOTE: Gunakan booked_by (underscore) karena itu nama field di schema Strapi
        // Hapus populate=* dan populate[field]=* yang menyebabkan error
        // Kita akan akses data langsung dari response tanpa populate
        const upcomingUrl = `/schedules?filters[booked_by][id]=${userId}&filters[isBooked]=true&filters[statusJadwal]=${encodeURIComponent('Scheduled ')}&sort=tanggal:ASC`;
        console.log("🔵 Fetching upcoming schedules from:", upcomingUrl);
        const { data: upcomingData } = await strapiAxios.get(upcomingUrl);

        console.log("✅ Upcoming schedules data:", upcomingData);
        setUpcoming(upcomingData.data || []);
      } catch (err) {
        console.error("❌ Error fetching upcoming schedules:", {
          error: err.message || err,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url,
          userId,
        });
        setUpcoming([]);
      }

      // History schedules - hapus populate yang bermasalah
      try {
        // NOTE: Gunakan booked_by (underscore) karena itu nama field di schema Strapi
        // Hapus populate=* dan populate[field]=* yang menyebabkan error
        // Kita akan akses data langsung dari response tanpa populate
        const historyUrl = `/schedules?filters[booked_by][id]=${userId}&filters[isBooked]=true&filters[statusJadwal]=Completed&sort=tanggal:DESC`;
        console.log("🔵 Fetching history schedules from:", historyUrl);
        const { data: historyData } = await strapiAxios.get(historyUrl);

        console.log("✅ History schedules data:", historyData);
        setHistory(historyData.data || []);
      } catch (err) {
        console.error("❌ Error fetching history schedules:", {
          error: err.message || err,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url,
          userId,
        });
        setHistory([]);
      }
    } catch (err) {
      setUpcoming([]);
      setHistory([]);
    }
  };

  const fetchArticles = async () => {
    try {
      // Gunakan axios langsung untuk articles dengan publicationState dan populate coverImage
      // Strapi v5: Populate coverImage dengan format nested
      // Tambahkan timestamp untuk cache-busting agar gambar terbaru selalu di-fetch
      const timestamp = Date.now();
      const { data } = await strapiAxios.get(
        `/articles?publicationState=live&populate[0]=coverImage&_t=${timestamp}`
      );
      setArticles(data.data || []);
    } catch (err) {
      setArticles([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchProfile(), fetchAppointments(), fetchArticles()]);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { profile, upcoming, history, articles, loading, error };
};
