import React, { useState } from "react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const userData = {
      username: username,
      phone: phone,
    };

    try {
      const response = await fetch("http://localhost:5001/login", { // ✅ Fixed API URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Success: ${data.message}. OTP: ${data.otp}`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;
