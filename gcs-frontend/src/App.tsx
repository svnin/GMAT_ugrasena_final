import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import MapComponent from './MapComponent.tsx';


// Interface untuk data sensor
interface SensorData {
  timestamp: number;
  temperature: number;
  voltage: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  altitude: number;
  altitudeDiff: number;
  latitude: number;
  longitude: number;
  launchStatus: number;
  errorCode: number;
  rawData: string;
}

// Komponen Chart (Component Pattern)
const ChartComponent: React.FC<{ title: string; data: any[]; dataKey: string; color: string }> = ({ title, data, dataKey, color }) => (
  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
    <h3 className="text-white text-sm font-semibold mb-2">{title}</h3>
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="time" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
        <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// Komponen Launch Status
const LaunchStatus: React.FC<{ status: number }> = ({ status }) => {
  const stages = [
    'Pre-Launch',
    'Ready to Launch',
    'Ascending',
    'Cruising',
    'Descending',
    'Landed'
  ];
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h3 className="text-white text-lg font-bold mb-4">Launch Status</h3>
      <div className="space-y-2">
        {stages.map((stage, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              idx < status ? 'bg-green-500 text-white' :
              idx === status ? 'bg-blue-500 text-white animate-pulse' :
              'bg-gray-600 text-gray-400'
            }`}>
              {idx + 1}
            </div>
            <span className={`${idx <= status ? 'text-white font-semibold' : 'text-gray-500'}`}>
              {stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Komponen Error Status
const ErrorStatus: React.FC<{ errorCode: number }> = ({ errorCode }) => {
  const errorMessages: { [key: number]: string } = {
    0: 'No Error',
    1: 'Container descent rate failure',
    2: 'Science Payload descent rate failure',
    3: 'Container position failure',
    4: 'Science Payload position failure',
    5: 'Release failure'
  };
  
  return (
    <div className={`p-4 rounded-lg border ${errorCode > 0 ? 'bg-red-900/30 border-red-500' : 'bg-green-900/30 border-green-500'}`}>
      <div className="flex items-center gap-2">
        {errorCode > 0 ? (
          <AlertTriangle className="text-red-500" size={20} />
        ) : (
          <Activity className="text-green-500" size={20} />
        )}
        <span className={`font-semibold ${errorCode > 0 ? 'text-red-400' : 'text-green-400'}`}>
          {errorMessages[errorCode] || 'Unknown Error'}
        </span>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  const [connected, setConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [chartData, setChartData] = useState<{ [key: string]: any[] }>({
    temperature: [],
    voltage: [],
    gyroX: [],
    gyroY: [],
    gyroZ: [],
    altitude: [],
    altitudeDiff: [],
  });
  const [rawDataLog, setRawDataLog] = useState<string[]>([]);

  useEffect(() => {
    // Koneksi WebSocket ke backend
    const ws = new WebSocket('ws://localhost:8080/ws');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data: SensorData = JSON.parse(event.data);
      setSensorData(data);
      
      // Update chart data (simpan 50 data terakhir)
      const time = new Date(data.timestamp * 1000).toLocaleTimeString();
      
      setChartData(prev => ({
        temperature: [...prev.temperature.slice(-49), { time, value: data.temperature }],
        voltage: [...prev.voltage.slice(-49), { time, value: data.voltage }],
        gyroX: [...prev.gyroX.slice(-49), { time, value: data.gyroX }],
        gyroY: [...prev.gyroY.slice(-49), { time, value: data.gyroY }],
        gyroZ: [...prev.gyroZ.slice(-49), { time, value: data.gyroZ }],
        altitude: [...prev.altitude.slice(-49), { time, value: data.altitude }],
        altitudeDiff: [...prev.altitudeDiff.slice(-49), { time, value: data.altitudeDiff }],
      }));
      
      // Update raw data log (simpan 10 terakhir)
      setRawDataLog(prev => [data.rawData, ...prev.slice(0, 9)]);
    };
    
    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-white">Ground Control Station</h1>
          <p className="text-gray-400">Gadjah Mada Aerospace Team</p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <Wifi className="text-green-500" size={24} />
              <span className="text-green-500 font-semibold">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="text-red-500" size={24} />
              <span className="text-red-500 font-semibold">Disconnected</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar - Team Data */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-white text-lg font-bold mb-4">Team Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Team Name</p>
                <p className="text-white font-semibold">GMAT 2025</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Mission</p>
                <p className="text-white font-semibold">CanSat Launch</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Location</p>
                <p className="text-white font-semibold">Semarang, Indonesia</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Operator</p>
                <p className="text-white font-semibold">GCS Operator</p>
              </div>
            </div>
          </div>
          
          <LaunchStatus status={sensorData?.launchStatus || 0} />
          
          {sensorData && <ErrorStatus errorCode={sensorData.errorCode} />}
        </div>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {/* Live Data Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Altitude</p>
              <p className="text-2xl font-bold text-blue-400">{sensorData?.altitude.toFixed(2) || '0.00'} m</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Temperature</p>
              <p className="text-2xl font-bold text-orange-400">{sensorData?.temperature.toFixed(1) || '0.0'} °C</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Voltage</p>
              <p className="text-2xl font-bold text-green-400">{sensorData?.voltage.toFixed(2) || '0.00'} V</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">GPS Status</p>
              <p className="text-2xl font-bold text-purple-400">LOCKED</p>
            </div>
          </div>

          {/* Charts Grid - 8 Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartComponent title="Temperature (°C)" data={chartData.temperature} dataKey="value" color="#FB923C" />
            <ChartComponent title="Voltage (V)" data={chartData.voltage} dataKey="value" color="#4ADE80" />
            <ChartComponent title="Gyro X (°/s)" data={chartData.gyroX} dataKey="value" color="#60A5FA" />
            <ChartComponent title="Gyro Y (°/s)" data={chartData.gyroY} dataKey="value" color="#A78BFA" />
            <ChartComponent title="Gyro Z (°/s)" data={chartData.gyroZ} dataKey="value" color="#F472B6" />
            <ChartComponent title="Altitude (m)" data={chartData.altitude} dataKey="value" color="#22D3EE" />
            <ChartComponent title="Altitude Difference (m/s)" data={chartData.altitudeDiff} dataKey="value" color="#FBBF24" />
            <ChartComponent title="Altitude (Duplicate)" data={chartData.altitude} dataKey="value" color="#34D399" />
          </div>

          
          {/* Map with Moving Marker */}
{sensorData && (
  <MapComponent 
    latitude={sensorData.latitude} 
    longitude={sensorData.longitude}
    altitude={sensorData.altitude}
  />
)}

          {/* Raw Data Log */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-white text-lg font-bold mb-4">Raw Data Stream</h3>
            <div className="bg-black p-4 rounded font-mono text-sm text-green-400 h-48 overflow-y-auto">
              {rawDataLog.map((log, idx) => (
                <div key={idx} className="mb-1">{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}