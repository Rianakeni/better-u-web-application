import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [newRecord, setNewRecord] = useState({
    permasalahan: "",
    diagnosa: "",
    rekomendasi: "",
    isFilled: false,
    appointment: "", // ID of the related Appointment
  });

  // Fetch all medical records
  useEffect(() => {
    // Get all medical records
    axios
      .get(
        `${API_URL}/api/medical-records?populate[appointment]=true`
      )
      .then((response) => {
        setRecords(response.data.data);
      })
      .catch((error) => console.error("Error fetching records: ", error));

    // Get all available appointments
    axios
      .get(`${API_URL}/api/appointments`)
      .then((response) => {
        setAppointments(response.data.data);
      })
      .catch((error) => console.error("Error fetching appointments: ", error));
  }, []);

  // Handle input changes (support checkbox)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRecord({
      ...newRecord,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle form submission to create a new record
  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post(`${API_URL}/api/medical-records`, {
        data: {
          permasalahan: newRecord.permasalahan,
          diagnosa: newRecord.diagnosa,
          rekomendasi: newRecord.rekomendasi,
          isFilled: newRecord.isFilled,
          appointment: newRecord.appointment, // Choose the related appointment
        },
      })
      .then((response) => {
        setRecords([...records, response.data.data]);
        setNewRecord({
          permasalahan: "",
          diagnosa: "",
          rekomendasi: "",
          isFilled: false,
          appointment: "", // Reset after successful submission
        });
      })
      .catch((error) => console.error("Error creating record: ", error));
  };

  // Handle delete record
  const handleDelete = (id) => {
    axios
      .delete(`${API_URL}/api/medical-records/${id}`)
      .then((response) => {
        setRecords(records.filter((record) => record.id !== id));
      })
      .catch((error) => console.error("Error deleting record: ", error));
  };

  return (
    <div>
      <h1>Medical Records</h1>

      {/* Form to Add a New Record */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="permasalahan"
          value={newRecord.permasalahan}
          onChange={handleChange}
          placeholder="Masalah"
          required
        />
        <input
          type="text"
          name="diagnosa"
          value={newRecord.diagnosa}
          onChange={handleChange}
          placeholder="Diagnosa"
          required
        />
        <input
          type="text"
          name="rekomendasi"
          value={newRecord.rekomendasi}
          onChange={handleChange}
          placeholder="Rekomendasi"
          required
        />
        <input
          type="checkbox"
          name="isFilled"
          checked={newRecord.isFilled}
          onChange={handleChange}
        />{" "}
        Is Filled
        {/* Dropdown to select an existing appointment */}
        <select
          name="appointment"
          value={newRecord.appointment}
          onChange={handleChange}
          required
        >
          <option value="">Select Appointment</option>
          {appointments.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
              Appointment {appointment.id} -{" "}
              {appointment.attributes?.date ||
                appointment.attributes?.schedule?.data?.attributes?.tanggal ||
                ""}
            </option>
          ))}
        </select>
        <button type="submit">Add Record</button>
      </form>

      <h2>Existing Records</h2>
      <ul>
        {records.map((record) => (
          <li key={record.id}>
            <div>
              <h3>{record.attributes.permasalahan}</h3>
              <p>Diagnosa: {record.attributes.diagnosa}</p>
              <p>Rekomendasi: {record.attributes.rekomendasi}</p>
              <p>
                Status: {record.attributes.isFilled ? "Completed" : "Pending"}
              </p>
              <p>
                Appointment ID:{" "}
                {record.attributes.appointment?.data?.id || "N/A"}
              </p>
              <button onClick={() => handleDelete(record.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MedicalRecords;
