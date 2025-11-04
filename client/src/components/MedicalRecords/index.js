import React, { useEffect, useState } from "react";
import { getStrapiClient } from "../../lib/strapiClient";

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
    const fetchData = async () => {
      try {
        const client = getStrapiClient();
        
        // Get all medical records
        const recordsData = await client.collection('medical-records').find({
          populate: {
            appointment: true
          }
        });
        setRecords(recordsData.data || []);

        // Get all appointments
        const appointmentsData = await client.collection('appointments').find();
        setAppointments(appointmentsData.data || []);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const client = getStrapiClient();
      const response = await client.collection('medical-records').create({
        data: {
          permasalahan: newRecord.permasalahan,
          diagnosa: newRecord.diagnosa,
          rekomendasi: newRecord.rekomendasi,
          isFilled: newRecord.isFilled,
          appointment: newRecord.appointment,
        },
      });

      setRecords([...records, response.data]);
      setNewRecord({
        permasalahan: "",
        diagnosa: "",
        rekomendasi: "",
        isFilled: false,
        appointment: "",
      });
    } catch (error) {
      console.error("Error creating record: ", error);
    }
  };

  // Handle delete record
  const handleDelete = async (id) => {
    try {
      const client = getStrapiClient();
      await client.collection('medical-records').delete(id);
      setRecords(records.filter((record) => record.id !== id));
    } catch (error) {
      console.error("Error deleting record: ", error);
    }
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
