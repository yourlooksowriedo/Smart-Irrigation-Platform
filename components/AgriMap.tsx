
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Coordinate } from '../types';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface AgriMapProps {
  points: Coordinate[];
  onPointAdd: (coord: Coordinate) => void;
  isRecording: boolean;
}

const LocationMarker = ({ onLocationFound }: { onLocationFound: (pos: Coordinate) => void }) => {
  const map = useMapEvents({
    locationfound(e) {
      onLocationFound({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
    click(e) {
      onLocationFound({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  return null;
};

const AgriMap: React.FC<AgriMapProps> = ({ points, onPointAdd, isRecording }) => {
  const [center] = useState<[number, number]>([13.7367, 100.5231]); // Bangkok default

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-inner border-2 border-slate-200">
      <MapContainer center={center} zoom={15} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationFound={onPointAdd} />
        {points.length > 0 && (
          <>
            <Polygon positions={points.map(p => [p.lat, p.lng])} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.3 }} />
            {points.map((p, idx) => (
              <Marker key={idx} position={[p.lat, p.lng]} />
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default AgriMap;
