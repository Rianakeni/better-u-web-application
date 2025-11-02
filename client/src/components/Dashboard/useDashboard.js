import { useState, useEffect } from "react";
import axios from "axios";

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
        "http://localhost:1337/api/users/me",
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
        `http://localhost:1337/api/appointments?filters[date][$gte]=${today}&sort=date:ASC&populate=doctor,media`
      );
      setUpcoming(upcomingData.data || []);

      const { data: historyData } = await axios.get(
        `http://localhost:1337/api/appointments?filters[date][$lt]=${today}&sort=date:DESC&populate=doctor,media`
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
        "http://localhost:1337/api/articles?populate=image"
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
