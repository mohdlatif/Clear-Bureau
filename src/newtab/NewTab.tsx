import { useState, useEffect } from 'react'

import './NewTab.css'

export const NewTab = () => {
  const getTime = () => {
    const date = new Date()
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${hour}:${minute}`
  }

  const [time, setTime] = useState(getTime())

  useEffect(() => {
    let intervalId = setInterval(() => {
      setTime(getTime())
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  return (
    <section id="codebridge-root">
      <span className="text-red-500 font-bold">New Tab Page</span>
      <h1>{time}</h1>
    </section>
  )
}

export default NewTab
