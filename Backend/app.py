from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy # type: ignore
from flask_migrate import Migrate
import joblib
import numpy as np
import requests
from twilio.rest import Client
import os

# Initialize Flask app
app = Flask(__name__)
print("Flask app starting...")

# Set up PostgreSQL URI
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:root@localhost/datatable'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# User model for PostgreSQL
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=False)

    def __repr__(self):
        return f"<User {self.username}>"

# Initialize migrations
migrate = Migrate(app, db)

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# Load model
try:
    model = joblib.load("turtle_risk_model2.pkl")
    print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")

# Create tables (inside the application context)
with app.app_context():
    db.create_all()  # This will create all the tables

# Twilio SMS function
def send_alert(phone_number, message):
    """Send SMS alert via Twilio and return success status."""
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(body=message, from_=TWILIO_PHONE_NUMBER, to=phone_number)
        return True
    except Exception as e:
        print("Twilio error:", e)
        return False

# Helper functions for weather data
def get_sea_surface_temp(lat, lon):
    """Fetch sea surface temperature from NOAA ERDDAP API."""
    url = f"https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.json?analysed_sst[(latest)][({lat})][({lon})]"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        return data['table']['rows'][0][3] if data['table']['rows'] else None
    except (requests.exceptions.RequestException, IndexError, KeyError) as e:
        print("Error fetching SST:", e)
        return None

def get_wave_height(lat, lon):
    """Fetch real-time wave height from NOAA ERDDAP API."""
    url = f"https://coastwatch.pfeg.noaa.gov/erddap/griddap/NOAA_NDBC_WAVE.json?sea_surface_wave_significant_height[(latest)][({lat})][({lon})]"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        return data['table']['rows'][0][3] if data['table']['rows'] else None
    except (requests.exceptions.RequestException, IndexError, KeyError) as e:
        print("Error fetching wave height:", e)
        return None

# Routes for registration and login
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    print("Received data:", data)  # Debugging line
    username = data.get('username')
    phone_number = data.get('phone_number')

    if not username or not phone_number:
        return jsonify({"error": "Username and phone number are required"}), 400

    # Check if the username or phone number already exists
    existing_user = User.query.filter((User.username == username) | (User.phone_number == phone_number)).first()
    if existing_user:
        print(f"User already exists: {existing_user}")  # Debugging line
        return jsonify({"error": "Username or phone number already exists"}), 400

    new_user = User(username=username, phone_number=phone_number)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@app.route('/login', methods=['POST'])
def login():
    """API to login a user."""
    data = request.get_json()
    username = data.get('username')
    phone_number = data.get('phone_number')

    if not username or not phone_number:
        return jsonify({"error": "Username and phone number are required"}), 400

    user = User.query.filter_by(username=username, phone_number=phone_number).first()

    if user:
        return jsonify({"message": f"Welcome back, {username}!"}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/predict', methods=['POST'])
def predict():
    """API endpoint to predict risk based on GPS coordinates."""
    data = request.get_json()
    lat, lon, input_sst, phone_number = data.get('latitude'), data.get('longitude'), data.get('sst'), data.get('phone_number')
    
    if lat is None or lon is None:
        return jsonify({'error': 'Latitude and Longitude are required'}), 400
    
    # If SST from frontend is above 28, return Low Risk directly
    if input_sst is not None and input_sst > 28:
        message = "Low Risk: The sea temperature is above 28°C. Safe to fish."
        if phone_number and send_alert(phone_number, message):
            print("SMS sent successfully.")
        return jsonify({'latitude': lat, 'longitude': lon, 'SST': input_sst, 'wave_height': None, 'risk': "Low Risk"}), 200
    
    # Get SST Data
    sst = get_sea_surface_temp(lat, lon)
    
    # Get Wave Height Data
    wave_height = get_wave_height(lat, lon)
    
    # Ensure model is loaded
    if model is None:
        return jsonify({"error": "AI model is unavailable"}), 500
    
    # Prepare input for model prediction
    model_input = np.array([[lat, lon, sst if sst is not None else 0, wave_height if wave_height is not None else 0]])
    
    try:
        risk_prediction = model.predict(model_input)[0]
    except Exception as e:
        print("Model prediction error:", e)
        return jsonify({"error": "Prediction failed"}), 500
    
    risk_labels = {0: "Low Risk", 1: "Moderate Risk", 2: "High Risk"}
    risk_prediction_label = risk_labels.get(risk_prediction, "Unknown Risk")
    
    # Send SMS Alert based on risk level
    if phone_number:
        if risk_prediction_label == "Moderate Risk":
            send_alert(phone_number, "Moderate Risk: Beware of sea turtles in the area.")
        elif risk_prediction_label == "High Risk":
            send_alert(phone_number, "High Risk: Avoid fishing in this area due to turtle presence.")
    
    return jsonify({'latitude': lat, 'longitude': lon, 'SST': sst, 'wave_height': wave_height, 'risk': risk_prediction_label})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
