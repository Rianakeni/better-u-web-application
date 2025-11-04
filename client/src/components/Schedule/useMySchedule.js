import { useState, useEffect } from "react";
import { fetchCurrentUser, fetchWithQuery } from "../../lib/strapiClient";

export const useMySchedule = (token) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAppointments = async () => {
    setLoading(true);
    try {
      if (!token) {
        setAppointments([]);
        return;
      }

      const user = await fetchCurrentUser();
      const userId = user?.id || user?.data?.id || user?.documentId;

      if (!userId) {
        setAppointments([]);
        return;
      }

              const appointmentsData = await fetchWithQuery('/appointments', {
                'filters[student][id]': userId,
                populate: ['schedule', 'konselor', 'medical_record'],
                sort: 'id:ASC'
              });

      setAppointments(appointmentsData.data || []);
    } catch (err) {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Re-fetch when token changes (e.g., after login or booking)

  return { appointments, loading, refresh: fetchMyAppointments };
};
