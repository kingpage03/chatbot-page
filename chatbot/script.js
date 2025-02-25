// script.js - Optimized: Improved readability, performance, and structure
import MarkdownIt from "https://cdn.jsdelivr.net/npm/markdown-it@13.0.2/+esm";
import { model } from "./mainmodule.js";

const md = new MarkdownIt();

// DOM Elements
const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-cont");
const chatHistoryList = document.querySelector("#chat-history-list");
const newChatButton = document.querySelector("#new-chat-btn");
const clearHistoryButton = document.querySelector("#clear-history-btn");
const personalitySelect = document.getElementById("personality-select");
const chatbotContainer = document.querySelector(".chatbot-cont");

// Chat History Management
let chatHistories = JSON.parse(localStorage.getItem("chatHistories")) || {};
let currentSessionId = localStorage.getItem("currentSessionId") || generateSessionId();
chatHistories[currentSessionId] = chatHistories[currentSessionId] || [];

// Personality Avatars
const personalityAvatars = {
    "SpongeBob": "imgs/spongebob.jpg",
    "Patrick": "imgs/patrick.jpg",
    "Squidward": "imgs/squidward.jpg",
    "Mr. Krabs": "imgs/mrcrabs.jpg",
    "Plankton": "imgs/plankton.jpg",
    "Sandy": "imgs/sandy.jpg"
};

// Restore personality selection from storage if it exists
let selectedPersonality = localStorage.getItem(`personality-${currentSessionId}`) || "";

if (selectedPersonality) {
    personalitySelect.value = selectedPersonality;
    personalitySelect.disabled = true;
}

personalitySelect.addEventListener("change", function () {
    if (!localStorage.getItem(`personality-${currentSessionId}`)) {
        selectedPersonality = this.value;
        localStorage.setItem(`personality-${currentSessionId}`, selectedPersonality);
        localStorage.setItem(`personalityLocked-${currentSessionId}`, "true");
        personalitySelect.disabled = true; // Lock selection
    }
});



// Utility Functions
function generateSessionId() {
    return `session-${Date.now()}`;
}

function saveChatHistory() {
    localStorage.setItem("chatHistories", JSON.stringify(chatHistories));
    localStorage.setItem("currentSessionId", currentSessionId);
}

// Apply Markdown Formatting and Strip Unnecessary Tags
function formatMessageText(text) {
    let formattedText = md.render(text).trim();
    return formattedText.startsWith("<p>") && formattedText.endsWith("</p>")
        ? formattedText.slice(3, -4) // Remove <p> and </p>
        : formattedText;
}

// Update Chat History UI
function updateChatHistoryList() {
    chatHistoryList.innerHTML = "";
    Object.keys(chatHistories).forEach((sessionId) => {
        const lastMessage = chatHistories[sessionId].slice(-1)[0]?.message || "New Chat";
        const chatTitle = lastMessage.length > 20 ? `${lastMessage.slice(0, 20)}...` : lastMessage;
        const chatItem = document.createElement("div");
        chatItem.classList.add("nav-item");
        chatItem.textContent = chatTitle;
        if (sessionId === currentSessionId) chatItem.classList.add("active");
        chatItem.addEventListener("click", () => {
            document.querySelectorAll(".nav-item").forEach(nav => nav.classList.remove("active"));
            chatItem.classList.add("active");
            loadChatHistory(sessionId);
        });
        chatHistoryList.appendChild(chatItem);
    });
}

// Create Chat Message Element
function createMessageElement(message, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-content", sender);
    const messageBubble = document.createElement("div");
    messageBubble.classList.add("chat-body-inner", sender === "user" ? "right" : "left");

    // Apply Markdown Formatting
    messageBubble.innerHTML = formatMessageText(message);

    if (sender === "ai") {
        const aiAvatar = document.createElement("img");
        aiAvatar.src = personalityAvatars[selectedPersonality] || "imgs/select.jpg"; 
        aiAvatar.alt = "AI Avatar";
        aiAvatar.classList.add("ai-avatar");
        messageElement.appendChild(aiAvatar);
    }

    messageElement.appendChild(messageBubble);
    return messageElement;
}

