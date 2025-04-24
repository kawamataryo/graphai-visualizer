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
 n_input(input)
 n_output(output<br/><span class="agent-name">echoAgent</span>)
 n_input --> n_output
class n_input staticNode
class n_output computedNode
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
 n_fruits(fruits)
 n_shift -- array --> n_fruits
 n_result(result)
 n_reducer --> n_result
 n_shift(shift<br/><span class="agent-name">shiftAgent</span>)
 n_fruits --> n_shift
 n_prompt(prompt<br/><span class="agent-name">stringTemplateAgent</span>)
 n_shift -- item --> n_prompt
 n_llm(llm<br/><span class="agent-name">openAIAgent</span>)
 n_prompt --> n_llm
 n_reducer(reducer<br/><span class="agent-name">pushAgent</span>)
 n_result --> n_reducer
 n_llm -- choices.$0.message.content --> n_reducer
class n_fruits,n_result staticNode
class n_shift,n_prompt,n_llm,n_reducer computedNode
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
 n_continue(continue)
 n_checkInput -- continue --> n_continue
 n_messages(messages)
 n_reducer --> n_messages
 n_userInput(userInput<br/><span class="agent-name">textInputAgent</span>)
 n_checkInput(checkInput<br/><span class="agent-name">propertyFilterAgent</span>)
 n_userInput --> n_checkInput
 n_userMessage(userMessage<br/><span class="agent-name">propertyFilterAgent</span>)
 n_userInput --> n_userMessage
 n_appendedMessages(appendedMessages<br/><span class="agent-name">pushAgent</span>)
 n_messages --> n_appendedMessages
 n_userMessage --> n_appendedMessages
 n_llm(llm<br/><span class="agent-name">openAIAgent</span>)
 n_appendedMessages --> n_llm
 n_output(output<br/><span class="agent-name">stringTemplateAgent</span>)
 n_llm -- choices.$0.message.content --> n_output
 n_reducer(reducer<br/><span class="agent-name">pushAgent</span>)
 n_appendedMessages --> n_reducer
 n_llm -- choices.$0.message --> n_reducer
class n_continue,n_messages staticNode
class n_userInput,n_checkInput,n_userMessage,n_appendedMessages,n_llm,n_output,n_reducer computedNode
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
 n_input(input)
 n_output(output<br/><span class="agent-name">echoAgent</span>)
 n_input --> n_output
class n_input staticNode
class n_output computedNode
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
 n_fruits(fruits)
 n_shift -- array --> n_fruits
 n_result(result)
 n_reducer --> n_result
 n_shift(shift<br/><span class="agent-name">shiftAgent</span>)
 n_fruits --> n_shift
 n_prompt(prompt<br/><span class="agent-name">stringTemplateAgent</span>)
 n_shift -- item --> n_prompt
 n_llm(llm<br/><span class="agent-name">openAIAgent</span>)
 n_prompt --> n_llm
 n_reducer(reducer<br/><span class="agent-name">pushAgent</span>)
 n_result --> n_reducer
 n_llm -- choices.$0.message.content --> n_reducer
class n_fruits,n_result staticNode
class n_shift,n_prompt,n_llm,n_reducer computedNode
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
 n_fruits(fruits)
 n_fruits --> n_map
 subgraph n_map[map: <span class="agent-name">mapAgent</span>]
  n_map.llm(llm<br/><span class="agent-name">openAIAgent</span>)
  n_map.row --> n_map.llm
  n_map.result(result<br/><span class="agent-name">copyAgent</span>)
  n_map.llm -- text --> n_map.result
 end
class n_fruits staticNode
class n_map.llm,n_map.result computedNode
class n_map nestedGraph
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
 n_source1(source1)
 n_source2(source2)
 n_source3(source3)
 n_source4(source4)
 n_source1 -- fruit --> n_nestedNode
 n_source2 -- fruit --> n_nestedNode
 n_source3 -- fruit --> n_nestedNode
 n_source4 -- fruit --> n_nestedNode
 subgraph n_nestedNode[nestedNode: <span class="agent-name">mapAgent</span>]
  n_nestedNode.node2(node2<br/><span class="agent-name">stringTemplateAgent</span>)
 end
 n_result(result<br/><span class="agent-name">sleeperAgent</span>)
 n_nestedNode --> n_result
class n_source1,n_source2,n_source3,n_source4 staticNode
class n_nestedNode.node2,n_result computedNode
class n_nestedNode nestedGraph
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
 n_document(document<br/><span class="agent-name">fetchAgent</span>)
 n_sampleGraph(sampleGraph<br/><span class="agent-name">fetchAgent</span>)
 n_graphGenerator(graphGenerator<br/><span class="agent-name">openAIAgent</span>)
 n_document --> n_graphGenerator
 n_sampleGraph --> n_graphGenerator
 n_graphGenerator -- text.codeBlock().jsonParse() --> n_executer
 subgraph n_executer[executer: <span class="agent-name">nestedAgent</span>]
 end
class n_document,n_sampleGraph,n_graphGenerator computedNode
class n_executer nestedGraph
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
