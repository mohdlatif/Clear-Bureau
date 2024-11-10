import { useState, useEffect } from 'react'
import './Popup.css'

interface Settings {
  responseTone: 'formal' | 'friendly' | 'simplified'
  apiKey: string
  apiService: 'clearBureau' | 'custom'
  apiType: 'llama' | 'openai'
}

export const Popup = () => {
  const [settings, setSettings] = useState<Settings>({
    responseTone: 'friendly',
    apiKey: '',
    apiService: 'clearBureau',
    apiType: 'openai',
  })

  // Load settings on mount
  useEffect(() => {
    chrome.storage.sync.get(['settings'], (result) => {
      if (result.settings) {
        setSettings(result.settings)
      }
    })
  }, [])

  // Save settings whenever they change
  useEffect(() => {
    chrome.storage.sync.set({ settings })
  }, [settings])

  return (
    <main className="p-4 min-w-[300px]">
      <h3 className="text-lg font-semibold mb-4">Settings</h3>

      {/* Response Tone Section */}
      <div className="mb-4">
        <label className="font-medium block mb-2">Preferred Response Tone</label>
        <select
          value={settings.responseTone}
          onChange={(e) =>
            setSettings({ ...settings, responseTone: e.target.value as Settings['responseTone'] })
          }
          className="w-full p-2 border rounded"
        >
          <option value="formal">Formal</option>
          <option value="friendly">Friendly</option>
          <option value="simplified">Simplified</option>
        </select>
      </div>

      {/* API Configuration Section */}
      <div className="mb-4">
        <label className="font-medium block mb-2">API Service</label>
        <select
          value={settings.apiService}
          onChange={(e) =>
            setSettings({ ...settings, apiService: e.target.value as Settings['apiService'] })
          }
          className="w-full p-2 border rounded mb-2"
        >
          <option value="clearBureau">Clear Bureau API</option>
          <option value="custom">Custom API</option>
        </select>

        {settings.apiService === 'custom' && (
          <>
            <label className="font-medium block mb-2">API Type</label>
            <select
              value={settings.apiType}
              onChange={(e) =>
                setSettings({ ...settings, apiType: e.target.value as Settings['apiType'] })
              }
              className="w-full p-2 border rounded mb-2"
            >
              <option value="llama">Llama</option>
              <option value="openai">OpenAI</option>
            </select>

            <label className="font-medium block mb-2">API Key</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Enter your API key"
            />
          </>
        )}
      </div>

      <div className="text-sm text-gray-500 mt-4">Settings are automatically saved</div>
    </main>
  )
}

export default Popup

// chrome.storage.sync.get(['settings'], (result) => {
//   const settings = result.settings
//   // Use settings here
// })
