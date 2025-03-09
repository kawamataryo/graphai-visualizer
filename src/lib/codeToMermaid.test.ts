import { describe, it, expect } from 'vitest';
import { codeToMermaid } from './codeToMermaid';

describe('codeToMermaid -- yaml', () => {
  const testCases = [
    {
      name: 'should convert simple two-node structure',
      yaml: `
nodes:
  input:
    value: "Hello, world!"
  output:
    agent: echoAgent
    inputs:
      message: :input
`,
      expected: `
flowchart TD
 input(input)
 output(output<br/><span class="agent-name">echoAgent</span>)
 input(input) --> output
class input staticNode
class output computedNode
`.trim()
    },
    {
      name: 'should correctly convert basic node structure',
      yaml: `
version: 0.5
loop:
  while: :fruits
nodes:
  fruits:
    value: [apple, lemon, banana]
    update: :shift.array
  result:
    value: []
    update: :reducer
    isResult: true
  shift:
    agent: shiftAgent
    inputs:
      array: :fruits
  prompt:
    agent: stringTemplateAgent
    params:
      template: What is the typical color of \${0}? Just answer the color.
    inputs: [:shift.item]
  llm:
    agent: openAIAgent
    params:
      model: gpt-4o
    inputs:
      prompt: :prompt
  reducer:
    agent: pushAgent
    inputs:
      array: :result
      item: :llm.choices.$0.message.content
`,
      expected: `
flowchart TD
 fruits(fruits)
 shift(shift<br/><span class="agent-name">shiftAgent</span>) -- array --> fruits
 result(result)
 reducer(reducer<br/><span class="agent-name">pushAgent</span>) --> result
 shift(shift<br/><span class="agent-name">shiftAgent</span>)
 fruits(fruits) --> shift
 prompt(prompt<br/><span class="agent-name">stringTemplateAgent</span>)
 shift(shift<br/><span class="agent-name">shiftAgent</span>) -- item --> prompt
 llm(llm<br/><span class="agent-name">openAIAgent</span>)
 prompt(prompt<br/><span class="agent-name">stringTemplateAgent</span>) --> llm
 reducer(reducer<br/><span class="agent-name">pushAgent</span>)
 result(result) --> reducer
 llm(llm<br/><span class="agent-name">openAIAgent</span>) -- choices.$0.message.content --> reducer
class fruits,result staticNode
class shift,prompt,llm,reducer computedNode
`.trim()
    },
    {
      name: 'should convert nodes with multiple inputs',
      yaml: `
version: 0.5
loop:
  while: :continue
nodes:
  continue:
    value: true
    update: :checkInput.continue
  messages:
    value: []
    update: :reducer
  userInput:
    agent: textInputAgent
    params:
      message: "You:"
  checkInput:
    agent: propertyFilterAgent
    params:
      inspect:
        - propId: continue
          notEqual: /bye
    inputs:
      - {}
      - :userInput
  userMessage:
    agent: propertyFilterAgent
    params:
      inject:
        - propId: content
          from: 1
    inputs:
      - role: user
      - :userInput
  appendedMessages:
    agent: pushAgent
    inputs:
      array: :messages
      item: :userMessage
  llm:
    agent: openAIAgent
    inputs:
      messages: :appendedMessages
  output:
    agent: stringTemplateAgent
    params:
      template: "\e[32mLLM\e[0m: ${0}"
    console:
      after: true
    inputs:
      - :llm.choices.$0.message.content
  reducer:
    agent: pushAgent
    inputs:
      array: :appendedMessages
      item: :llm.choices.$0.message

`,
      expected: `
flowchart TD
 continue(continue)
 checkInput(checkInput<br/><span class="agent-name">propertyFilterAgent</span>) -- continue --> continue
 messages(messages)
 reducer(reducer<br/><span class="agent-name">pushAgent</span>) --> messages
 userInput(userInput<br/><span class="agent-name">textInputAgent</span>)
 checkInput(checkInput<br/><span class="agent-name">propertyFilterAgent</span>)
 userInput(userInput<br/><span class="agent-name">textInputAgent</span>) --> checkInput
 userMessage(userMessage<br/><span class="agent-name">propertyFilterAgent</span>)
 userInput(userInput<br/><span class="agent-name">textInputAgent</span>) --> userMessage
 appendedMessages(appendedMessages<br/><span class="agent-name">pushAgent</span>)
 messages(messages) --> appendedMessages
 userMessage(userMessage<br/><span class="agent-name">propertyFilterAgent</span>) --> appendedMessages
 llm(llm<br/><span class="agent-name">openAIAgent</span>)
 appendedMessages(appendedMessages<br/><span class="agent-name">pushAgent</span>) --> llm
 output(output<br/><span class="agent-name">stringTemplateAgent</span>)
 llm(llm<br/><span class="agent-name">openAIAgent</span>) -- choices.$0.message.content --> output
 reducer(reducer<br/><span class="agent-name">pushAgent</span>)
 appendedMessages(appendedMessages<br/><span class="agent-name">pushAgent</span>) --> reducer
 llm(llm<br/><span class="agent-name">openAIAgent</span>) -- choices.$0.message --> reducer
class continue,messages staticNode
class userInput,checkInput,userMessage,appendedMessages,llm,output,reducer computedNode
`.trim()
    }
  ];

  testCases.forEach(({ name, yaml, expected }) => {
    it(name, () => {
      const result = codeToMermaid(yaml, 'yaml');
      expect(result).toBe(expected);
    });
  });
});

