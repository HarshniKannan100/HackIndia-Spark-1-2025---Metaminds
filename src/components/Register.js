import React, { useState } from 'react';
import axios from 'axios';

function Register() {
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    const data = {
      username,
      phone_number: phoneNumber,
    };

    try {
      const response = await axios.post('http://127.0.0.1:5001/register', data);
      alert(response.data.message);  // Display success message
    } catch (error) {
      console.error("Error during registration", error);
      alert(error.response?.data?.error || "Error during registration");
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
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
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
