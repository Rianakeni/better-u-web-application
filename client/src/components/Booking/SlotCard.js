import React from "react";

const SlotCard = ({ schedule, onBookClick }) => {
  // Strapi v5: data langsung di root, tidak ada attributes wrapper
  // Support both v4 (with attributes) and v5 (without attributes)
  const attrs = schedule?.attributes || schedule || {};

  if (!schedule || (!attrs.tanggal && !attrs.jam_mulai)) {
    return <div className="slot-card">Loading...</div>;
  }

  const tanggal = attrs.tanggal;
  const jam_mulai = attrs.jam_mulai;
  const jam_selesai = attrs.jam_selesai;

  // Konselor: support both v4 and v5 format
  const konselor =
    attrs.konselor?.data?.attributes?.nama ||
    attrs.konselor?.data?.nama ||
    attrs.konselor?.nama ||
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
        <div className="slot-time">
          {jam_mulai} - {jam_selesai}
        </div>
        <div className="slot-doctor">{konselor}</div>
      </div>
      <div className="slot-right">
        <button className="btn-book" onClick={() => onBookClick(schedule)}>
          Booking
        </button>
      </div>
    </div>
  );
};

export default SlotCard;
