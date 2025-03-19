import { describe, expect, it } from "vitest";
import { codeToMermaid } from "./codeToMermaid";

describe("codeToMermaid -- yaml", () => {
  const testCases = [
    {
      name: "should convert simple two-node structure",
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
 input --> output
class input staticNode
class output computedNode
`.trim(),
    },
    {
      name: "should correctly convert basic node structure",
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
 shift -- array --> fruits
 result(result)
 reducer --> result
 shift(shift<br/><span class="agent-name">shiftAgent</span>)
 fruits --> shift
 prompt(prompt<br/><span class="agent-name">stringTemplateAgent</span>)
 shift -- item --> prompt
 llm(llm<br/><span class="agent-name">openAIAgent</span>)
 prompt --> llm
 reducer(reducer<br/><span class="agent-name">pushAgent</span>)
 result --> reducer
 llm -- choices.$0.message.content --> reducer
class fruits,result staticNode
class shift,prompt,llm,reducer computedNode
`.trim(),
    },
    {
      name: "should convert nodes with multiple inputs",
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
 checkInput -- continue --> continue
 messages(messages)
 reducer --> messages
 userInput(userInput<br/><span class="agent-name">textInputAgent</span>)
 checkInput(checkInput<br/><span class="agent-name">propertyFilterAgent</span>)
 userInput --> checkInput
 userMessage(userMessage<br/><span class="agent-name">propertyFilterAgent</span>)
 userInput --> userMessage
 appendedMessages(appendedMessages<br/><span class="agent-name">pushAgent</span>)
 messages --> appendedMessages
 userMessage --> appendedMessages
 llm(llm<br/><span class="agent-name">openAIAgent</span>)
 appendedMessages --> llm
 output(output<br/><span class="agent-name">stringTemplateAgent</span>)
 llm -- choices.$0.message.content --> output
 reducer(reducer<br/><span class="agent-name">pushAgent</span>)
 appendedMessages --> reducer
 llm -- choices.$0.message --> reducer
class continue,messages staticNode
class userInput,checkInput,userMessage,appendedMessages,llm,output,reducer computedNode
`.trim(),
    },
  ];

  for (const { name, yaml, expected } of testCases) {
    it(name, () => {
      const result = codeToMermaid(yaml, "yaml");
      expect(result).toBe(expected);
    });
  }
});

describe("codeToMermaid -- json", () => {
  const testCases = [
    {
      name: "should convert simple two-node structure",
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
 input --> output
class input staticNode
class output computedNode
`.trim(),
    },
    {
      name: "should correctly convert basic node structure",
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
 shift -- array --> fruits
 result(result)
 reducer --> result
 shift(shift<br/><span class="agent-name">shiftAgent</span>)
 fruits --> shift
 prompt(prompt<br/><span class="agent-name">stringTemplateAgent</span>)
 shift -- item --> prompt
 llm(llm<br/><span class="agent-name">openAIAgent</span>)
 prompt --> llm
 reducer(reducer<br/><span class="agent-name">pushAgent</span>)
 result --> reducer
 llm -- choices.$0.message.content --> reducer
class fruits,result staticNode
class shift,prompt,llm,reducer computedNode
`.trim(),
    },
  ];

  for (const { name, json, expected } of testCases) {
    it(name, () => {
      const result = codeToMermaid(json, "json");
      expect(result).toBe(expected);
    });
  }
});

describe("codeToMermaid -- yaml, nested nodes", () => {
  const testCases = [
    {
      name: "should convert simple nested nodes with iterative inputs",
      yaml: `
version: 0.5
nodes:
  fruits:
    value: [apple, lemomn, banana]
  map:
    agent: mapAgent
    inputs:
      rows: :fruits
    isResult: true
    graph:
      nodes:
        llm:
          agent: openAIAgent
          params:
            model: gpt-4o
          inputs:
            prompt: What is the typical color of \${:row}? Just answer the color.
        result:
          agent: copyAgent
          params:
            namedKey: item
          inputs:
            item: :llm.text
          isResult: true
`,
      expected: `
flowchart TD
 fruits(fruits)
 fruits --> map
 subgraph map[map: <span class="agent-name">mapAgent</span>]
  map.llm(llm<br/><span class="agent-name">openAIAgent</span>)
  map.row --> map.llm
  map.result(result<br/><span class="agent-name">copyAgent</span>)
  map.llm -- text --> map.result
 end
class fruits staticNode
class map.llm,map.result computedNode
class map nestedGraph
`.trim(),
    },
    {
      name: "should convert nested node with template input",
      yaml: `
version: 0.5
nodes:
  source1:
    value:
      fruit: apple
  source2:
    value:
      fruit: orange
  source3:
    value:
      fruit: banana
  source4:
    value:
      fruit: lemon
  nestedNode:
    agent: mapAgent
    inputs:
      rows:
        - :source1.fruit
        - :source2.fruit
        - :source3.fruit
        - :source4.fruit
    graph:
      version: 0.5
      nodes:
        node2:
          agent: stringTemplateAgent
          params:
            template: "I love \${row}."
          inputs: row :row
          isResult: true
  result:
    agent: sleeperAgent
    inputs:
      array: [:nestedNode]
    isResult: true
`,
      expected: `
flowchart TD
 source1(source1)
 source2(source2)
 source3(source3)
 source4(source4)
 source1 -- fruit --> nestedNode
 source2 -- fruit --> nestedNode
 source3 -- fruit --> nestedNode
 source4 -- fruit --> nestedNode
 subgraph nestedNode[nestedNode: <span class="agent-name">mapAgent</span>]
  nestedNode.node2(node2<br/><span class="agent-name">stringTemplateAgent</span>)
 end
 result(result<br/><span class="agent-name">sleeperAgent</span>)
 nestedNode --> result
class source1,source2,source3,source4 staticNode
class nestedNode.node2,result computedNode
class nestedNode nestedGraph
`.trim(),
    },
    {
      name: "should convert dynamic nested node",
      yaml: `
version: 0.5
nodes:
  document:
    agent: fetchAgent
    console:
      before: ...fetching document
    params:
      type: text
    inputs:
      url: https://raw.githubusercontent.com/receptron/graphai/main/packages/graphai/README.md
  sampleGraph:
    agent: fetchAgent
    console:
      before: ...fetching sample graph
    params:
      type: text
    inputs:
      url: https://raw.githubusercontent.com/receptron/graphai/refs/heads/main/packages/samples/graph_data/openai/reception.yaml
  graphGenerator:
    agent: openAIAgent
    console:
      before: ...generating a new graph
    params:
      model: gpt-4o
    inputs:
      prompt: Name, Address and Phone Number
      messages:
        - role: system
          content: >-
            You an expert in GraphAI programming. You are responsible in
            generating a graphAI graph to get required information from the
            user.

            graphAI graph outputs in json format

            [documation of GraphAI]

            \${:document}
        - role: user
          content: Name, Date of Birth and Gendar
        - role: assistant
          content: |
            \`\`\`json
            \${:sampleGraph}
            \`\`\`
  executer:
    agent: nestedAgent
    graph: :graphGenerator.text.codeBlock().jsonParse()
    isResult: true
`,
      expected: `
flowchart TD
 document(document<br/><span class="agent-name">fetchAgent</span>)
 sampleGraph(sampleGraph<br/><span class="agent-name">fetchAgent</span>)
 graphGenerator(graphGenerator<br/><span class="agent-name">openAIAgent</span>)
 document --> graphGenerator
 sampleGraph --> graphGenerator
 graphGenerator -- text.codeBlock().jsonParse() --> executer
 subgraph executer[executer: <span class="agent-name">nestedAgent</span>]
 end
class document,sampleGraph,graphGenerator computedNode
class executer nestedGraph
`.trim(),
    },
  ];

  for (const { name, yaml, expected } of testCases) {
    it(name, () => {
      const result = codeToMermaid(yaml, "yaml");
      expect(result).toBe(expected);
    });
  }
});
