// src/pages/Booking/index.js
import React, { useState } from "react";
import { useSchedules } from "../Schedule/useSchedule"; // Pastikan path ini benar
import { useAppointments } from "../Booking/useAppointments"; // Pastikan path ini benar
import { toast } from "react-toastify";
import { userData } from "../../helpers";

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
      // Get current user ID
      const meRes = await fetch("http://localhost:1337/api/users/me", {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (!meRes.ok) {
        throw new Error("Gagal mendapatkan data user");
      }

      const meData = await meRes.json();
      let userId = meData.id;

      if (!userId && meData.data) {
        userId = meData.data.id;
      }

      if (!userId) {
        throw new Error("User ID tidak ditemukan");
      }

      // Create appointment using schedule.slug
      await createAppointment(userId, schedule.attributes.slug);

      toast.success("Booking berhasil!");
      refresh(); // Refresh schedules list
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
