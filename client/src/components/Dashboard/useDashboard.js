import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

export const useDashboard = (token) => {
  const [profile, setProfile] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      console.error("fetchProfile error:", err);
      setProfile(null);
    }
  };

  const fetchAppointments = async () => {
    try {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      
      // Get current user id first
      const meRes = await axios.get(
        `${API_URL}/api/users/me`,
        config
      );
      const userId = meRes.data?.id || meRes.data?.data?.id;

      if (!userId) {
        setUpcoming([]);
        setHistory([]);
        return;
      }

      // upcoming appointments - coba tanpa populate dulu jika error
      try {
        const { data: upcomingData } = await axios.get(
          `${API_URL}/api/appointments?filters[statusJadwal][$eq]=Scheduled&filters[student][id][$eq]=${userId}`,
          config
        );
        setUpcoming(upcomingData.data || []);
      } catch (err) {
        console.error("fetchUpcoming error:", err);
        setUpcoming([]);
      }

      // history appointments
      try {
        const { data: historyData } = await axios.get(
          `${API_URL}/api/appointments?filters[student][id][$eq]=${userId}&filters[statusJadwal][$eq]=Completed`,
          config
        );
        setHistory(historyData.data || []);
      } catch (err) {
        console.error("fetchHistory error:", err);
        setHistory([]);
      }
    } catch (err) {
      console.error("fetchAppointments error:", err);
      setUpcoming([]);
      setHistory([]);
    }
  };

  const fetchArticles = async () => {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
    
    try {
      const { data } = await axios.get(
        `${API_URL}/api/articles`,
        config
      );
      
      // Filter hanya published articles di client side
      const allArticles = data.data || [];
      const publishedArticles = allArticles.filter(article => {
        // Handle both Strapi v4 and v5 formats
        // Check di attributes dulu, lalu di root
        const status = article.attributes?.status || 
                       article.attributes?.status_article ||
                       article.status_article || 
                       article.status;
        
        // Case insensitive check
        return status?.toLowerCase() === "published";
      });
      
      setArticles(publishedArticles);
    } catch (err) {
      console.error("fetchArticles error:", err);
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
