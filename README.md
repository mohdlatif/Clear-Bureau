# Clear Bureau: Your AI-Powered Guide to Public Services

**Clear Bureau** is a Chrome extension that simplifies navigating government websites and accessing public services. It provides translations, explanations, and step-by-step guidance in multiple languages, making essential services like tax filing and benefits accessible to everyone.

[[Clear Bureau Demo](https://lablab.ai/event/llama-impact-hackathon/code-crusiade)]

## Key Features

- **Multilingual Chatbot:** Get instant answers and guidance in your preferred language.
- **Step-by-Step Guidance:** Navigate complex processes with clear instructions and translations.
- **Contextual Assistance:** Receive relevant information and support based on the webpage you're viewing.
- **FAQ and Knowledge Base:** Access answers to common questions and learn about essential processes.
- **Personalized Experience:** The chatbot learns from your interactions to provide tailored assistance.
- **Voice Interaction:** Communicate with the chatbot using your voice (experimental).
- **History Dashboard:** Review your past interactions and track your progress.
- **Customizable Settings:** Adjust settings to personalize your experience.
- **External Database Connection:** Connect to your own Postgres database to enhance the chatbot's knowledge (under development).

## Installation

1. Clone this repository: `git clone https://github.com/mohdlatif/Clear-Bureau.git`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the `build` directory.

## Usage

1. Once installed, the Clear Bureau icon will appear in your browser toolbar.
2. Click the icon to open the chat widget on any government website.
3. Ask questions, request guidance, or translate content to navigate services with ease.

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript, React
- **Backend:** Python, Flask, Restack, Llama 3.2, LlamaIndex
- **Database:** MindsDB, Postgres (under development)

## How it Works

Clear Bureau uses advanced AI to simplify your interactions with government services. When you ask a question or request guidance, it:

1. **Analyzes the Webpage:** Extracts relevant information from the current webpage.
2. **Sends API Request:** Sends your request and the webpage context to the Restack backend.
3. **Processes with Llama:** Uses Llama 3.2 to understand your request and generate a response.
4. **Accesses MindsDB:** Retrieves relevant information from the knowledge base of FAQs and processes.
5. **Provides Assistance:** Delivers clear instructions, translations, or answers in your preferred language.

## Addressing the Hackathon Challenge

Clear Bureau directly addresses the "Navigating Public Services" challenge by:

- **Breaking down language barriers:** Providing translations and explanations in multiple languages.
- **Simplifying complex processes:** Offering step-by-step guidance and contextual assistance.
- **Improving accessibility:** Making government services more user-friendly and understandable.

## Future Roadmap

- **Complete Postgres Integration:** Enable users to connect to their own databases for personalized assistance.
- **Expand Service Coverage:** Support a wider range of government services and processes.
- **Improve Voice Interaction:** Enhance voice input/output for a more natural conversation experience.
- **Add Accessibility Features:** Ensure the extension is accessible to users with disabilities.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- **Llama 3.2:** https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/
- **Restack:** https://www.restack.io/
- **MindsDB:** https://mindsdb.com/
- **LlamaIndex:** https://www.llamaindex.ai/

---
