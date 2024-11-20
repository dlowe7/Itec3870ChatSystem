import { Socket } from "phoenix";

let username = null; // To store the username
let currentChannel = null; // To store the active channel
let activeChannels = {}; // Track joined channels
let socket = new Socket("/socket", { params: { token: window.userToken } });
socket.connect(); // Ensure only one connection

// Wait for the DOM to load before attaching listeners
document.addEventListener("DOMContentLoaded", () => {
  const channelPopup = document.getElementById("channel-popup");
  const channelSelect = document.getElementById("channel-select");
  const channelSubmitBtn = document.getElementById("channel-submit-btn");

  const usernamePopup = document.getElementById("username-popup");
  const usernameInput = document.getElementById("popup-name-input");
  const usernameSubmitBtn = document.getElementById("popup-submit-btn");

  const chatContainer = document.querySelector(".chat-container");
  const chatHeaderTitle = document.getElementById("chat-header-title");
  const channelList = document.getElementById("channel-list");
  const messagesContainer = document.getElementById("messages");

  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-btn");

  // Step 1: Select Channel
  channelSubmitBtn.addEventListener("click", () => {
    const selectedChannel = channelSelect.value; // Get selected channel
    channelPopup.style.display = "none"; // Hide the channel selection popup
    usernamePopup.style.display = "flex"; // Show username input popup
    currentChannel = selectedChannel; // Set the current channel
  });

  // Step 2: Enter Username
  usernameSubmitBtn.addEventListener("click", () => {
    username = usernameInput.value.trim() || "Anonymous"; // Use "Anonymous" if no name is entered
    usernamePopup.style.display = "none"; // Hide username popup
    chatContainer.classList.add("active"); // Show the chat container
    chatHeaderTitle.textContent = `Chat in ${currentChannel} as ${username}`; // Update header

    // Join the selected channel
    joinChannel(currentChannel);
  });

  // Function to join a channel
  function joinChannel(channelName) {
    // Prevent duplicate joins
    if (activeChannels[channelName]) {
      console.log(`Already joined ${channelName}`);
      return;
    }

    // Add the channel to the sidebar
    const channelItem = document.createElement("li");
    channelItem.textContent = channelName.replace("room:", ""); // Remove "room:" prefix for display
    channelItem.className = "channel-bubble";
    channelItem.addEventListener("click", () => {
      currentChannel = channelName; // Update current channel
      chatHeaderTitle.textContent = `Chat in ${channelName} as ${username}`;
    });
    channelList.appendChild(channelItem);

    // Join the channel
    let chatChannel = socket.channel(channelName, {});

    chatChannel.join()
      .receive("ok", (resp) => {
        console.log(`Joined ${channelName} successfully`, resp);
        // Notify others that a user joined
        chatChannel.push("user_joined", { name: username });
      })
      .receive("error", (resp) => console.error(`Unable to join ${channelName}`, resp));

    // Handle incoming messages
    chatChannel.on("new_msg", (payload) => {
      displayMessage(payload.name, payload.body);
    });

    // Handle user joined messages
    chatChannel.on("user_joined", (payload) => {
      displaySystemMessage(`${payload.name} has joined the chat.`);
    });

    // Save the channel in the active channels object
    activeChannels[channelName] = chatChannel;
  }

  // Function to send a message
  function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !activeChannels[currentChannel]) return; // Do nothing if no message or no active channel

    activeChannels[currentChannel].push("new_msg", { name: username, body: message });
    messageInput.value = ""; // Clear input field
  }

  // Attach event listeners for the send button and Enter key
  sendButton.onclick = sendMessage;
  messageInput.onkeydown = (event) => {
    if (event.key === "Enter") sendMessage();
  };

  // Helper function to display a message
  function displayMessage(name, message) {
    const messageItem = document.createElement("div");
    messageItem.className = name === username ? "message-right" : "message-left";
    messageItem.innerHTML = `<strong>${name}:</strong> ${message}`;
    messagesContainer.appendChild(messageItem);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
  }

  // Helper function to display system messages
  function displaySystemMessage(message) {
    const systemMessage = document.createElement("div");
    systemMessage.className = "system-message";
    systemMessage.innerHTML = `<em>${message}</em>`;
    messagesContainer.appendChild(systemMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
  }
});
