// src/pages/Booking/index.js
import React, { useState } from "react";
import { useSchedules } from "../Schedule/useSchedule"; // Pastikan path ini benar
import axios from "axios";
import { useAppointments } from "../Booking/useAppointments"; // Pastikan path ini benar
import { toast } from "react-toastify";
import { userData, Protector } from "../../helpers";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://ethical-benefit-bb8bd25123.strapiapp.com";

const SlotCard = ({ schedule, onBook }) => {
  if (!schedule || !schedule.attributes) {
    return <div className="slot-card">Loading...</div>;
  }

  const attrs = schedule.attributes;
  const tanggal = attrs.tanggal;
  const jam_mulai = attrs.jam_mulai;
  const jam_selesai = attrs.jam_selesai;
  const konselor =
    attrs.konselor?.data?.attributes?.nama || attrs.konselor || "dr. konselor";

  return (
    <div className="slot-card">
      <div className="slot-left">
        <div className="slot-date">
          {tanggal
            ? new Date(tanggal).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "Tanggal"}
        </div>
        <div className="slot-time">
          {jam_mulai} - {jam_selesai}
        </div>
        <div className="slot-doctor">{konselor}</div>
      </div>
      <div className="slot-right">
        <button className="btn-book" onClick={() => onBook(schedule)}>
          Booking
        </button>
      </div>
    </div>
  );
};

const Booking = () => {
  const { schedules, loading: loadingSchedules, refresh } = useSchedules();
  const { createAppointment, loading: bookingLoading } = useAppointments();
  const [busy, setBusy] = useState(false);

  const { jwt } = userData();

  const handleBook = async (schedule) => {
    if (!jwt) {
      toast.error("Silakan login terlebih dahulu");
      return;
    }

    if (!schedule || !schedule.attributes) {
      toast.error("Jadwal tidak valid");
      return;
    }

    if (!schedule.attributes.slug) {
      toast.error("Slug jadwal tidak ditemukan");
      return;
    }

    setBusy(true);
    try {
      // get current user id
      const meRes = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const userId = meRes.data?.id || meRes.data?.data?.id;

      // update appointment to set student relation and status
      const payload = {
        data: {
          student: userId,
          statusJadwal: "booked",
        },
      };

      await axios.put(`${API_URL}/api/schedules/${schedule.id}`, payload, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      toast.success("Booking berhasil!");
      refresh(); // Refresh schedules list to remove the booked slot
    } catch (err) {
      console.error(err);
      toast.error(`Booking gagal: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="booking-page">
      <h1>Buat Janji Temu Baru</h1>
      <p>Pilih dari slot waktu yang tersedia di bawah ini</p>

      <div className="booking-card">
        {loadingSchedules ? (
          <p>Loading...</p>
        ) : schedules && schedules.length ? (
          <div className="booking-grid">
            {schedules.map((s) => (
              <SlotCard key={s.id} schedule={s} onBook={handleBook} />
            ))}
          </div>
        ) : (
          <p>Tidak ada slot tersedia</p>
        )}
      </div>
      {(busy || bookingLoading) && (
        <div className="booking-busy">Processing...</div>
      )}
    </div>
  );
};

export default Booking;
