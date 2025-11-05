import React, { useEffect } from "react";
import { useMySchedule } from "./useMySchedule";
import { Protector } from "../../helpers";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaUserMd } from "react-icons/fa";

const AppointmentCard = ({ appt, onEdit }) => {
  // Strapi v5: data langsung di root, tidak ada attributes wrapper
  // Support both v4 (with attributes) and v5 (without attributes)
  const attrs = appt.attributes || appt || {};

  // Strapi v5: populate langsung di root, tidak ada .data.attributes
  // Support both formats (v4: schedule.data.attributes, v5: schedule.data atau schedule)
  const scheduleRel =
    attrs.schedule?.data?.attributes ||
    attrs.schedule?.data ||
    attrs.schedule ||
    {};

  const scheduleComp = scheduleRel.schedule ? scheduleRel.schedule[0] : null;
  const tanggal = scheduleComp?.tanggal || scheduleRel?.tanggal || attrs.date;

  // Jam: support both v4 and v5 format
  const jam_mulai = scheduleRel.jam_mulai || scheduleComp?.jam_mulai;
  const jam_selesai = scheduleRel.jam_selesai || scheduleComp?.jam_selesai;
  const jam =
    jam_mulai && jam_selesai
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
    status === "Scheduled"
      ? "di jadwalkan"
      : status === "Cancelled"
      ? "dibatalkan"
      : status === "Completed"
      ? "selesai"
      : "belum dijadwalkan";

  return (
    <div className="scheduled-card">
      <div
        className={`dash-item ${
          status === "Completed" ? "history" : "upcoming"
        }`}
      >
        <div className="dash-item-left">
          <div className="dash-row dash-date">
            <FaCalendarAlt className="dash-icon" aria-hidden="true" />
            <span className="dash-text">
              {tanggal
                ? new Date(tanggal).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </span>
          </div>

          <div className="dash-row dash-time">
            <FaClock className="dash-icon" aria-hidden="true" />
            <span className="dash-text">{jam}</span>
          </div>

          <div className="dash-row dash-doctor">
            <FaUserMd className="dash-icon" aria-hidden="true" />
            <span className="dash-text">{konselor}</span>
          </div>
        </div>

        <div className="dash-item-right">
          {status === "scheduled" && (
            <span className="badge scheduled">{statusLabel}</span>
          )}
          <div
            style={{
              flexDirection: "row",
              display: "flex",
              justifyContent: "right",
              padding: "10px",
              margin: "10px",
              gap: "10px",
            }}
          >
            <button
              style={{
                width: "15%",
                height: "30px",
                borderRadius: "8px",
                backgroundColor: "#dc4c4cff",
                color: "white",
                border: "none",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                alignContent: "center",
                justifyContent: "center",
              }}
              onClick={() => onEdit(appt)}
            >
              Batalkan Jadwal
            </button>
            <button
              style={{
                width: "15%",
                height: "30px",
                borderRadius: "8px",
                backgroundColor: "#3182ce",
                color: "white",
                border: "none",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={() => onEdit(appt)}
            >
              Ubah jadwal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// const AppointmentCard = ({ appt, onEdit, onCancel }) => {
//   const attrs = appt.attributes || appt || {};

//   // Mendapatkan data jadwal
//   const scheduleRel =
//     attrs.schedule?.data?.attributes || attrs.schedule?.data || attrs.schedule || {};
//   const tanggal = scheduleRel?.tanggal || attrs.date;
//   const jam_mulai = scheduleRel.jam_mulai || attrs.start_time;
//   const jam_selesai = scheduleRel.jam_selesai || attrs.end_time;
//   const konselor = attrs.konselor?.data?.attributes?.username || attrs.konselor || "dr. konselor";

//   // Format tanggal dan jam
//   const jam = jam_mulai && jam_selesai ? `${jam_mulai} - ${jam_selesai}` : "-";
//   const status = attrs.statusJadwal?.trim();
//   const statusLabel =
//     status === "Scheduled"
//       ? "di jadwalkan"
//       : status === "Cancelled"
//       ? "dibatalkan"
//       : status === "Completed"
//       ? "selesai"
//       : "belum dijadwalkan";

//   return (
//     <div className="appointment-card">
//       <div className="appointment-card-header">
//         <FaCalendarAlt />
//         <span className="appointment-date">
//           {tanggal ? new Date(tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "-"}
//         </span>
//       </div>

//       <div className="appointment-card-body">
//         <div className="appointment-time">
//           <FaClock />
//           <span>{jam}</span>
//         </div>
//         <div className="appointment-doctor">
//           <FaUserMd />
//           <span>{konselor}</span>
//         </div>
//       </div>

//       <div className="appointment-card-footer">
//         <button
//           className="cancel-btn"
//           style={{ backgroundColor: "#e53e3e", color: "white" }}
//           onClick={() => onCancel(appt)}
//         >
//           Batalkan Jadwal
//         </button>
//         <button
//           className="edit-btn"
//           style={{ backgroundColor: "#3182ce", color: "white" }}
//           onClick={() => onEdit(appt)}
//         >
//           Ubah Jadwal
//         </button>
//       </div>
//     </div>
//   );
// };

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
              <AppointmentCard
                key={a.id || a.documentId}
                appt={a}
                onEdit={handleEdit}
              />
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
