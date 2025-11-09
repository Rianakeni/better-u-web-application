import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Col, Row, Button, FormGroup, Input } from "reactstrap";
import { register } from "../../lib/strapiClient";

// Inisialisasi state user dengan data kosong
const initialUser = { email: "", password: "", username: "" };

const Registration = () => {
  const [user, setUser] = useState(initialUser);
  const navigate = useNavigate();

  // Fungsi untuk menangani registrasi
  const signUp = async () => {
    try {
      // Validasi input pengguna
      if (!user.username || !user.email || !user.password) {
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

      // Kirim data ke API
      const res = await register({
        username: user.username,
        email: user.email,
        password: user.password,
      });

      // Cek apakah request berhasil
      if (res.jwt) {
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
