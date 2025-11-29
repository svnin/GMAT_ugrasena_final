import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix untuk default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component untuk update posisi map ketika marker bergerak
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface MapComponentProps {
  latitude: number;
  longitude: number;
  altitude: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude, altitude }) => {
  const position: [number, number] = [latitude, longitude];

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h3 className="text-white text-lg font-bold mb-4">GPS Tracking Map</h3>
      <div className="h-64 rounded overflow-hidden">
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              <div className="text-sm">
                <strong>CanSat Position</strong>
                <br />
                Lat: {latitude.toFixed(6)}
                <br />
                Lon: {longitude.toFixed(6)}
                <br />
                Alt: {altitude.toFixed(2)} m
              </div>
            </Popup>
          </Marker>
          <ChangeView center={position} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapComponent;