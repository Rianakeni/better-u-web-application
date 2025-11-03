// src/hooks/useAppointments.js
import { useState } from "react";
import axios from "axios";

export const useAppointments = () => {
  const [loading, setLoading] = useState(false);

  const createAppointment = async (studentId, scheduleSlug) => {
    if (!studentId) {
      throw new Error("Student ID tidak valid");
    }

    if (!scheduleSlug) {
      throw new Error("Schedule slug tidak valid");
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:1337/api/appointments",
        {
          data: {
            student: studentId,
            schedule: {
              slug: scheduleSlug,
            },
            statusJadwal: "booked",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return { createAppointment, loading };
};
