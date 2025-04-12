// --- Get Preset Elements ---
const presetsSection = document.getElementById('presetsSection');
const togglePresetsButton = document.getElementById('togglePresetsButton');
const presetsContent = document.getElementById('presetsContent');
const customPresetInput = document.getElementById('customPresetInput');
const addPresetButton = document.getElementById('addPresetButton');

// --- Preset Functionality ---

// Function to handle clicking any preset button
function handlePresetClick(event) {
    if (event.target.classList.contains('preset-button')) {
        userInput.value = event.target.textContent; // Set input field value
        userInput.focus(); // Optional: focus the input field
        // Optional: Collapse presets after clicking one
        // if (!presetsContent.classList.contains('presets-hidden')) {
        //     togglePresets();
        // }
    }
}

// Function to add a new preset button dynamically
function addNewPresetButton(text) {
    const newButton = document.createElement('button');
    newButton.classList.add('preset-button');
    newButton.textContent = text;

    // Insert the new button before the <hr> separator
    const separator = presetsContent.querySelector('hr');
    if (separator) {
        presetsContent.insertBefore(newButton, separator);
    } else {
        // Fallback if separator isn't found (e.g., add before custom area)
        const customArea = document.getElementById('customPresetArea');
        presetsContent.insertBefore(newButton, customArea);
    }
}

// Function to toggle preset visibility
function togglePresets() {
    presetsContent.classList.toggle('presets-hidden');
    // REMOVE OR COMMENT OUT THIS LINE:
    // togglePresetsButton.textContent = isHidden ? 'Presets ▼' : 'Presets ▲';
}


// --- Preset Event Listeners ---

// Toggle visibility when the main button is clicked
togglePresetsButton.addEventListener('click', togglePresets);

// Use event delegation for preset buttons (handles existing and new ones)
presetsContent.addEventListener('click', handlePresetClick);

// Add custom preset button click
addPresetButton.addEventListener('click', () => {
    const text = customPresetInput.value.trim();
    if (text) {
        addNewPresetButton(text);
        customPresetInput.value = ''; // Clear the input
        // Optional: Save custom presets to localStorage here if needed
    } else {
        alert("Please enter text for the custom preset.");
    }
});


const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const listenButton = document.getElementById('listenButton'); // Get the listen button
const statusDiv = document.getElementById('status'); // Get the status div

// --- Text-to-Speech (Using Backend) ---
function speakText(text) {
    // Optional: Stop any currently playing audio from previous requests
    const existingAudio = document.getElementById('tts-audio');
    if (existingAudio) {
        existingAudio.pause();
        document.body.removeChild(existingAudio); // Remove old element
    }

    // Show some indicator that audio is loading (optional)
    // statusDiv.textContent = "Generating speech...";
    // ... (optional cleanup code) ...
    // Change this line:
    // fetch('http://127.0.0.1:5000/tts', { ... })
    // to:

    fetch('/api/tts', { // <-- Use the relative path for Vercel
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }),
    })
    .then(response => {
        if (!response.ok) {
            // Handle HTTP errors (like 400 or 500 from Flask)
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob(); // Get the audio data as a Blob
    })
    .then(audioBlob => {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.id = 'tts-audio'; // Assign an ID for potential future control

        // Optional: Clean up the object URL once the audio finishes playing
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            // statusDiv.textContent = ""; // Clear loading status
            // Remove the audio element from the DOM if you want
             if (audio.parentNode) {
                 audio.parentNode.removeChild(audio);
             }
        };
         // Optional: Handle playback errors
         audio.onerror = (e) => {
            console.error("Error playing audio:", e);
            alert("Error playing generated speech.");
            URL.revokeObjectURL(audioUrl); // Clean up URL on error too
            // statusDiv.textContent = "Error playing audio.";
             if (audio.parentNode) {
                 audio.parentNode.removeChild(audio);
             }
        };

        // Append to body to ensure it's part of the document (needed for some browsers/autoplay policies)
        // You could hide it with CSS if you don't want controls visible
        // audio.style.display = 'none';
        // document.body.appendChild(audio); // Temporarily add to DOM

        audio.play();
        // statusDiv.textContent = ""; // Clear loading status immediately if preferred
    })
    .catch(error => {
        console.error('Error fetching or playing TTS audio:', error);
        // Update the error message slightly for deployed context
        alert('Failed to get or play speech. Is the API deployed correctly?');
        // statusDiv.textContent = "Failed to generate speech.";
    });
}


