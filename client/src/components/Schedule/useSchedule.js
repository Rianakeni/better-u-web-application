// src/hooks/useSchedules.js
import { useState, useEffect } from "react";
import { getStrapiClient } from "../../lib/strapiClient";

export const useSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      const client = getStrapiClient();
      const schedulesData = await client.collection('schedules').find({
        filters: {
          isBooked: {
            $eq: false
          }
        },
        populate: '*',
        sort: ['tanggal:asc', 'jam_mulai:asc']
      });

      if (!Array.isArray(schedulesData.data)) {
        throw new Error("Invalid response format");
      }

      setSchedules(schedulesData.data);
    } catch (err) {
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
