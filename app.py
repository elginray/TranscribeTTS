from flask import Flask, request, send_file, Response, jsonify, send_from_directory
from flask_cors import CORS
from gtts import gTTS
import io
import os
import psutil  # <--- Add this

app = Flask(__name__, static_folder='static')
CORS(app)

def log_resource_usage():
    process = psutil.Process(os.getpid())
    rss_mb = process.memory_info().rss / 1024 ** 2
    total_mem_mb = psutil.virtual_memory().total / 1024 ** 2
    mem_percent = (rss_mb / total_mem_mb) * 100
    cpu_percent = process.cpu_percent(interval=0.1)
    cpu_times = process.cpu_times()
    num_cores = psutil.cpu_count(logical=True)
    core_equivalent = (cpu_percent / 100) * num_cores
    freq = psutil.cpu_freq()

    print(f"[Resource Usage] Memory: {rss_mb:.2f} MB / {total_mem_mb:.2f} MB "
          f"({mem_percent:.2f}%), CPU: {cpu_percent:.2f}% (~{core_equivalent:.2f} cores)")
    print(f"[CPU Time] User: {cpu_times.user:.2f}s, System: {cpu_times.system:.2f}s")
    if freq:
        print(f"[CPU Info] Frequency: {freq.current:.2f} MHz "
              f"(min: {freq.min:.2f}, max: {freq.max:.2f})")

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

        # Log memory and CPU usage after the processing
        log_resource_usage()

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
