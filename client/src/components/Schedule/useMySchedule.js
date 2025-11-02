import { useState, useEffect } from "react";
import axios from "axios";

export const useMySchedule = (token) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAppointments = async () => {
    setLoading(true);
    try {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      // get current user id
      const meRes = await axios.get(
        "http://localhost:1337/api/users/me",
        config
      );
      const userId = meRes.data?.id || meRes.data?.data?.id;

      if (!userId) {
        setAppointments([]);
        return;
      }

      const res = await axios.get(
        `http://localhost:1337/api/appointments?filters[student][id]=${userId}&populate=schedule.schedule,konselor,medical_record&sort=id:ASC`,
        config
      );

      setAppointments(res.data?.data || []);
    } catch (err) {
      console.error("fetchMyAppointments", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { appointments, loading, refresh: fetchMyAppointments };
};
