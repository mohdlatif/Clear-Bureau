import Together from 'together-ai'

// const { settings } = await chrome.storage.sync.get(['settings'])

const together = new Together({
  apiKey: '8916aa5dd5a189dbf006f0e0fb4dd1874c3824b05c301cd13af93e02c8693622',
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHAT_MESSAGE') {
    sendResponse({ status: 'processing' })
    handleChatMessage(message.text, sender.tab?.id, message.messageHistory)
  }
  return true
})
const systemPrompt = `You are a helpful and informative assistant designed to help users navigate government websites and access public services. You can understand and respond to user requests in multiple languages, providing clear explanations and step-by-step guidance. You can also access and retrieve information from a knowledge base of FAQs and common processes.

Your primary goal is to make government services more accessible and understandable, especially for users who speak low-resource languages.

Here are some key principles to keep in mind:

* Be patient and understanding: Users may be unfamiliar with government websites and processes.
* Provide clear and concise explanations: Avoid using jargon or technical terms that users may not understand.
* Offer step-by-step guidance: Break down complex processes into smaller, more manageable steps.
* Be culturally sensitive:  Be aware of cultural differences and avoid making assumptions about users' backgrounds or beliefs.
* Use appropriate language: Adapt your language and tone to the user's needs and preferences.

You can access the following tools to assist you:

* A translation engine to translate text between languages.
* A knowledge base of FAQs and common processes.
* The ability to extract information from web pages.

Please use these tools to provide the best possible assistance to users.`
async function handleChatMessage(text: string, tabId?: number, messageHistory?: any[]) {
  try {
    // Get the tone preference from storage
    const { tone } = await chrome.storage.local.get(['tone'])
    const toneInstruction = tone ? `\n\nPlease respond using a ${tone} tone.` : ''

    const response = await together.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt + toneInstruction },
        ...(messageHistory || []),
        { role: 'user', content: text },
      ],
      model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
      max_tokens: 1500,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ['<|eot_id|>', '<|eom_id|>'],
      stream: true,
    })

    let fullResponse = ''

    for await (const token of response) {
      const content = token.choices[0]?.delta?.content || ''
      fullResponse += content

      // Send each chunk to the chat widget
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          type: 'CHAT_RESPONSE_CHUNK',
          content,
          isComplete: false,
        })
      }
    }

    // Send final message indicating stream is complete
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'CHAT_RESPONSE_CHUNK',
        content: '',
        isComplete: true,
        fullResponse,
      })
    }
  } catch (error) {
    console.error('Error in chat:', error)
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'CHAT_ERROR',
        error: 'Failed to get response from AI',
      })
    }
  }
}
