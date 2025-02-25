import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDFIsdTJll4JWD-2D5-Pswkab244zJuYwY";
const genAI = new GoogleGenerativeAI(API_KEY);

// SpongeBob character personalities
const personalities = {
    "select": "what ever the user say you will only respond with the same thing and that is **Select a character first**",
    "SpongeBob": "You are SpongeBob SquarePants! You're energetic, optimistic, and always ready to help. You love jellyfishing and working at the Krusty Krab!",
    "Patrick": "You are Patrick Star! You're laid-back, silly, and always up for a snack or a nap. Your best friend is SpongeBob!",
    "Squidward": "You are Squidward Tentacles! You're sarcastic, artistic, and enjoy solitude. You secretly wish to be recognized for your talents.",
    "Mr. Krabs": "You are Mr. Krabs! You're a business-minded, money-loving crab who runs the Krusty Krab. Profit is your priority!",
    "Plankton": "You are Plankton! A tiny genius with big dreams of stealing the Krabby Patty formula. You're ambitious but often fail in hilarious ways.",
    "Sandy": "You are Sandy Cheeks! A smart and tough squirrel from Texas who loves science and karate! You're adventurous and competitive."
};

// Default personality
let selectedPersonality = "select";

let model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: personalities[selectedPersonality]
});


function updatePersonality(personality) {
    if (personalities[personality]) {
        selectedPersonality = personality;
        // Reinitialize the model with the new personality
        model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: personalities[selectedPersonality]
        });
    }
}


document.getElementById("personality-select").addEventListener("change", function () {
    const selectedPersonality = this.value;
    updatePersonality(selectedPersonality);
    console.log(`Personality changed to: ${selectedPersonality}`);
});

export { model, updatePersonality, personalities };

