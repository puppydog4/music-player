// web/static/js/main.js

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const searchResultsDiv = document.getElementById("searchResults");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const audioPlayer = document.getElementById("audioPlayer");
const playerStatus = document.getElementById("playerStatus");

// New DOM Elements for Track Selection
const trackSelectionContainer = document.getElementById(
  "trackSelectionContainer"
);
const currentAlbumTitle = document.getElementById("currentAlbumTitle");
const trackSelect = document.getElementById("trackSelect");
const playSelectedTrackButton = document.getElementById(
  "playSelectedTrackButton"
);

// API Configuration
const API_BASE_URL = "http://localhost:8080"; // Your Go backend (serving this frontend and Prowlarr search)

// IMPORTANT: REPLACE THIS PLACEHOLDER with the actual public URL of your deployed EC2 seed server.
// You get this from your Terraform outputs (e.g., 'http://ec2-xx-xx-xx-xx.compute-1.amazonaws.com:8081').
const WEBTORRENT_BACKEND_URL =
  "http://ec2-18-133-221-204.eu-west-2.compute.amazonaws.com:8081";

const SEARCH_ENDPOINT = "/api/v1/search";

let currentTorrentInfo = null; // Stores torrent metadata received from the Node.js backend

// Event Listeners
searchButton.addEventListener("click", performSearch);
searchInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    performSearch();
  }
});

playSelectedTrackButton.addEventListener("click", () => {
  const selectedFileIndex = trackSelect.value;
  if (currentTorrentInfo && selectedFileIndex !== "") {
    // Pass infoHash and fileIndex to the play function, which will request from the backend
    playSpecificTrack(currentTorrentInfo.infoHash, parseInt(selectedFileIndex));
    // You might choose to hide the dropdown here or keep it visible
  } else {
    displayError("No track selected or torrent information missing.");
  }
});

/**
 * Performs a search against the Go backend's Prowlarr endpoint.
 */
async function performSearch() {
  const query = searchInput.value.trim();

  if (query === "") {
    displayError("Please enter a search query.");
    return;
  }

  // Clear previous results and messages
  searchResultsDiv.innerHTML = "";
  hideError();
  showLoading();
  hideTrackSelection(); // Hide track selection if a new search starts
  audioPlayer.pause();
  audioPlayer.src = "";
  playerStatus.textContent = "";

  // Clear any previously active torrent info
  currentTorrentInfo = null;

  try {
    const url = `${API_BASE_URL}${SEARCH_ENDPOINT}?q=${encodeURIComponent(
      query
    )}`;

    const response = await fetch(url);

    if (!response.ok) {
      // Attempt to parse JSON error first, fallback to text
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: await response.text() };
      }
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    hideLoading();
    displayResults(data);
  } catch (error) {
    hideLoading();
    displayError(`Failed to fetch search results: ${error.message}`);
    console.error("Fetch error:", error);
  }
}

/**
 * Displays the search results in an HTML table.
 * @param {Array<Object>} results - An array of ProwlarrSearchResult objects.
 */
function displayResults(results) {
  if (results.length === 0) {
    searchResultsDiv.innerHTML =
      '<p class="text-center text-gray-400">No results found.</p>';
    return;
  }

  let html = "<table><thead><tr>";
  const headers = [
    "Title",
    "Indexer",
    "Category",
    "Size",
    "Seeders",
    "Peers",
    "Published",
    "Magnet Link",
    "Actions",
  ];
  headers.forEach((header) => {
    html += `<th>${header}</th>`;
  });
  html += "</tr></thead><tbody>";

  results.forEach((item) => {
    const sizeMB = (item.size / (1024 * 1024)).toFixed(2); // Convert bytes to MB
    const publishDate = item.publishDate
      ? new Date(item.publishDate).toLocaleDateString()
      : "N/A";

    const magnetLinkDisplay = item.guid
      ? `<a href="${item.guid}" target="_blank" class="text-blue-400 hover:underline">Magnet</a>`
      : "N/A";

    let actionsHtml = "N/A";
    if (item.guid && item.guid.startsWith("magnet:")) {
      actionsHtml = `<button class="select-tracks-button bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105" data-magnet="${item.guid}" data-title="${item.title}">Select Tracks</button>`;
    } else if (item.downloadUrl) {
      actionsHtml = `<a href="${item.downloadUrl}" target="_blank" class="text-blue-400 hover:underline">Download (might hit CORS)</a>`;
    }

    html += `
            <tr>
                <td>${item.title || "N/A"}</td>
                <td>${item.indexer || "N/A"}</td>
                <td>${item.category || "N/A"}</td>
                <td>${sizeMB} MB</td>
                <td>${item.seeders !== undefined ? item.seeders : "N/A"}</td>
                <td>${item.peers !== undefined ? item.peers : "N/A"}</td>
                <td>${publishDate}</td>
                <td>${magnetLinkDisplay}</td>
                <td>${actionsHtml}</td>
            </tr>
        `;
  });
  html += "</tbody></table>";
  searchResultsDiv.innerHTML = html;

  // Add event listeners to the dynamically created "Select Tracks" buttons
  document.querySelectorAll(".select-tracks-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const magnetURI = event.target.dataset.magnet;
      const albumTitle = event.target.dataset.title;
      if (magnetURI) {
        addTorrentToBackendAndShowTracks(magnetURI, albumTitle);
      } else {
        displayError("No magnet link available to select tracks.");
      }
    });
  });
}

