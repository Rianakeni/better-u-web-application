import { useState, useEffect } from "react";
import { fetchCurrentUser, fetchWithQuery, strapiAxios } from "../../lib/strapiClient";

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
      try {
        const upcomingData = await fetchWithQuery('/appointments', {
          'filters[student][id]': userId,
          'filters[statusJadwal]': 'Scheduled ', // Dengan spasi di akhir sesuai database
          populate: ['schedule', 'konselor', 'medical_record'],
          sort: 'id:ASC'
        });

        setUpcoming(upcomingData.data || []);
      } catch (err) {
        setUpcoming([]);
      }

      // History appointments - status = "Completed"
      try {
        const historyData = await fetchWithQuery('/appointments', {
          'filters[student][id]': userId,
          'filters[statusJadwal]': 'Completed',
          populate: ['schedule', 'konselor', 'medical_record'],
          sort: 'id:DESC'
        });

        setHistory(historyData.data || []);
      } catch (err) {
        setHistory([]);
      }
    } catch (err) {
      setUpcoming([]);
      setHistory([]);
    }
  };

  const fetchArticles = async () => {
    try {
      // Gunakan axios langsung untuk articles dengan publicationState
      const { data } = await strapiAxios.get('/articles?publicationState=live');
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
