from flask import Flask, request, jsonify, redirect, url_for
from flask_cors import CORS
import google.oauth2.id_token
from google.auth.transport import requests
import requests as r

app = Flask(__name__)
CORS(app)

# Replace with your actual Client ID from Google Cloud Console
CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'

@app.route('/api/google_login', methods=['POST'])
def google_login():
    token = request.json.get('token')

    try:
        # Verify the token
        idinfo = google.oauth2.id_token.verify_token(token, requests.Request(), CLIENT_ID)

        # Check if the issuer is Google
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        # Get user info
        user_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo['name']

        # Here, you would typically check if the user exists in your database
        # and create a new user if they don't.

        # For this example, we'll just return the user info.
        user_data = {
            'user_id': user_id,
            'email': email,
            'name': name
        }

        return jsonify({'message': 'Login successful!', 'user': user_data}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