/**
 * Sends the magnet URI to the Node.js backend to add the torrent.
 * Upon success, populates the track selection dropdown with files from the torrent.
 * @param {string} magnetURI - The magnet URI of the torrent.
 * @param {string} albumTitle - The title of the album/torrent.
 */
async function addTorrentToBackendAndShowTracks(magnetURI, albumTitle) {
  playerStatus.textContent =
    "Adding torrent to remote server and fetching metadata...";
  hideError();
  trackSelect.innerHTML = ""; // Clear previous options
  currentAlbumTitle.textContent = `Album: ${albumTitle}`;
  trackSelectionContainer.style.display = "block"; // Show the dropdown container

  audioPlayer.pause(); // Pause any current playback
  audioPlayer.src = "";
  playerStatus.textContent = ""; // Clear player status

  currentTorrentInfo = null; // Reset current torrent info

  try {
    const response = await fetch(`${WEBTORRENT_BACKEND_URL}/api/add-torrent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ magnetURI }),
    });

    if (!response.ok) {
      // Attempt to parse JSON error first, fallback to text
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: await response.text() };
      }
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    currentTorrentInfo = data; // Store the torrent info received from the backend

    console.log("Torrent metadata ready from backend:", data.name);
    console.log(
      "Files in torrent from backend:",
      data.files.map((f) => f.name)
    );
    playerStatus.textContent = `Metadata for "${data.name}" loaded. Select a track.`;

    let hasAudioFiles = false;
    trackSelect.innerHTML = '<option value="">-- Select a track --</option>'; // Default option
    data.files.forEach((file, index) => {
      const fileName = file.name.toLowerCase();
      // Filter for common audio file extensions
      if (
        fileName.endsWith(".mp3") ||
        fileName.endsWith(".flac") ||
        fileName.endsWith(".wav") ||
        fileName.endsWith(".ogg") ||
        fileName.endsWith(".m4a")
      ) {
        const option = document.createElement("option");
        option.value = index; // Use file index as value
        // Display just the filename, removing path if present
        option.textContent = file.name.split("/").pop().split("\\").pop();
        trackSelect.appendChild(option);
        hasAudioFiles = true;
      }
    });

    if (!hasAudioFiles) {
      trackSelect.innerHTML =
        '<option value="">No playable audio files found in this torrent.</option>';
      playSelectedTrackButton.disabled = true;
      displayError("No playable audio files found in this torrent.");
    } else {
      playSelectedTrackButton.disabled = false;
    }
  } catch (error) {
    console.error("Frontend error adding torrent to backend:", error);
    displayError(
      `Failed to load torrent metadata from backend: ${error.message}`
    );
    playerStatus.textContent = `Error: ${error.message}`;
    hideTrackSelection(); // Hide dropdown on error
  }
}

/**
 * Plays a specific audio file by constructing its streaming URL from the Node.js backend.
 * @param {string} infoHash - The info hash of the torrent.
 * @param {number} fileIndex - The index of the file to play within the torrent.
 */
function playSpecificTrack(infoHash, fileIndex) {
  if (!infoHash || typeof fileIndex !== "number") {
    displayError("Invalid torrent or file information to play.");
    return;
  }

  const fileName = currentTorrentInfo.files[fileIndex].name
    .split("/")
    .pop()
    .split("\\")
    .pop();
  console.log("Attempting to stream from backend:", fileName);
  playerStatus.textContent = `Streaming: ${fileName}`;
  audioPlayer.src = ""; // Clear previous source

  // Set the audio player source to the backend streaming endpoint
  audioPlayer.src = `${WEBTORRENT_BACKEND_URL}/api/stream/${infoHash}/${fileIndex}`;
  audioPlayer.load(); // Load the new source
  audioPlayer.play().catch((e) => {
    // Catch and display autoplay errors, which are common in modern browsers
    console.error("Error playing audio:", e);
    displayError(
      `Error playing audio: ${e.message}. Make sure your browser allows autoplay for this site.`
    );
  });
}

// Helper functions for UI feedback
function showLoading() {
  loadingMessage.style.display = "block";
}

function hideLoading() {
  loadingMessage.style.display = "none";
}

function displayError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  console.error(message); // Also log to console for debugging
}

function hideError() {
  errorMessage.style.display = "none";
  errorMessage.textContent = "";
}

function hideTrackSelection() {
  trackSelectionContainer.style.display = "none";
  trackSelect.innerHTML = "";
  currentAlbumTitle.textContent = "";
  playSelectedTrackButton.disabled = false; // Re-enable for next use
}

// Helper to format bytes for display
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
