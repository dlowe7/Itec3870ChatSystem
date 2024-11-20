import { Socket } from "phoenix";

let username = null; // To store the username
let currentChannel = null; // To store the active channel name
let activeChannels = {}; // Tracks all joined channels and their messages
let socket = new Socket("/socket", { params: { token: window.userToken } });
socket.connect(); // Establish WebSocket connection

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
  const typingIndicator = document.getElementById("typing-indicator");

  // Step 1: Select Channel
  channelSubmitBtn.addEventListener("click", () => {
    currentChannel = channelSelect.value; // Get the selected channel
    channelPopup.style.display = "none"; // Hide the channel popup
    usernamePopup.style.display = "flex"; // Show the username popup
  });

  // Step 2: Enter Username
  usernameSubmitBtn.addEventListener("click", () => {
    username = usernameInput.value.trim() || "Anonymous"; // Default to Anonymous if no name
    usernamePopup.style.display = "none"; // Hide username popup
    chatContainer.classList.add("active"); // Show the chat container
    chatHeaderTitle.textContent = `Chat in ${currentChannel} as ${username}`;
    joinChannel(currentChannel); // Join the selected channel
  });

  // Function to join a channel
  function joinChannel(channelName) {
    if (activeChannels[channelName]) {
      console.log(`[INFO] Already joined ${channelName}`);
      loadMessages(channelName); // Load previous messages
      return;
    }

    console.log(`[INFO] Joining new channel: ${channelName}`);

    // Add the channel to the sidebar
    const channelItem = document.createElement("li");
    channelItem.textContent = channelName.replace("room:", ""); // Display name without "room:"
    channelItem.className = "channel-bubble";
    channelItem.dataset.channel = channelName;

    channelItem.addEventListener("click", () => {
      currentChannel = channelName;
      chatHeaderTitle.textContent = `Chat in ${currentChannel} as ${username}`;
      loadMessages(currentChannel); // Load messages for this channel
    });

    channelList.appendChild(channelItem);

    // Join the channel
    const chatChannel = socket.channel(channelName, {});
    activeChannels[channelName] = { channelInstance: chatChannel, messages: [] };

    chatChannel.join()
      .receive("ok", () => {
        console.log(`[SUCCESS] Joined ${channelName}`);
        chatChannel.push("user_joined", { name: username });
      })
      .receive("error", (resp) => console.error(`[ERROR] Unable to join ${channelName}`, resp));

    // Handle incoming messages
    chatChannel.on("new_msg", (payload) => {
      saveMessage(channelName, payload.name, payload.body); // Save the message
      if (channelName === currentChannel) {
        displayMessage(payload.name, payload.body); // Display if active
      }
    });

    // Handle "user joined" events
    chatChannel.on("user_joined", (payload) => {
      const systemMessage = `${payload.name} has joined the chat.`;
      saveMessage(channelName, "System", systemMessage);
      if (channelName === currentChannel) {
        displaySystemMessage(systemMessage);
      }
    });

    // Handle typing events
    chatChannel.on("typing", (payload) => {
      if (payload.name !== username && channelName === currentChannel) {
        displayTypingIndicator(payload.name);
      }
    });

    // Send typing event when user types
    messageInput.addEventListener("input", () => {
      chatChannel.push("typing", { name: username });
    });

    // Handle sending messages
    sendButton.addEventListener("click", () => sendMessage(chatChannel));
    messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") sendMessage(chatChannel);
    });
  }

  // Save a message in the activeChannels object
  function saveMessage(channelName, name, body) {
    if (!activeChannels[channelName]) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    activeChannels[channelName].messages.push({ name, body, timestamp });
  }

  // Load messages for a specific channel
  function loadMessages(channelName) {
    messagesContainer.innerHTML = ""; // Clear chat box
    if (!activeChannels[channelName]) return;

    activeChannels[channelName].messages.forEach((msg) => {
      if (msg.name === "System") {
        displaySystemMessage(msg.body);
      } else {
        displayMessage(msg.name, msg.body, msg.timestamp);
      }
    });
  }

  // Function to send a message
  function sendMessage(chatChannel) {
    const message = messageInput.value.trim();
    if (!message) return;

    chatChannel.push("new_msg", { name: username, body: message });
    messageInput.value = ""; // Clear the input field
  }

  // Display a chat message
  function displayMessage(name, message, timestamp = null) {
    const avatarUrl = generateAvatar(name);
    if (!timestamp) {
      timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const messageItem = document.createElement("div");
    messageItem.className = name === username ? "message-right" : "message-left";

    messageItem.innerHTML = `
      <div class="message-wrapper">
        <div class="message-avatar">
          <img src="${avatarUrl}" alt="${name}'s avatar" class="avatar" />
        </div>
        <div class="message-bubble">
          <strong>${name}</strong>
          <div>${message}</div>
        </div>
      </div>
      <div class="timestamp">${timestamp}</div>
    `;

    messagesContainer.appendChild(messageItem);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom
  }

  // Display a typing indicator
  function displayTypingIndicator(name) {
    if (!typingIndicator) return;
    typingIndicator.textContent = `${name} is typing...`;
    typingIndicator.style.display = "block";

    clearTimeout(typingIndicator.timeout);
    typingIndicator.timeout = setTimeout(() => {
      typingIndicator.textContent = "";
      typingIndicator.style.display = "none";
    }, 3000);
  }

  // Display a system message
  function displaySystemMessage(message) {
    const systemMessage = document.createElement("div");
    systemMessage.className = "system-message";
    systemMessage.innerHTML = `<em>${message}</em>`;
    messagesContainer.appendChild(systemMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom
  }

  function generateAvatar(username) {
    const sanitizedName = encodeURIComponent(username.trim());
    return `https://api.dicebear.com/6.x/adventurer/svg?seed=${sanitizedName}`;
  }
});
