const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      if (result['openai-key']) {
        const decodedKey = atob(result['openai-key']);
        resolve(decodedKey);
      }
    });
  });
};

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        }
      }
    );
  });
};


const generate = async (prompt) => {
    // Get your API key from storage
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';
	
  // Call completions endpoint
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1250,
      temperature: 0.7,
    }),
  });
	
  // Select the top choice and send back
  const completion = await completionResponse.json();
  return completion.choices.pop();
}

const generateCompletionAction = async (info) => {
    try {
        sendMessage('generating...');
        const { selectionText } = info;
        const basePromptPrefix = `Write me a lengthy and detailed statement of purpose for a master's university application to a department. The statement should be in the style of Paul Graham writing an application with the title below. Please make sure the document goes in-depth on the topic, shows that the writer did their research, show creativity
        University: *user-input
        Title:`;
        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);

        const secondPrompt = `
        Take the statement of purpose below and make it more passionate, detailed annd succinct. Written in the style of Dan Brown.
        Title: ${selectionText}
        Content: ${baseCompletion.text}
        Essay: 
		  `;
      
      const secondPromptCompletion = await generate(secondPrompt);
      sendMessage(secondPromptCompletion.text);
      } catch (error) {
        console.log(error);
        sendMessage(error.toString());
      }
};

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'context-run',
      title: 'Generate SOP',
      contexts: ['selection'],
    });
  });
  
  // Add listener
  chrome.contextMenus.onClicked.addListener(generateCompletionAction);