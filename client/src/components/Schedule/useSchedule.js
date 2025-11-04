// src/hooks/useSchedules.js
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

export const useSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/schedules?filters[isBooked][$eq]=false&populate=*&sort=tanggal:ASC,jam_mulai:ASC`
      );

      // Pastikan response.data dan response.data.data ada
      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error("Invalid response format");
      }

      setSchedules(response.data.data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return { schedules, loading, refresh: fetchSchedules };
};
