import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet.heat";

type Alert = {
  type: string
  risk: string
  latitude: number
  longitude: number
  location: string
}

// Cyclone movement path
const cyclonePath = [
  [10.5, 88.2],
  [11.2, 87.9],
  [12.0, 87.0],
  [12.6, 86.3],
  [13.0, 85.5],
]

// Pulsing marker icon
const pulseIcon = L.divIcon({
  className: "",
  html: `<div class="pulse-marker"></div>`,
  iconSize: [20, 20],
})

// Heatmap layer
const HeatLayer = ({ alerts }: { alerts: Alert[] }) => {

  const map = useMap()

  useEffect(() => {

    if (!alerts.length) return

    const heatData = alerts.map(a => [a.latitude, a.longitude, 0.7])

    const heatLayer = (L as any).heatLayer(heatData, {
      radius: 35,
      blur: 25,
      maxZoom: 10
    })

    heatLayer.addTo(map)

    return () => {
      map.removeLayer(heatLayer)
    }

  }, [alerts, map])

  return null
}

const LiveDisasterMap = () => {

  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {

    const fetchAlerts = () => {

      axios
        .get("/api/alerts/live")
        .then((res) => {
          setAlerts(res.data.alerts || [])
        })
        .catch(() => {
          console.log("Failed to load alerts")
        })

    }

    fetchAlerts()

    const interval = setInterval(fetchAlerts, 10000)

    return () => clearInterval(interval)

  }, [])

  return (
    <MapContainer
      center={[13.0487, 80.0886]}
      zoom={6}
      className="h-[450px] rounded-xl w-full"
    >

      <TileLayer
        attribution="OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Heatmap */}
      <HeatLayer alerts={alerts.filter(a => a.latitude != null && a.longitude != null && !isNaN(a.latitude) && !isNaN(a.longitude))} />

      {/* Cyclone Path */}
      <Polyline
        positions={cyclonePath}
        pathOptions={{
          color: "cyan",
          weight: 4,
          dashArray: "10,10"
        }}
      />

      {/* Cyclone Eye */}
      <Marker position={cyclonePath[cyclonePath.length - 1] as [number, number]}>
        <Popup>
          🌪 Cyclone Eye <br />
          Predicted Path Toward Tamil Nadu
        </Popup>
      </Marker>

      {/* Clustered Disaster Alerts */}
      <MarkerClusterGroup>
        {alerts.filter(a => a.latitude != null && a.longitude != null && !isNaN(a.latitude) && !isNaN(a.longitude)).map((alert, index) => (
          <Marker
            key={index}
            position={[alert.latitude, alert.longitude]}
            icon={pulseIcon}
          >
            <Popup>
              <strong>{alert.type}</strong>
              <br />
              Location: {alert.location}
              <br />
              Risk Level: {alert.risk}
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

    </MapContainer>
  )
}

export default LiveDisasterMap