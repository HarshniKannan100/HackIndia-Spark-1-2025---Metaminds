import React, { useEffect, useRef } from "react";

const HereMap = ({ fishermanLocation, riskZones }) => {
  const mapRef = useRef(null);
  const platformRef = useRef(null);
  const uiRef = useRef(null);

  useEffect(() => {
    if (!fishermanLocation || !fishermanLocation.latitude || !fishermanLocation.longitude) {
      console.error("❌ Fisherman location is undefined!");
      return;
    }

    console.log("🚣 Fisherman Location:", fishermanLocation);

    if (!platformRef.current) {
      platformRef.current = new window.H.service.Platform({
        apikey: "wzJuFFxZHO-LUBJC4odsk7UGv1gwzna1GTH_jzcpDzk",
      });
    }

    const defaultLayers = platformRef.current.createDefaultLayers();
    const mapContainer = document.getElementById("mapContainer");

    if (!mapContainer) {
      console.error("❌ Map container not found.");
      return;
    }

    // **Create the map only once**
    if (!mapRef.current) {
      console.log("🆕 Creating new map instance...");
      mapRef.current = new window.H.Map(
        mapContainer,
        defaultLayers.vector.normal.map,
        {
          center: { lat: fishermanLocation.latitude, lng: fishermanLocation.longitude },
          zoom: 7,
        }
      );

      new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(mapRef.current));
      uiRef.current = window.H.ui.UI.createDefault(mapRef.current, defaultLayers);
    }

    // **Ensure previous markers are removed**
    mapRef.current.removeObjects(mapRef.current.getObjects());

    // **Add Marker Function**
    function addMarker(lat, lng, label) {
      if (!lat || !lng) {
        console.error(`❌ Invalid marker location: ${label}`);
        return;
      }
      console.log(`✅ Adding marker: ${label} at (${lat}, ${lng})`);

      const marker = new window.H.map.Marker({ lat, lng });
      mapRef.current.addObject(marker);
    }

    // **Adding Fisherman Marker**
    addMarker(
      fishermanLocation.latitude,
      fishermanLocation.longitude,
      "🚣 Fisherman"
    );

    console.log("🎯 Fisherman marker added!");

  }, [fishermanLocation, riskZones]);

  return <div id="mapContainer" style={{ width: "100%", height: "500px", border: "1px solid black" }}></div>;
};

export default HereMap;
