import React from "react";
import { useSchedules } from "./useSchedule";
import { Protector } from "../../helpers";
import { useNavigate } from "react-router-dom";

const AppointmentCard = ({ appt, onEdit }) => {
  const attrs = appt.attributes || {};
  const scheduleRel = attrs.schedule?.data?.attributes || {};
  const scheduleComp = scheduleRel.schedule ? scheduleRel.schedule[0] : null;
  const tanggal = scheduleComp?.tanggal || scheduleRel?.tanggal || attrs.date;
  const jam =
    scheduleComp?.jam ||
    scheduleRel?.jam ||
    `${attrs.start_time || ""} - ${attrs.end_time || ""}`;
  const konselor =
    attrs.konselor?.data?.attributes?.username ||
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
  const { appointments, loading } = useSchedules(token);
  const navigate = useNavigate();

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
              <AppointmentCard key={a.id} appt={a} onEdit={handleEdit} />
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
