// State
let messages = [];
let chatLoading = false;
const MAX_MESSAGES = 5;

// DOM Elements
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const responseDisplay = document.getElementById('response-display');
const responseText = document.getElementById('response-text');
const promptText = document.getElementById('prompt-text');

// Enable input on load
chatInput.disabled = false;
sendButton.disabled = true;

// Handle input change
chatInput.addEventListener('input', () => {
    sendButton.disabled = !chatInput.value.trim() || chatLoading;
});

// Handle form submit
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prompt = chatInput.value.trim();
    if (!prompt || chatLoading) return;

    chatLoading = true;
    chatInput.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = 'Loading...';

    // Create user message but don't add to history yet
    const userMessage = { role: 'user', content: prompt };
    const messagesWithUser = [...messages, userMessage].slice(-MAX_MESSAGES);

    try {
        // if we are in dev mode (localhost), use localhost, otherwise use the current origin
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8787/ask' : '/ask';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messagesWithUser,
            }),
        });

        const data = await response.json();

        // Only add to message history if valid
        if (data.valid !== false) {
            const assistantMessage = {
                role: 'assistant',
                content: data.response || data.explanation || 'Response generated'
            };
            messages = [...messages, userMessage, assistantMessage].slice(-MAX_MESSAGES);
        }

        // Display latest response
        promptText.textContent = prompt;
        responseText.textContent = data.response || data.explanation || 'Response generated';
        responseDisplay.classList.remove('hidden');

    } catch (error) {
        console.error('Error:', error);
        
        // Add error message to history
        const errorMessage = {
            role: 'assistant',
            content: 'Error generating response'
        };
        messages = [...messages, errorMessage].slice(-MAX_MESSAGES);

        // Display error
        responseText.textContent = 'Error generating response';
        responseDisplay.classList.remove('hidden');
    } finally {
        chatLoading = false;
        chatInput.disabled = false;
        chatInput.value = '';
        sendButton.disabled = true;
        sendButton.textContent = 'Send';
        chatInput.focus();
    }
});
