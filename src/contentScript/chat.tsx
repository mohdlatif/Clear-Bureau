import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Send, MessageCircle, Volume2, VolumeX, FileText, FileSearch } from 'lucide-react'
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
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speechSynthesis = window.speechSynthesis
  const recognition = new (window as any).webkitSpeechRecognition()

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

      // Convert messages to alternating user/assistant format
      const messageHistory = messages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      }))

      // Send message to background script
      chrome.runtime.sendMessage({
        type: 'CHAT_MESSAGE',
        text: inputMessage,
        messageHistory: messageHistory, // This will now contain the alternating pattern
      })

      const newMessage: Message = {
        id: messages.length + 1,
        text: inputMessage,
        sender: 'user',
      }
      setMessages([...messages, newMessage])
      setInputMessage('')
    }
  }

  const toggleSpeech = (text: string) => {
    if (isSpeaking) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setIsSpeaking(false)
    speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }

  const handleQuickAction = async (action: 'simplify' | 'summarize') => {
    setIsLoading(true)

    const turndownService = new TurndownService()
    const tempDiv = document.body.cloneNode(true) as HTMLElement
    const markdown = turndownService.turndown(tempDiv.innerHTML)

    const prompt =
      action === 'simplify'
        ? 'Please simplify this page content for easier understanding'
        : 'Please provide a concise summary of this page content'

    const newMessage: Message = {
      id: messages.length + 1,
      text: prompt,
      sender: 'user',
    }

    setMessages([...messages, newMessage])

    chrome.runtime.sendMessage({
      type: 'CHAT_MESSAGE',
      text: `Page Content:\n${markdown}\n\n${prompt}`,
      messageHistory: [],
      isFirstMessage: true,
    })
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
                <div className="flex flex-col">
                  <h3 className="font-semibold">Clear Bureau</h3>
                  <p className="text-gray-400 text-[11px]">Government Services Made Easy</p>
                </div>
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
            {messages.length === 1 && ( // Only show when there's just the initial greeting
              <div className="flex flex-col gap-3 mb-4">
                <div className="text-center text-sm text-gray-500 mb-2">
                  Choose an action to begin
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-[#1a237e] text-[#1a237e] hover:bg-[#1a237e] hover:text-white"
                    onClick={() => handleQuickAction('simplify')}
                    disabled={isLoading}
                  >
                    <FileText className="h-4 w-4" />
                    Simplify Page
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-[#1a237e] text-[#1a237e] hover:bg-[#1a237e] hover:text-white"
                    onClick={() => handleQuickAction('summarize')}
                    disabled={isLoading}
                  >
                    <FileSearch className="h-4 w-4" />
                    Get Summary
                  </Button>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`rounded-lg p-2 max-w-[80%] whitespace-pre-wrap break-words ${
                      message.sender === 'user'
                        ? 'bg-[#ad1457] text-white'
                        : 'bg-[#e8eaf6] text-[#1a237e]'
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.sender === 'admin' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleSpeech(message.text)}
                    >
                      {isSpeaking ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
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
