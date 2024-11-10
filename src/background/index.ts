chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHAT_MESSAGE') {
    // Process the message
    setTimeout(() => {
      // Process the message
      const processedMessage = message.text + ' haha'
      sendResponse({ reply: processedMessage })
    }, 2000) // 2 second delay
  }
  return true // Keep the message channel open for async response
})
