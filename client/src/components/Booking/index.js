import React, { useState } from "react";
import { useAppointments } from "./useAppointments";
import axios from "axios";
import { toast } from "react-toastify";
import { userData, Protector } from "../../helpers";

const SlotCard = ({ slot, onBook }) => {
  const attrs = slot.attributes || {};
  const schedule = attrs.date || {};
  // if date is a component repeatable, it might be an array
  const tanggal =
    schedule.tanggal ||
    (Array.isArray(schedule) ? schedule[0]?.tanggal : null) ||
    attrs.date;
  const jam =
    schedule.jam ||
    (Array.isArray(schedule) ? schedule[0]?.jam : null) ||
    `${attrs.start_time || ""} - ${attrs.end_time || ""}`;
  const konselor =
    attrs.konselor?.data?.attributes?.username ||
    attrs.konselor ||
    "dr. konselor";

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
        <div className="slot-time">{jam}</div>
        <div className="slot-doctor">{konselor}</div>
      </div>
      <div className="slot-right">
        <button className="btn-book" onClick={() => onBook(slot)}>
          Booking
        </button>
      </div>
    </div>
  );
};

const Booking = () => {
  const { slots, loading, refresh } = useAppointments();
  const [busy, setBusy] = useState(false);

  const { jwt } = userData();

  const handleBook = async (slot) => {
    if (!jwt) {
      toast.error("Silakan login terlebih dahulu");
      return;
    }

    setBusy(true);
    try {
      // get current user id
      const meRes = await axios.get("http://localhost:1337/api/users/me", {
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

      await axios.put(
        `http://localhost:1337/api/appointments/${slot.id}`,
        payload,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      toast.success("Booking berhasil");
      refresh();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error?.message || err.message || "Booking gagal";
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
        {loading ? (
          <p>Loading...</p>
        ) : slots && slots.length ? (
          <div className="booking-grid">
            {slots.map((s) => (
              <SlotCard key={s.id} slot={s} onBook={handleBook} />
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

export default Protector
  ? (props) => <Protector Component={<Booking {...props} />} />
  : Booking;
