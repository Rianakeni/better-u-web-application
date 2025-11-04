import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://ethical-benefit-bb8bd25123.strapiapp.com";

export const useAppointments = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSlots = async () => {
    try {
      // fetch all appointments and filter on client - backend may not expose 'available' filter
      const { data } = await axios.get(
        `${API_URL}/api/schedules?populate=*`
      );
      const all = data.data || [];
      // consider slot available if it has no student relation
      const available = all.filter((a) => {
        const student = a.attributes.student;
        // student can be null or have data
        if (!student) return true;
        if (student.data === null) return true;
        return false;
      });
      setSlots(available);
    } catch (err) {
      console.error("fetchSlots", err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  return { slots, loading, refresh: fetchSlots };
};