// --- Speech Recognition ---
// Check for browser support (prefixed for Chrome/Edge)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false; // Listen for a single utterance
    recognition.lang = 'en-US'; // Set language - change if needed
    recognition.interimResults = false; // We only want the final result
    recognition.maxAlternatives = 1; // Get only the most likely result

    recognition.onstart = () => {
        statusDiv.textContent = "Listening...";
        listenButton.disabled = true; // Disable button while listening
        listenButton.textContent = "Listening...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        if (transcript) {
            addMessage(transcript, true); // Add transcribed speech as incoming
        }
    };

    recognition.onerror = (event) => {
        statusDiv.textContent = `Error occurred in recognition: ${event.error}`;
        console.error("Speech recognition error:", event);
    };

    recognition.onend = () => {
        statusDiv.textContent = ""; // Clear status
        listenButton.disabled = false; // Re-enable button
        listenButton.textContent = "🎤 Listen to Other Person";
    };

} else {
    statusDiv.textContent = "Sorry, your browser doesn't support Speech Recognition.";
    listenButton.disabled = true;
    listenButton.style.display = 'none'; // Hide the button if not supported
}


// --- Add Message to Chatbox ---
function addMessage(text, isIncoming) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message');
    messageBubble.textContent = text;

    if (isIncoming) {
        // Incoming message (Transcribed Speech) - Align Left
        messageContainer.classList.add('message-container-incoming');
        messageBubble.classList.add('message-incoming');
        messageContainer.appendChild(messageBubble); // Just the bubble
    } else {
        // Outgoing message (Your Typed Text) - Align Right
        messageContainer.classList.add('message-container-outgoing');
        messageBubble.classList.add('message-outgoing');

        // Create TTS button for YOUR outgoing messages
        const ttsButton = document.createElement('button');
        ttsButton.textContent = '🔊 Play Your Message';
        ttsButton.classList.add('tts-button');
        ttsButton.onclick = () => speakText(text); // Play this specific message

        messageContainer.appendChild(messageBubble);
        messageContainer.appendChild(ttsButton); // Add button after your bubble
    }

    chatbox.appendChild(messageContainer);
    chatbox.scrollTop = chatbox.scrollHeight; // Scroll to bottom
}

// --- Event Listeners ---

// Send button click (Your text)
sendButton.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (text) {
        addMessage(text, false); // Add your message (outgoing) with TTS button
        userInput.value = ''; // Clear input

        // --- Add this line ---
        speakText(text); // Immediately speak the text after sending
        // --------------------
    }
});

// Send on Enter key press (No changes needed here, as it just triggers the click)
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendButton.click(); // This will now run the updated click handler above
    }
});

// Listen button click (Other person's speech)
listenButton.addEventListener('click', () => {
    if (recognition) {
        try {
            recognition.start(); // Start listening
        } catch (error) {
            // Handle cases where it might already be running (though continuous=false makes this less likely)
            console.error("Error starting recognition:", error);
            statusDiv.textContent = "Could not start listening. Please try again.";
             // Ensure button is reset if start fails immediately
            listenButton.disabled = false;
            listenButton.textContent = "🎤 Listen to Other Person";
        }
    } else {
        alert("Speech Recognition is not supported in this browser.");
    }
});

// --- Initial Example Message (Optional) ---
addMessage("Type your message below, then click 'Send'. Click the 'Play' button under your message to speak it. Click 'Listen' for the other person.", true); // Initial instruction

