import React, { useState } from "react";
import { FormGroup, Input } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { storeUser } from "../../helpers";

const initialUser = { password: "", identifier: "" };

const Login = () => {
  const [user, setUser] = useState(initialUser);
  const navigate = useNavigate();

  const handleChange = ({ target }) => {
    const { name, value } = target;
    setUser((currentUser) => ({
      ...currentUser,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    const API_URL = process.env.REACT_APP_API_URL || "https://ethical-benefit-bb8bd25123.strapiapp.com";
    const url = `${API_URL}/api/auth/local`;
    try {
      if (user.identifier && user.password) {
        const { data } = await axios.post(url, user);
        if (data.jwt) {
          storeUser(data);
          toast.success("Logged in successfully!", {
            hideProgressBar: true,
          });
          setUser(initialUser);
          navigate("/dashboard");
          window.location.reload();
        }
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage, {
        hideProgressBar: true,
      });
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <div>
          <h2>Login:</h2>
          <FormGroup>
            <Input
              type="email"
              name="identifier"
              value={user.identifier}
              onChange={handleChange}
              placeholder="Enter your email"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                marginBottom: "1rem",
                fontSize: "1rem",
              }}
            />
          </FormGroup>
          <FormGroup>
            <Input
              type="password"
              name="password"
              value={user.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
          </FormGroup>
          <button
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              backgroundColor: "#3182ce",
              color: "white",
              border: "none",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: "pointer",
              marginBottom: "1rem",
            }}
            onClick={handleLogin}
          >
            Login
          </button>
          <p style={{ fontSize: "0.875rem", color: "#4a5568" }}>
            Don't have an account?{" "}
            <Link
              to="/registration"
              style={{ color: "#3182ce", textDecoration: "none" }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  loginContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(135deg, #3182ce 0%, #805ad5 100%)`,
    padding: "1rem",
    fontFamily: "sans-serif",
  },
  loginCard: {
    background: "white",
    padding: "3rem 2rem",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "450px",
  },
};

export default Login;
