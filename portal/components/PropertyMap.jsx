'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to smoothly pan the map when search updates the coordinates
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
}

// Component to handle map click events
// Inside your LocationMarker component in PropertyMap.jsx
function LocationMarker({ latitude, longitude, setCoordinates, onAddressReverseGeocode }) {
  useMapEvents({
    async click(e) {
      const lat = e?.latlng?.lat || e?.lat;
      const lng = e?.latlng?.lng || e?.lng;

      if (!lat || !lng) return;

      // Update coordinates instantly on the UI
      setCoordinates(lat, lng);

      try {
        const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`);
        
        // If rate-limited, fail gracefully without breaking the app
        if (res.status === 429) {
          console.warn('Nominatim rate-limited (429). Please wait a second before clicking again.');
          return;
        }

        if (!res.ok) return;
        
        const data = await res.json();
        if (data && data.display_name) {
          onAddressReverseGeocode(data.display_name);
        }
      } catch (err) {
        console.error('Reverse geocoding error:', err);
      }
    },
  });

  return latitude && longitude ? <Marker position={[latitude, longitude]} /> : null;
}

export default function PropertyMap({ latitude, longitude, setCoordinates, onAddressReverseGeocode }) {
  // Default center: Manila, Philippines
  const defaultCenter = [14.5995, 120.9842];
  const position = latitude && longitude ? [latitude, longitude] : defaultCenter;

  return (
    <div className="w-full h-72 rounded-md overflow-hidden border border-gray-300 relative z-0">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true} // Enabled mouse wheel scrolling
        zoomControl={false}   // Disabled default top-left control so we can position it cleanly
        style={{ width: '100%', height: '100%' }}
      >
        {/* Esri Light Gray Canvas Base */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />
        {/* Esri Light Gray Reference Layer */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />
        {/* Moved zoom controls to top-right */}
        <ZoomControl position="topright" />
        <MapController center={position} />
        <LocationMarker
          latitude={latitude}
          longitude={longitude}
          setCoordinates={setCoordinates}
          onAddressReverseGeocode={onAddressReverseGeocode}
        />
      </MapContainer>
    </div>
  );
}