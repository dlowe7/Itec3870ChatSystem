import { Socket } from "phoenix";

let username = null;
let channel = null;
let socket = new Socket("/socket", { params: { token: window.userToken } });
socket.connect();

const sendButton = document.getElementById("send-btn");
const messageInput = document.getElementById("message-input");
const messagesContainer = document.getElementById("messages");
const channelList = document.getElementById("channel-list");
const chatHeaderTitle = document.getElementById("chat-header-title");

let joinedChannels = [];

document.addEventListener("DOMContentLoaded", () => {
  const channelPopup = document.getElementById("channel-popup");
  const channelSelect = document.getElementById("channel-select");
  const channelSubmitBtn = document.getElementById("channel-submit-btn");
  const usernamePopup = document.getElementById("username-popup");
  const usernameInput = document.getElementById("popup-name-input");
  const usernameSubmitBtn = document.getElementById("popup-submit-btn");

  // Step 1: Select Channel
  channelSubmitBtn.addEventListener("click", () => {
    channel = channelSelect.value;
    channelPopup.style.display = "none";
    usernamePopup.style.display = "flex";
  });

  // Step 2: Enter Username
  usernameSubmitBtn.addEventListener("click", () => {
    username = usernameInput.value.trim() || "Anonymous";
    usernamePopup.style.display = "none";
    document.querySelector(".chat-main").classList.remove("hidden");
    chatHeaderTitle.textContent = `Chat in ${channel} as ${username}`;
    joinChannel(channel);
  });
});

function joinChannel(channelName) {
  console.log(`Joining channel: ${channelName}`);

  if (joinedChannels.includes(channelName)) {
    alert(`You're already in ${channelName}`);
    return;
  }

  joinedChannels.push(channelName);

  const channelItem = document.createElement("li");
  channelItem.textContent = channelName.replace("room:", "");
  channelItem.classList.add("channel-bubble");
  channelItem.addEventListener("click", () => {
    channel = channelName;
    chatHeaderTitle.textContent = `Chat in ${channelName} as ${username}`;
  });
  channelList.appendChild(channelItem);

  let chatChannel = socket.channel(channelName, {});
  chatChannel.join()
    .receive("ok", (resp) => {
      console.log(`Joined ${channelName} successfully`, resp);
      chatChannel.push("user_joined", { name: username });
    })
    .receive("error", (resp) => console.log(`Unable to join ${channelName}`, resp));

  chatChannel.on("new_msg", (payload) => {
    const messageItem = document.createElement("div");
    messageItem.className =
      payload.name === username ? "message-right" : "message-left";
    messageItem.innerHTML = `<strong>${payload.name}:</strong> ${payload.body}`;
    messagesContainer.appendChild(messageItem);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });

  chatChannel.on("user_joined", (payload) => {
    const systemMessage = document.createElement("div");
    systemMessage.className = "system-message";
    systemMessage.innerHTML = `<em>${payload.name} has joined the chat.</em>`;
    messagesContainer.appendChild(systemMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });

  sendButton.addEventListener("click", () => {
    console.log("Send button clicked!");
    const message = messageInput.value.trim();
    if (message === "") return;

    chatChannel.push("new_msg", { name: username, body: message });
    console.log("Message sent:", message);
    messageInput.value = "";
  });

  messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      console.log("Enter key pressed!");
      sendButton.click();
    }
  });
}