// Handle AI Response
function getChatResponse(userText) {
    const aiMessage = createMessageElement("AI is thinking...", "ai");
    chatContainer.appendChild(aiMessage);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Gather recent chat messages for context
const conversationHistory = chatHistories[currentSessionId]
.map(({ sender, message }) => `${sender === "user" ? "User" : "AI"}: ${message}`)
.join("\n");

// Send full context to AI
model.generateContent(`${conversationHistory}\nUser: ${userText}`).then(result => result.response.text())

        .then(response => {
            const formattedResponse = formatMessageText(response);
            aiMessage.querySelector(".chat-body-inner").innerHTML = formattedResponse;
            chatHistories[currentSessionId].push({ message: response, sender: "ai" });
            saveChatHistory();
        })
        .catch(error => {
            console.error("Error fetching AI response: ", error);
            aiMessage.querySelector(".chat-body-inner").innerHTML = `<p>Please refresh the page and try again.</p>`;
        });

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Handle User Input
function handleAPI() {
    const userText = chatInput.value.trim();
    if (!userText) return;

    const userMessage = createMessageElement(formatMessageText(userText), "user");
    chatContainer.appendChild(userMessage);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    chatHistories[currentSessionId].push({ message: userText, sender: "user" });
    saveChatHistory();
    getChatResponse(userText);

    chatInput.value = "";

    // Hide quick responses after sending a message
    quickResponsesContainer.style.display = "none";

    // Save selected personality and character for this session
    if (selectedPersonality) {
        localStorage.setItem(`personality-${currentSessionId}`, selectedPersonality);
        localStorage.setItem(`character-${currentSessionId}`, JSON.stringify({
            name: selectedPersonality,
            avatar: personalityAvatars[selectedPersonality] || "imgs/select.jpg"
        }));
    }
}



// Start New Chat Session
function startNewChat() {
    currentSessionId = generateSessionId();
    chatHistories[currentSessionId] = [];
    chatContainer.innerHTML = "";
    saveChatHistory();
    updateChatHistoryList();

    // Unlock personality selection
    localStorage.removeItem(`personality-${currentSessionId}`);
    localStorage.removeItem(`personalityLocked-${currentSessionId}`);
    personalitySelect.disabled = false;
    personalitySelect.value = "select"; // Reset dropdown


    // Clear and render quick responses only once
    quickResponsesContainer.innerHTML = "";
    renderQuickResponses();

    if (!localStorage.getItem(`quickResponses-${currentSessionId}`)) {
        renderQuickResponses();
        localStorage.setItem(`quickResponses-${currentSessionId}`, "shown");
    }
}



// Load Chat History for Selected Session
function loadChatHistory(sessionId) {
    currentSessionId = sessionId;
    chatContainer.innerHTML = "";

    chatHistories[currentSessionId].forEach(({ message, sender }) => {
        const messageElement = createMessageElement(formatMessageText(message), sender);
        chatContainer.appendChild(messageElement);
    });

    saveChatHistory();
    quickResponsesContainer.innerHTML = "";

    if (!localStorage.getItem(`quickResponses-${currentSessionId}`)) {
        renderQuickResponses();
        localStorage.setItem(`quickResponses-${currentSessionId}`, "shown");
    }

    // Restore personality selection for this session
    const savedPersonality = localStorage.getItem(`personality-${currentSessionId}`);
    if (savedPersonality) {
        selectedPersonality = savedPersonality;
        personalitySelect.value = savedPersonality;
        personalitySelect.disabled = true; // Lock the dropdown
    }
}


// Clear All Chat Histories
function clearAllChatHistories() {
    chatHistories = {};
    startNewChat();
}

// Event Listeners
sendButton.addEventListener("click", handleAPI);
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAPI();
});
newChatButton.addEventListener("click", startNewChat);
clearHistoryButton.addEventListener("click", clearAllChatHistories);

// Quick Responses Section
const quickResponsesContainer = document.createElement("div");
quickResponsesContainer.classList.add("quick-responses-container");

if (chatbotContainer) {
    chatbotContainer.appendChild(quickResponsesContainer);
} else {
    console.error("Error: .chatbot-cont not found!");
}

const quickResponses = [
    "Tell me a joke!", "What's the weather today?", "Give me a fun fact!", 
    "How do I cook pasta?", "Tell me about AI.", "What's your favorite movie?", 
    "Can you sing a song?", "Give me a riddle!"
];

function getRandomResponses() {
    return quickResponses.sort(() => Math.random() - 0.5).slice(0, 4);
}

function renderQuickResponses() {
    quickResponsesContainer.innerHTML = "";
    quickResponsesContainer.style.display = "flex";

    getRandomResponses().forEach(response => {
        const responseCard = document.createElement("div");
        responseCard.classList.add("quick-response-card");
        responseCard.textContent = response;

        responseCard.addEventListener("click", () => {
            chatInput.value = response;
            handleAPI();
            setTimeout(() => quickResponsesContainer.style.display = "none", 500);
        });

        quickResponsesContainer.appendChild(responseCard);
    });
}


// Initialize Chat on Load
window.addEventListener("load", () => {
    // Clear localStorage to reset chat history on refresh
    localStorage.clear();

    // Reset chat history and session
    chatHistories = {};
    currentSessionId = generateSessionId();
    chatHistories[currentSessionId] = [];
    
    chatContainer.innerHTML = ""; // Clear chat UI
    saveChatHistory();
    updateChatHistoryList();

    // Reset personality selection
    selectedPersonality = "";
    personalitySelect.disabled = false;
    personalitySelect.value = "select"; 

    renderQuickResponses(); // Ensure quick responses are available
});