describe('codeToMermaid -- json', () => {
  const testCases = [
    {
      name: 'should convert simple two-node structure',
      json: `{
  "nodes": {
    "input": {
      "value": "Hello, world!"
    },
    "output": {
      "agent": "echoAgent",
      "inputs": {
        "message": ":input"
      }
    }
  }
}`,
      expected: `
flowchart TD
 input(input)
 output(output<br/><span class="agent-name">echoAgent</span>)
 input(input) --> output
class input staticNode
class output computedNode
`.trim()
    },
    {
      name: 'should correctly convert basic node structure',
      json: `{
  "version": "0.5",
  "loop": {
    "while": ":fruits"
  },
  "nodes": {
    "fruits": {
      "value": ["apple", "lemon", "banana"],
      "update": ":shift.array"
    },
    "result": {
      "value": [],
      "update": ":reducer",
      "isResult": true
    },
    "shift": {
      "agent": "shiftAgent",
      "inputs": {
        "array": ":fruits"
      }
    },
    "prompt": {
      "agent": "stringTemplateAgent",
      "params": {
        "template": "What is the typical color of \${0}? Just answer the color."
      },
      "inputs": [":shift.item"]
    },
    "llm": {
      "agent": "openAIAgent",
      "params": {
        "model": "gpt-4o"
      },
      "inputs": {
        "prompt": ":prompt"
      }
    },
    "reducer": {
      "agent": "pushAgent",
      "inputs": {
        "array": ":result",
        "item": ":llm.choices.$0.message.content"
      }
    }
  }
}`,
      expected: `
flowchart TD
 fruits(fruits)
 shift(shift<br/><span class="agent-name">shiftAgent</span>) -- array --> fruits
 result(result)
 reducer(reducer<br/><span class="agent-name">pushAgent</span>) --> result
 shift(shift<br/><span class="agent-name">shiftAgent</span>)
 fruits(fruits) --> shift
 prompt(prompt<br/><span class="agent-name">stringTemplateAgent</span>)
 shift(shift<br/><span class="agent-name">shiftAgent</span>) -- item --> prompt
 llm(llm<br/><span class="agent-name">openAIAgent</span>)
 prompt(prompt<br/><span class="agent-name">stringTemplateAgent</span>) --> llm
 reducer(reducer<br/><span class="agent-name">pushAgent</span>)
 result(result) --> reducer
 llm(llm<br/><span class="agent-name">openAIAgent</span>) -- choices.$0.message.content --> reducer
class fruits,result staticNode
class shift,prompt,llm,reducer computedNode
`.trim()
    }
  ];

  testCases.forEach(({ name, json, expected }) => {
    it(name, () => {
      const result = codeToMermaid(json, 'json');
      expect(result).toBe(expected);
    });
  });
});
