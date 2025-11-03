import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Col, Row, Button, FormGroup, Input } from "reactstrap";

// Inisialisasi state user dengan data kosong
const initialUser = { email: "", password: "", username: "", phonenumber: "" };

const Registration = () => {
  const [user, setUser] = useState(initialUser);
  const navigate = useNavigate();

  // Fungsi untuk menangani registrasi
  const signUp = async () => {
    try {
      // Validasi input pengguna
      if (
        !user.username ||
        !user.email ||
        !user.password ||
        !user.phonenumber
      ) {
        toast.error("Please fill in all fields.", { hideProgressBar: true });
        return;
      }

      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        toast.error("Invalid email format.", { hideProgressBar: true });
        return;
      }

      // Validasi password (minimal 6 karakter)
      if (user.password.length < 6) {
        toast.error("Password must be at least 6 characters.", {
          hideProgressBar: true,
        });
        return;
      }

      // Validasi nomor telepon (contoh: minimal 10 digit angka)
      const phoneRegex = /^[0-9]{10,}$/;
      if (!phoneRegex.test(user.phonenumber)) {
        toast.error(
          "Invalid phone number format. Must be at least 10 digits.",
          {
            hideProgressBar: true,
          }
        );
        return;
      }

      // URL API untuk registrasi
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:1337";
      const url = `${API_URL}/api/auth/local/register`;

      // Kirim data ke API
      // Pastikan backend Strapi Anda sudah di-custom untuk menerima 'phonenumber'
      const res = await axios.post(url, {
        username: user.username,
        email: user.email,
        password: user.password,
        phonenumber: user.phonenumber, // Mengirim field kustom
      });

      // Cek apakah request berhasil
      if (res.status === 200) {
        toast.success("Registered successfully!", { hideProgressBar: true });
        setUser(initialUser);
        navigate("/login");
      }
    } catch (error) {
      // Menangani error jika API gagal atau terjadi masalah
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "An unknown error occurred.";
      toast.error(errorMessage, { hideProgressBar: true });
    }
  };

  // Fungsi untuk menangani perubahan input pengguna
  const handleUserChange = (event) => {
    const { name, value } = event.target;
    setUser((currentUser) => ({
      ...currentUser,
      [name]: value,
    }));
  };

  return (
    <Row className="register">
      <Col sm="12" md={{ size: 4 }}>
        <div>
          <h2>Sign up:</h2>
          <FormGroup>
            <Input
              type="text"
              name="username"
              value={user.username}
              onChange={handleUserChange}
              placeholder="Enter your full name"
            />
          </FormGroup>
          <FormGroup>
            <Input
              type="email"
              name="email"
              value={user.email}
              onChange={handleUserChange}
              placeholder="Enter your email"
            />
          </FormGroup>
          <FormGroup>
            <Input
              type="text" // Anda bisa mengganti type="tel" untuk usability di mobile
              name="phonenumber"
              value={user.phonenumber}
              onChange={handleUserChange}
              placeholder="Enter your phone number"
            />
          </FormGroup>
          <FormGroup>
            <Input
              type="password"
              name="password"
              value={user.password}
              onChange={handleUserChange}
              placeholder="Enter password"
            />
          </FormGroup>
          <Button color="primary" onClick={signUp}>
            Sign up
          </Button>
        </div>
      </Col>
    </Row>
  );
};

export default Registration;
