import "react";
import { Box, Typography } from "@mui/material";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue in Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function LocationMinimap({ latitude, longitude, height = 200 }) {
  if (latitude == null || longitude == null) return null;

  const position = [latitude, longitude];

  return (
    <Box>
      <Box
        sx={{
          height,
          width: "100%",
          borderRadius: 1,
          overflow: "hidden",
          mb: 1,
        }}
      >
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          dragging={true}
          zoomControl={true}
          doubleClickZoom={true}
          touchZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <Marker position={position} />
        </MapContainer>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </Typography>
    </Box>
  );
}
