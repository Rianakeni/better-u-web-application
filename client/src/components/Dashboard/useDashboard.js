import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://ethical-benefit-bb8bd25123.strapiapp.com";

export const useDashboard = (token) => {
  const [profile, setProfile] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fungsi untuk mengambil data profile pengguna
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("jwt");
      console.log("Token JWT:", token); // Periksa token yang digunakan

      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const { data } = await axios.get(
        `${API_URL}/api/users/me`,
        config
      );

      console.log("Response:", response.data); // Cek respons dari server

      if (response.status === 200) {
        setProfile(response.data);
      } else {
        setError("Failed to fetch user data");
      }
    } catch (err) {
      console.error(err); // Log error
      setError(err.message);
      setProfile(null);
    }
  };

  // Fungsi untuk mengambil daftar appointments berdasarkan ID user yang sedang login
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
      setError(err.message);
      // endpoints might not exist yet; keep arrays empty
      setUpcoming([]);
      setHistory([]);
    }
  };

  // Fungsi untuk mengambil artikel
  const fetchArticles = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/articles?populate=image`
      );
      setArticles(data.data || []);
    } catch (err) {
      setError(err.message);
      setArticles([]);
    }
  };

  // Hook untuk menjalankan fungsi ketika komponen dimuat
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchProfile(), fetchAppointments(), fetchArticles()]);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, profile]); // Re-fetch jika token atau profile berubah

  return { profile, upcoming, history, articles, loading, error };
};
