import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Send, MessageCircle } from 'lucide-react'
import TurndownService from 'turndown'
import type { ChatHistoryItem } from '@/types/chat'
const logoUrl = chrome.runtime.getURL('icons/logo.svg')

interface Message {
  id: number
  text: string
  sender: 'user' | 'admin'
  isStreaming?: boolean
}

export default function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! How can I help you today?', sender: 'admin' },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstMessage, setIsFirstMessage] = useState(true)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Add message listener for streaming responses
    const messageListener = (message: any) => {
      if (message.type === 'CHAT_RESPONSE_CHUNK') {
        if (!message.isComplete) {
          // Add new message if it's the first chunk
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1]
            if (lastMessage.sender === 'admin' && lastMessage.isStreaming) {
              // Update existing streaming message
              return prevMessages.map((msg) =>
                msg.id === lastMessage.id ? { ...msg, text: msg.text + message.content } : msg,
              )
            } else {
              // Create new streaming message
              return [
                ...prevMessages,
                {
                  id: prevMessages.length + 1,
                  text: message.content,
                  sender: 'admin',
                  isStreaming: true,
                },
              ]
            }
          })
        } else {
          // Final message - update history
          setIsLoading(false)
          const historyItem: ChatHistoryItem = {
            id: crypto.randomUUID(),
            pageUrl: window.location.href,
            timestamp: Date.now(),
            userMessage: inputMessage,
            aiResponse: message.fullResponse,
            isFirstMessage: false,
          }

          // Store in chrome storage
          chrome.storage.local.get(['chatHistory'], (result) => {
            const history: ChatHistoryItem[] = result.chatHistory || []
            chrome.storage.local.set({
              chatHistory: [...history, historyItem],
            })
          })
        }
      } else if (message.type === 'CHAT_ERROR') {
        setIsLoading(false)
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: message.error,
            sender: 'admin',
          },
        ])
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)
    return () => chrome.runtime.onMessage.removeListener(messageListener)
  }, [])

  const handleSendMessage = () => {
    if (inputMessage.trim() !== '') {
      setIsLoading(true)

      let fullMessage: string

      if (isFirstMessage) {
        // First message - include markdown content
        const tempDiv = document.body.cloneNode(true) as HTMLElement
        const currentDomain = window.location.origin

        // Remove unwanted elements
        const elementsToRemove = tempDiv.querySelectorAll(
          'header, footer, [role="banner"], [role="contentinfo"], nav, script, style, link, meta, noscript, #crx-chat-root',
        )
        elementsToRemove.forEach((el) => el.remove())

        // Convert relative URLs to absolute URLs
        const links = tempDiv.querySelectorAll('a')
        links.forEach((link) => {
          const href = link.getAttribute('href')
          if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
            // Handle different types of relative URLs
            if (href.startsWith('/')) {
              link.setAttribute('href', `${currentDomain}${href}`)
            } else {
              link.setAttribute('href', `${currentDomain}/${href}`)
            }
          }
        })

        // Convert to Markdown
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
          emDelimiter: '*',
          bulletListMarker: '-',
          hr: '---',
        })

        // Add custom rule for links
        turndownService.addRule('absoluteLinks', {
          filter: ['a'],
          replacement: function (content, node) {
            const element = node as HTMLAnchorElement
            const href = element.getAttribute('href') || ''
            const title = element.title ? ` "${element.title}"` : ''
            return `[${content}](${href}${title})`
          },
        })

        // Customize Turndown rules if needed
        turndownService.addRule('removeEmptyParagraphs', {
          filter: ['p'],
          replacement: function (content: string) {
            if (content.trim() === '') return ''
            return '\n\n' + content + '\n\n'
          },
        })

        // Convert to markdown
        const markdown = turndownService
          .turndown(tempDiv)
          .replace(/\n{3,}/g, '\n\n') // Remove extra line breaks
          .trim()
        // .slice(0, 1500) + '...'

        fullMessage = `Page Content (Markdown):\n${markdown}\n\nUser Message:\n${inputMessage}`
        setIsFirstMessage(false) // Mark first message as done
      } else {
        // Subsequent messages - only include user input
        fullMessage = inputMessage
      }

      const newMessage: Message = {
        id: messages.length + 1,
        text: inputMessage,
        sender: 'user',
      }
      setMessages([...messages, newMessage])
      setInputMessage('')

      // Send message to background script
      chrome.runtime.sendMessage({
        type: 'CHAT_MESSAGE',
        text: fullMessage,
        isFirstMessage,
      })
    }
  }

  return (
    //independent style by just adding style={{ all: 'revert' }}
    <div className="fixed bottom-4  text-gray-700 right-4 z-[2147483647]">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-[#1a237e] text-white hover:bg-[#3949ab]"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
      {isOpen && (
        <div className="bg-white border border-border rounded-lg shadow-lg w-80 sm:w-96 flex flex-col">
          <div className=" bg-gradient-to-r from-[#1a237e] to-[#ad1457] text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-x-4 items-center">
                <img src={logoUrl} alt="Chat Icon" className="w-10 h-10 rounded-full" />
                <h3 className="font-semibold">Chat with us</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg p-2 max-w-[80%] whitespace-pre-wrap break-words ${
                    message.sender === 'user'
                      ? 'bg-[#ad1457] text-white'
                      : 'bg-[#e8eaf6] text-[#1a237e]'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#e8eaf6] rounded-lg p-3">
                  <svg
                    className="animate-spin h-5 w-5 text-[#1a237e]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-[#3949ab]">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex space-x-2"
            >
              <Input
                type="text"
                placeholder="Type a message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-[#e8eaf6] border-[#3949ab] focus:border-[#ad1457] focus:ring-[#ad1457]"
              />
              <Button
                type="submit"
                size="icon"
                className="bg-[#ad1457] text-white hover:bg-[#c2185b]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
