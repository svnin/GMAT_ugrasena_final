package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

// Struct untuk data sensor yang dikirim ke frontend
type SensorData struct {
	Timestamp    int64   `json:"timestamp"`
	Temperature  float64 `json:"temperature"`
	Voltage      float64 `json:"voltage"`
	GyroX        float64 `json:"gyroX"`
	GyroY        float64 `json:"gyroY"`
	GyroZ        float64 `json:"gyroZ"`
	Altitude     float64 `json:"altitude"`
	AltitudeDiff float64 `json:"altitudeDiff"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	LaunchStatus int     `json:"launchStatus"`
	ErrorCode    int     `json:"errorCode"`
	RawData      string  `json:"rawData"`
}

// WebSocket upgrader - untuk upgrade HTTP connection ke WebSocket
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins (untuk development)
	},
}

// Global variables untuk simulasi data
var (
	currentAltitude  = 0.0
	currentLat       = -7.7714  // Koordinat Semarang
	currentLon       = 110.3775 // Koordinat Semarang
	launchStatus     = 0
	previousAltitude = 0.0
)

// generateSensorData - Function untuk generate random sensor data
func generateSensorData() SensorData {
	now := time.Now().Unix()

	// Simulasi launch sequence (progressively advance)
	if launchStatus < 6 && rand.Float64() < 0.05 {
		launchStatus++
	}

	// Simulasi altitude - naik saat launching, turun saat descending
	if launchStatus >= 2 && launchStatus < 5 {
		// Ascending & Cruising - altitude naik
		currentAltitude += rand.Float64() * 50
	} else if launchStatus >= 5 {
		// Descending - altitude turun
		currentAltitude -= rand.Float64() * 30
		if currentAltitude < 0 {
			currentAltitude = 0
		}
	}

	// Calculate altitude difference (rate of change)
	altitudeDiff := currentAltitude - previousAltitude
	previousAltitude = currentAltitude

	// Simulasi pergerakan GPS (slight movement)
	currentLat += (rand.Float64() - 0.5) * 0.001
	currentLon += (rand.Float64() - 0.5) * 0.001

	// Random error code (0 = no error, 1-5 = different errors)
	errorCode := 0
	if rand.Float64() < 0.1 { // 10% chance of error
		errorCode = rand.Intn(5) + 1
	}

	// Create sensor data object
	data := SensorData{
		Timestamp:    now,
		Temperature:  20 + rand.Float64()*15,        // 20-35°C
		Voltage:      11.1 + rand.Float64()*1.5,     // 11.1-12.6V
		GyroX:        (rand.Float64() - 0.5) * 360,  // -180 to 180 degrees
		GyroY:        (rand.Float64() - 0.5) * 360,  // -180 to 180 degrees
		GyroZ:        (rand.Float64() - 0.5) * 360,  // -180 to 180 degrees
		Altitude:     currentAltitude,
		AltitudeDiff: altitudeDiff,
		Latitude:     currentLat,
		Longitude:    currentLon,
		LaunchStatus: launchStatus,
		ErrorCode:    errorCode,
		RawData:      fmt.Sprintf("RAW|%d|%.2f|%.2f|%.2f|%.2f", now, currentAltitude, currentLat, currentLon, rand.Float64()*100),
	}

	return data
}

// handleWebSocket - Handler untuk WebSocket connections
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection ke WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	log.Println("Client connected!")

	// Ticker untuk kirim data setiap 500ms
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	// Loop untuk terus kirim data
	for {
		select {
		case <-ticker.C:
			// Generate data baru
			data := generateSensorData()

			// Kirim data ke client dalam format JSON
			err := conn.WriteJSON(data)
			if err != nil {
				log.Println("Write error:", err)
				return
			}

			// Log data yang dikirim (optional, untuk debugging)
			log.Printf("Sent: Alt=%.2f Status=%d Error=%d", data.Altitude, data.LaunchStatus, data.ErrorCode)
		}
	}
}

// main - Entry point aplikasi
func main() {
	// Set random seed
	rand.Seed(time.Now().UnixNano())

	// Register WebSocket handler
	http.HandleFunc("/ws", handleWebSocket)

	// Start server
	log.Println("🚀 WebSocket server starting on :8080")
	log.Println("📡 Waiting for frontend connection...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}