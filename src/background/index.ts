chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHAT_MESSAGE') {
    setTimeout(() => {
      // Different processing based on message type
      const processedMessage = message.isFirstMessage
        ? `Processed first message with page content: ${message.text} haha`
        : `Processed follow-up message: ${message.text} haha`

      sendResponse({ reply: processedMessage })
    }, 2000)
  }
  return true
})
