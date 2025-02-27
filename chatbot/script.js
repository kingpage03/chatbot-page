// script.js - Optimized: Improved readability, performance, and structure
import MarkdownIt from "https://cdn.jsdelivr.net/npm/markdown-it@13.0.2/+esm";
import { model } from "./mainmodule.js";

const md = new MarkdownIt();

// DOM Elements
const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-cont");
const chatHistoryList = document.querySelector("#chat-history-list");

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
    selectedPersonality = this.value; // Update selected personality immediately
    localStorage.setItem(`personality-${currentSessionId}`, selectedPersonality);
    localStorage.setItem(`personalityLocked-${currentSessionId}`, "true");

    // Update the avatar immediately when the personality changes
    const aiAvatar = document.querySelector(".ai-avatar");
    if (aiAvatar) {
        aiAvatar.src = personalityAvatars[selectedPersonality] || "imgs/select.jpg";
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
            chatHistories[currentSessionId].push({ message: response, sender: "ai", avatar: personalityAvatars[selectedPersonality] || "imgs/select.jpg" });

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
    chatContainer.innerHTML = ""; // Clear chat container
    chatHistories[currentSessionId] = []; // Reset chat history
    saveChatHistory(); // Save the empty chat history
}

// Clear All Chat Histories
function clearAllChatHistories() {
    chatContainer.innerHTML = ""; // Clear chat container
    chatHistories[currentSessionId] = []; // Reset chat history
    saveChatHistory(); // Save the empty chat history
}

// Event Listeners
sendButton.addEventListener("click", handleAPI);
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAPI();
});

clearHistoryButton.addEventListener("click", clearAllChatHistories);

// Quick Responses Section
const quickResponsesContainer = document.createElement("div");
quickResponsesContainer.classList.add("quick-responses-container");
quickResponsesContainer.style.display = "none"; // Initially hide quick responses

if (chatbotContainer) {
    chatbotContainer.appendChild(quickResponsesContainer);
} else {
    console.error("Error: .chatbot-cont not found!");
}

async function getAIQuickResponses() {
    try {
        const prompt = "Generate 4 short phrases to start a conversation in the settings of SpongeBOb Squarepants Show, DOnt include numbers and any special characters.";
        const response = await model.generateContent(prompt).then(result => result.response.text());
        return response.split('\n').filter(line => line.trim() !== '').slice(0, 4);
    } catch (error) {
        console.error("Error generating quick responses:", error);
        return [
            "Tell me something interesting!",
            "What's on your mind today?",
            "Can you share a fun fact?",
            "What would you like to talk about?"
        ];
    }
}


async function renderQuickResponses() {
    quickResponsesContainer.innerHTML = "";
    quickResponsesContainer.style.display = "flex";

    const isCharacterSelected = selectedPersonality !== "";
    
    const responses = await getAIQuickResponses();
    responses.forEach(response => {

        const responseCard = document.createElement("div");
        responseCard.classList.add("quick-response-card");
        responseCard.textContent = response;

        if (isCharacterSelected) {
            responseCard.addEventListener("click", () => {
                chatInput.value = response;
                handleAPI();
                setTimeout(() => quickResponsesContainer.style.display = "none", 500);
            });
        } else {
            responseCard.style.cursor = "not-allowed"; // Indicate unclickable
            responseCard.classList.add("unclickable"); // Optional: Add a class for styling
        }

        quickResponsesContainer.appendChild(responseCard);
    });
}

// Initialize Chat on Load
window.addEventListener("load", () => {
    // Show character selection prompt
    alert("Please select a character to start chatting!");
    
    // Clear localStorage to reset chat history on refresh
    localStorage.clear();


    // Reset chat history and session
    chatHistories = {};
    currentSessionId = generateSessionId();
    chatHistories[currentSessionId] = [];
    
    chatContainer.innerHTML = ""; // Clear chat UI
    saveChatHistory();

    // Reset personality selection
    selectedPersonality = "";
    personalitySelect.disabled = false;
    personalitySelect.value = ""; 

    // Show quick responses if a personality is selected
    personalitySelect.addEventListener("change", function () {
        if (this.value !== "") {
            renderQuickResponses();
            quickResponsesContainer.style.display = "flex"; // Show quick responses
        } else {
            quickResponsesContainer.style.display = "none"; // Hide quick responses
        }
    });
});
