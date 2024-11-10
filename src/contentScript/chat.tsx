import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Send, MessageCircle } from 'lucide-react'
import TurndownService from 'turndown'
const logoUrl = chrome.runtime.getURL('icons/logo.svg')

interface Message {
  id: number
  text: string
  sender: 'user' | 'admin'
}

export default function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! How can I help you today?', sender: 'admin' },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (inputMessage.trim() !== '') {
      // Clone body content
      const tempDiv = document.body.cloneNode(true) as HTMLElement

      // Remove unwanted elements including the chat interface
      const elementsToRemove = tempDiv.querySelectorAll(
        'header, footer, [role="banner"], [role="contentinfo"], nav, script, style, link, meta, noscript, #crx-chat-root',
      )
      elementsToRemove.forEach((el) => el.remove())

      // Convert to Markdown
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        emDelimiter: '*',
        bulletListMarker: '-',
        hr: '---',
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

      // Combine page content and user message
      const fullMessage = `Page Content (Markdown):\n${markdown}\n\nUser Message:\n${inputMessage}`

      const newMessage: Message = {
        id: messages.length + 1,
        text: fullMessage,
        sender: 'user',
      }
      setMessages([...messages, newMessage])
      setInputMessage('')

      // Send message to background script
      chrome.runtime.sendMessage({ type: 'CHAT_MESSAGE', text: fullMessage }, (response) => {
        // Add the response from background script
        const adminResponse: Message = {
          id: messages.length + 2,
          text: response.reply,
          sender: 'admin',
        }
        setMessages((prevMessages) => [...prevMessages, adminResponse])
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
