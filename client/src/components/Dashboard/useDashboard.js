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

      // Upcoming appointments - schedule yang sudah di-booking (status = "Scheduled")
      // Note: Database menyimpan 'Scheduled ' dengan spasi di akhir, jadi kita gunakan nilai yang benar
      // Strapi v5: Coba populate dengan format yang berbeda untuk memastikan relasi ter-populate
      try {
        // Coba dengan populate=* untuk populate semua relasi terlebih dahulu
        const upcomingUrl = `/appointments?filters[student][id]=${userId}&filters[statusJadwal]=${encodeURIComponent('Scheduled ')}&populate=*&sort=id:ASC`;
        const { data: upcomingData } = await strapiAxios.get(upcomingUrl);
        
        console.log("Upcoming appointments data:", upcomingData);
        setUpcoming(upcomingData.data || []);
      } catch (err) {
        console.error("Error fetching upcoming appointments:", {
          error: err.message || err,
          response: err.response?.data,
          userId
        });
        setUpcoming([]);
      }

      // History appointments - status = "Completed"
      try {
        // Coba dengan populate=* untuk populate semua relasi terlebih dahulu
        const historyUrl = `/appointments?filters[student][id]=${userId}&filters[statusJadwal]=Completed&populate=*&sort=id:DESC`;
        const { data: historyData } = await strapiAxios.get(historyUrl);
        
        console.log("History appointments data:", historyData);
        setHistory(historyData.data || []);
      } catch (err) {
        console.error("Error fetching history appointments:", {
          error: err.message || err,
          response: err.response?.data,
          userId
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
      const { data } = await strapiAxios.get(`/articles?publicationState=live&populate[0]=coverImage&_t=${timestamp}`);
      setArticles(data.data || []);
    } catch (err) {
      setArticles([]);  
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchProfile(), 
        fetchAppointments(), 
        fetchArticles()
      ]);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { profile, upcoming, history, articles, loading, error };
};
