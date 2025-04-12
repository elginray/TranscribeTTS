from flask import Flask, request, send_file, Response, jsonify
from flask_cors import CORS  # <-- Import CORS
from gtts import gTTS
import io

app = Flask(__name__)
CORS(app) # <-- Add this line to enable CORS for all origins by default

# --- Your existing @app.route('/tts') function ---
@app.route('/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        text_to_speak = data.get('text')

        if not text_to_speak:
            return jsonify({"error": "No text provided"}), 400

        mp3_fp = io.BytesIO()
        tts = gTTS(text=text_to_speak, lang='en')
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)

        return send_file(
            mp3_fp,
            mimetype='audio/mpeg',
            as_attachment=False
        )

    except Exception as e:
        print(f"Error during TTS generation: {e}")
        return jsonify({"error": "Failed to generate speech"}), 500
# --- End of your existing function ---


if __name__ == '__main__':
    # Make sure host is '0.0.0.0' or '127.0.0.1' and port is 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
