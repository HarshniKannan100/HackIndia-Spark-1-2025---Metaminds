import React, { useState } from "react";
import HereMap from "./components/HereMap";
import Register from "./components/Register";
import Login from "./components/Login";  
import "./App.css";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(true); // Start with registration
  const [fishermanData, setFishermanData] = useState({
    latitude: 35.5,
    longitude: -165.0,
    hour: new Date().getHours(),
    month: new Date().getMonth() + 1,
  });

  const riskZones = [
    { latitude: 35.8, longitude: -165.5 }, 
    { latitude: 35.2, longitude: -164.5 }, 
  ];

  // Function to update location and time from HereMap.js
  const updateFishermanData = (newData) => {
    setFishermanData((prevData) => ({
      ...prevData,
      ...newData,
    }));
  };

  return (
    <div className="app">
      {isLoggedIn ? (
        <>
          {/* Navigation Bar */}
          <header className="navbar">
            <h1>TurtleScape</h1>
          </header>

          {/* Main Content: Status + Map */}
          <div className="main-content">
            {/* Left Panel: Status Info */}
            <div className="status-panel">
              <h2>📍 Fisherman Status</h2>
              <p>Location: {fishermanData.latitude}, {fishermanData.longitude}</p>
              <p>⏰ Time: {fishermanData.hour}:00</p>
              <p>📅 Month: {fishermanData.month}</p>
              <p>⚠️ Risk Level: High</p>
            </div>

            {/* Right Panel: Map */}
            <div className="map-container">
              <HereMap 
                fishermanLocation={fishermanData} 
                riskZones={riskZones} 
                updateFishermanData={updateFishermanData}
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="footer">
            <p>SOS</p>
          </footer>
        </>
      ) : (
        isRegistering ? (
          <Register />
        ) : (
          <Login setIsLoggedIn={setIsLoggedIn} />
        )
      )}

      {/* Button to toggle between Register & Login */}
      {!isLoggedIn && (
        <button onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? "Already have an account? Login" : "New here? Register"}
        </button>
      )}
    </div>
  );
};

export default App;
