import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://ethical-benefit-bb8bd25123.strapiapp.com";

export const useDashboard = (token) => {
  const [profile, setProfile] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const { data } = await axios.get(
        `${API_URL}/api/users/me`,
        config
      );
      setProfile(data);
    } catch (err) {
      // silent; user might be anonymous
      setProfile(null);
    }
  };

  const fetchAppointments = async () => {
    try {
      // upcoming
      const today = new Date().toISOString();
      const { data: upcomingData } = await axios.get(
        `${API_URL}/api/appointments?filters[statusJadwal][$eq]=Scheduled&filters[student][id][$eq]=${userId}&populate[schedule][fields][0]=tanggal&populate[schedule][fields][1]=jam_mulai&populate[schedule][fields][2]=jam_selesai&populate[konselor][fields][0]=username`
      );
      setUpcoming(upcomingData.data || []);

      const { data: historyData } = await axios.get(
        `${API_URL}/api/appointments?filters[date][$lt]=${today}&sort=date:DESC&populate=doctor,media`
      );
      setHistory(historyData.data || []);
    } catch (err) {
      // endpoints might not exist yet; keep arrays empty
      setUpcoming([]);
      setHistory([]);
    }
  };

  const fetchArticles = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/articles?populate=image`
      );
      setArticles(data.data || []);
    } catch (err) {
      setArticles([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchAppointments(), fetchArticles()]);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { profile, upcoming, history, articles, loading };
};
