// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAG0G-NDdTzYoaQ4aZpqUDRQ-aouKJ3WOE",
    authDomain: "atyourservice-376fd.firebaseapp.com",
    databaseURL: "https://atyourservice-376fd-default-rtdb.firebaseio.com",
    projectId: "atyourservice-376fd",
    storageBucket: "atyourservice-376fd.firebasestorage.app",
    messagingSenderId: "175403012924",
    appId: "1:175403012924:web:bb58d415794da512460439",
    measurementId: "G-Y1KPJG4QQQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let userLocation;
let map;
let marker;
let locationId;

// Initialize map
function initMap() {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Get user's location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Center map on user location
                map.setView([userLocation.lat, userLocation.lng], 15);
                
                // Add marker
                if (marker) {
                    marker.remove();
                }
                marker = L.marker([userLocation.lat, userLocation.lng]).addTo(map);
                
                // Generate location ID based on coordinates
                locationId = `${Math.round(userLocation.lat * 1000)}_${Math.round(userLocation.lng * 1000)}`;
                
                // Check initial status
                checkLocationStatus();
            },
            error => {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please enable location services.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Check location status
function checkLocationStatus() {
    db.ref(`locations/${locationId}`).on('value', snapshot => {
        const data = snapshot.val() || { status: 'in-service' };
        updateStatusDisplay(data.status);
    });
}

// Update status display
function updateStatusDisplay(status) {
    const statusDiv = document.getElementById('current-status');
    statusDiv.textContent = `Current Status: ${status}`;
    statusDiv.className = status === 'in-service' ? 'in-service' : 'out-of-service';
}

// Toggle service status
function toggleStatus() {
    if (!locationId) return;
    
    db.ref(`locations/${locationId}`).once('value', snapshot => {
        const currentData = snapshot.val() || { status: 'in-service' };
        const newStatus = currentData.status === 'in-service' ? 'out-of-service' : 'in-service';
        
        db.ref(`locations/${locationId}`).set({
            status: newStatus,
            lastUpdated: new Date().toISOString()
        });
    });
}

// Subscribe to notifications
function subscribeToNotifications() {
    if (!('Notification' in window)) {
        alert('This browser does not support notifications');
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            alert('You will now receive notifications when the status changes');
            // Set up notification listener
            db.ref(`locations/${locationId}`).on('value', snapshot => {
                const data = snapshot.val();
                if (data) {
                    new Notification('Location Status Update', {
                        body: `Status changed to: ${data.status}`
                    });
                }
            });
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    getUserLocation();
    
    document.getElementById('toggle-status').addEventListener('click', toggleStatus);
    document.getElementById('subscribe').addEventListener('click', subscribeToNotifications);
}); 