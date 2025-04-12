from flask import Flask, request, send_file, Response, jsonify, send_from_directory
from flask_cors import CORS
from gtts import gTTS
import io
import os

app = Flask(__name__, static_folder='static')
CORS(app)

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

@app.route('/')
def serve_index():
    return send_from_directory('./', 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)