import React, { useEffect } from "react";
import { useMySchedule } from "./useMySchedule";
import { Protector } from "../../helpers";
import { useNavigate, useLocation } from "react-router-dom";

const AppointmentCard = ({ appt, onEdit }) => {
  // Strapi v5: data langsung di root, tidak ada attributes wrapper
  // Support both v4 (with attributes) and v5 (without attributes)
  const attrs = appt.attributes || appt || {};
  
  // Strapi v5: populate langsung di root, tidak ada .data.attributes
  // Support both formats (v4: schedule.data.attributes, v5: schedule.data atau schedule)
  const scheduleRel = attrs.schedule?.data?.attributes || 
                       attrs.schedule?.data || 
                       attrs.schedule || {};
  
  const scheduleComp = scheduleRel.schedule ? scheduleRel.schedule[0] : null;
  const tanggal = scheduleComp?.tanggal || scheduleRel?.tanggal || attrs.date;
  
  // Jam: support both v4 and v5 format
  const jam_mulai = scheduleRel.jam_mulai || scheduleComp?.jam_mulai;
  const jam_selesai = scheduleRel.jam_selesai || scheduleComp?.jam_selesai;
  const jam = jam_mulai && jam_selesai 
    ? `${jam_mulai} - ${jam_selesai}`
    : scheduleComp?.jam ||
      scheduleRel?.jam ||
      `${attrs.start_time || ""} - ${attrs.end_time || ""}`;
  
  // Konselor: support both v4 and v5 format
  const konselor =
    attrs.konselor?.data?.attributes?.username ||
    attrs.konselor?.data?.username ||
    attrs.konselor?.username ||
    attrs.konselor ||
    "dr. konselor";
  
  const status = (attrs.statusJadwal || "").trim();

  const statusLabel =
    status === "Cancelled"
      ? "di batalkan"
      : status === "Completed"
      ? "selesai"
      : "di jadwalkan";

  return (
    <div className="appointment-card">
      <div className="appointment-left">
        <div className="appointment-date">
          {tanggal
            ? new Date(tanggal).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "-"}
        </div>
        <div className="appointment-time">{jam}</div>
        <div className="appointment-doctor">{konselor}</div>
      </div>
      <div className="appointment-right">
        <div
          className={`status-badge ${
            status === "Cancelled" ? "cancel" : "scheduled"
          }`}
        >
          {statusLabel}
        </div>
        <button className="btn-edit" onClick={() => onEdit(appt)}>
          Ubah jadwal
        </button>
      </div>
    </div>
  );
};

const MySchedule = ({ token }) => {
  const { appointments, loading, refresh } = useMySchedule(token);
  const navigate = useNavigate();
  const location = useLocation();

  // Refresh data saat navigate ke halaman ini (misalnya setelah booking)
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Re-fetch when pathname changes

  const handleEdit = (appt) => {
    // currently navigate to booking page for reschedule; could be enhanced
    navigate("/booking");
  };

  return (
    <div className="schedule-page">
      <h1>Jadwal Saya</h1>
      <p>
        Kelola dan pantau jadwal konselingmu dengan mudah di sini. Pastikan
        setiap sesi sesuai dengan kebutuhan dan waktu yang kamu inginkan
      </p>

      <div className="schedule-card">
        {loading ? (
          <p>Loading...</p>
        ) : appointments && appointments.length ? (
          <div className="schedule-grid">
            {appointments.map((a) => (
              <AppointmentCard key={a.id || a.documentId} appt={a} onEdit={handleEdit} />
            ))}
          </div>
        ) : (
          <p>Tidak ada jadwal</p>
        )}
      </div>
    </div>
  );
};

export default Protector
  ? (props) => <Protector Component={<MySchedule {...props} />} />
  : MySchedule;
