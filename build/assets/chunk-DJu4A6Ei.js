chrome.runtime.onMessage.addListener((e,r,s)=>(e.type==="CHAT_MESSAGE"&&setTimeout(()=>{const t=e.isFirstMessage?`Processed first message with page content: ${e.text} haha`:`Processed follow-up message: ${e.text} haha`;s({reply:t})},2e3),!0));