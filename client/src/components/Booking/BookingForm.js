import React, { useState, useEffect } from "react";

const BookingForm = ({ schedule, isOpen, onClose, onConfirm }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Reset form when modal opens/closes or schedule changes
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber("");
      setFormErrors({});
    }
  }, [isOpen, schedule]);

  const validatePhoneNumber = (phone) => {
    // Validasi: minimal 10 digit angka
    const phoneRegex = /^[0-9]{10,}$/;
    if (!phone || !phone.trim()) {
      return "Nomor telepon wajib diisi";
    }
    if (!phoneRegex.test(phone.trim())) {
      return "Nomor telepon harus minimal 10 digit angka";
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validatePhoneNumber(phoneNumber);
    if (error) {
      setFormErrors({ phoneNumber: error });
      return;
    }

    onConfirm(phoneNumber.trim());
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    // Clear error when user starts typing
    if (formErrors.phoneNumber) {
      setFormErrors({});
    }
  };

  if (!isOpen || !schedule) return null;

  const attrs = schedule?.attributes || schedule || {};
  const tanggal = attrs.tanggal;
  const jam_mulai = attrs.jam_mulai;
  const jam_selesai = attrs.jam_selesai;
  const konselor =
    attrs.konselor?.data?.attributes?.nama ||
    attrs.konselor?.data?.nama ||
    attrs.konselor?.nama ||
    attrs.konselor ||
    "dr. konselor";

  const dateStr = tanggal
    ? new Date(tanggal).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Tanggal";

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking-modal-header">
          <h2>Konfirmasi Booking</h2>
          <button className="booking-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="booking-modal-body">
          <div className="booking-modal-info">
            <div className="booking-modal-info-item">
              <strong>Tanggal:</strong> {dateStr}
            </div>
            <div className="booking-modal-info-item">
              <strong>Waktu:</strong> {jam_mulai} - {jam_selesai}
            </div>
            <div className="booking-modal-info-item">
              <strong>Konselor:</strong> {konselor}
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="booking-modal-form-group">
              <label htmlFor="phoneNumber">Nomor Telepon *</label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={handleChange}
                placeholder="Masukkan nomor telepon (min. 10 digit)"
                className={formErrors.phoneNumber ? "error" : ""}
              />
              {formErrors.phoneNumber && (
                <span className="booking-modal-error">
                  {formErrors.phoneNumber}
                </span>
              )}
            </div>
            <div className="booking-modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn-confirm">
                Konfirmasi Booking
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
