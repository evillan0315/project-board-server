#!/usr/bin/env python3
import json
import sys
from faster_whisper import WhisperModel

def transcribe_audio(file_path, model_size="tiny", device="cpu", compute_type="int8"):
    try:
        # Load the model
        model = WhisperModel(model_size, device=device, compute_type=compute_type)
        
        # Transcribe the audio
        segments, info = model.transcribe(file_path)
        
        # Convert to serializable format
        result = {
            "segments": [],
            "fullText": "",
            "duration": 0,
            "language": info.language,
            "language_probability": info.language_probability
        }
        
        full_text = ""
        for segment in segments:
            segment_data = {
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip(),
                "confidence": getattr(segment, 'confidence', 0.8)  # faster-whisper doesn't provide confidence by default
            }
            result["segments"].append(segment_data)
            full_text += segment.text + " "
        
        result["fullText"] = full_text.strip()
        
        # Calculate duration from last segment
        if result["segments"]:
            result["duration"] = result["segments"][-1]["end"]
        
        return result
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python transcribe.py <audio_file_path>"}))
        sys.exit(1)
    
    audio_file = sys.argv[1]
    result = transcribe_audio(audio_file)
    print(json.dumps(result))
