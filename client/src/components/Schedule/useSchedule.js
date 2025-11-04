// src/hooks/useSchedules.js
import { useState, useEffect } from "react";
import axios from "axios";

export const useSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(
        "http://localhost:1337/api/schedules?filters[isBooked][$eq]=false&populate=*&sort=tanggal:ASC,jam_mulai:ASC"
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
