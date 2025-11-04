// src/pages/Booking/index.js
import React, { useState, useEffect } from "react";
import { useAppointments } from "./useAppointments";
import { toast } from "react-toastify";
import { userData } from "../../helpers";
import { getStrapiClient, getCurrentUserId } from "../../lib/strapiClient";

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
  const { slots, loading: loadingSchedules, fetchSlots } = useAppointments();
  const [busy, setBusy] = useState(false);

  const { jwt } = userData();

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Empty array - hanya jalankan sekali saat mount

  const handleBook = async (schedule) => {
    if (!jwt) {
      toast.error("Silakan login terlebih dahulu");
      return;
    }

    if (!schedule || !schedule.id) {
      toast.error("Jadwal tidak valid");
      return;
    }

    setBusy(true);
    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        toast.error("User ID tidak ditemukan");
        return;
      }

      const client = getStrapiClient();
      await client.collection('appointments').create({
        data: {
          student: userId,
          schedule: schedule.id,
          statusJadwal: "Scheduled ", // Dengan spasi di akhir sesuai format database
        },
      });

      toast.success("Booking berhasil!");
      fetchSlots();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error?.message || err.message || "Booking gagal";
      toast.error(msg);
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
        ) : slots && slots.length ? (
          <div className="booking-grid">
            {slots.map((s) => (
              <SlotCard key={s.id} schedule={s} onBook={handleBook} />
            ))}
          </div>
        ) : (
          <p>Tidak ada slot tersedia</p>
        )}
      </div>
      {busy && <div className="booking-busy">Processing...</div>}
    </div>
  );
};

export default Booking;
