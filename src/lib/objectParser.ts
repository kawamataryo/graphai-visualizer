import * as ts from "typescript";
import type * as vscode from "vscode";

/**
 * Searches for the object literal that includes the cursor position in the source file
 */
export function findObjectAtPosition(
  sourceCode: string,
  position: vscode.Position,
): ts.ObjectLiteralExpression | null {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
  );

  let targetNode: ts.ObjectLiteralExpression | null = null;

  // Convert cursor position to offset
  const offset = ts.getPositionOfLineAndCharacter(
    sourceFile,
    position.line,
    position.character,
  );

  function findNode(node: ts.Node): void {
    if (targetNode) return;

    // Check if the cursor position is within the node's range
    if (node.getStart() <= offset && offset <= node.getEnd()) {
      if (ts.isObjectLiteralExpression(node)) {
        targetNode = node;
      }

      // Recursively search child nodes
      node.forEachChild(findNode);
    }
  }

  sourceFile.forEachChild(findNode);
  return targetNode;
}

/**
 * Finds variable definition and retrieves its value
 */
function findVariableDefinition(
  sourceFile: ts.SourceFile,
  variableName: string,
): ts.Node | null {
  let result: ts.Node | null = null;

  function findVariable(node: ts.Node) {
    if (result) return;

    // Search for variable declarations
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer
    ) {
      result = node.initializer;
      return;
    }

    // Search for other declarations (e.g., export const)
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === variableName &&
          declaration.initializer
        ) {
          result = declaration.initializer;
        }
      }
    }

    // Search for properties in objects
    if (ts.isObjectLiteralExpression(node)) {
      for (const prop of node.properties) {
        if (
          ts.isPropertyAssignment(prop) &&
          ts.isIdentifier(prop.name) &&
          prop.name.text === variableName
        ) {
          result = prop.initializer;
        }
      }
    }

    // Search for module exports
    if (
      ts.isExportAssignment(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === variableName
    ) {
      result = node.expression;
    }

    node.forEachChild(findVariable);
  }

  sourceFile.forEachChild(findVariable);
  return result;
}

/**
 * Converts TypeScript AST nodes to a JSON-safe object
 * For variable references, it searches for the definition and retrieves its content
 */
export function convertToJsonSafeObject(
  node: ts.Node,
  sourceFile?: ts.SourceFile,
): any {
  // For object literals
  if (ts.isObjectLiteralExpression(node)) {
    const result: Record<string, any> = {};
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const nameNode = prop.name;
        let propName: string;

        if (ts.isIdentifier(nameNode)) {
          propName = nameNode.text;
        } else if (ts.isStringLiteral(nameNode)) {
          propName = nameNode.text;
        } else {
          propName = nameNode.getText();
        }

        // If the initializer is a variable reference, find its definition
        if (ts.isIdentifier(prop.initializer) && sourceFile) {
          const variableName = prop.initializer.text;
          const variableDefinition = findVariableDefinition(
            sourceFile,
            variableName,
          );

          if (variableDefinition) {
            result[propName] = convertToJsonSafeObject(
              variableDefinition,
              sourceFile,
            );
          } else {
            result[propName] = `<expr>${variableName}</expr>`;
          }
        } else if (
          ts.isFunctionExpression(prop.initializer) ||
          ts.isArrowFunction(prop.initializer)
        ) {
          result[propName] = "<expr>AnonymousFunctionAgent</expr>";
        } else {
          result[propName] = convertToJsonSafeObject(
            prop.initializer,
            sourceFile,
          );
        }
      } else if (ts.isShorthandPropertyAssignment(prop)) {
        const propName = prop.name.text;

        // For shorthand properties, also find their definitions
        if (sourceFile) {
          const variableDefinition = findVariableDefinition(
            sourceFile,
            propName,
          );
          if (variableDefinition) {
            result[propName] = convertToJsonSafeObject(
              variableDefinition,
              sourceFile,
            );
          } else {
            result[propName] = `<expr>${propName}</expr>`;
          }
        } else {
          result[propName] = `<expr>${propName}</expr>`;
        }
      } else if (ts.isSpreadAssignment(prop)) {
        const spreadExpr = prop.expression;

        // For spread operators, find the referenced object and expand its properties
        if (ts.isIdentifier(spreadExpr) && sourceFile) {
          const variableName = spreadExpr.text;
          const variableDefinition = findVariableDefinition(
            sourceFile,
            variableName,
          );

          if (
            variableDefinition &&
            ts.isObjectLiteralExpression(variableDefinition)
          ) {
            // Expand the properties of the spread object
            const spreadObj = convertToJsonSafeObject(
              variableDefinition,
              sourceFile,
            );
            Object.assign(result, spreadObj);
          } else {
            result[`...${spreadExpr.getText()}`] =
              `<expr>${spreadExpr.getText()}</expr>`;
          }
        } else {
          result[`...${spreadExpr.getText()}`] =
            `<expr>${spreadExpr.getText()}</expr>`;
        }
      }
    }
    return result;
  }

  // For array literals
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => {
      // If array element is a variable reference
      if (ts.isIdentifier(element) && sourceFile) {
        const variableName = element.text;
        const variableDefinition = findVariableDefinition(
          sourceFile,
          variableName,
        );

        if (variableDefinition) {
          return convertToJsonSafeObject(variableDefinition, sourceFile);
        }
      }
      return convertToJsonSafeObject(element, sourceFile);
    });
  }

  // For variable references
  if (ts.isIdentifier(node) && sourceFile) {
    const variableName = node.text;
    const variableDefinition = findVariableDefinition(sourceFile, variableName);

    if (variableDefinition) {
      return convertToJsonSafeObject(variableDefinition, sourceFile);
    }
    return `<expr>${variableName}</expr>`;
  }

  // For primitive values
  if (ts.isStringLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
    return "<expr>undefined</expr>";
  }

  // For template strings
  if (ts.isTemplateExpression(node)) {
    return `<expr>${node.getText()}</expr>`;
  }

  // For other expressions and variable references, treat as strings
  return `<expr>${node.getText()}</expr>`;
}

/**
 * Parses an object from the entire file with all references resolved
 */
export function parseObjectWithReferences(
  sourceCode: string,
  position: vscode.Position,
): null | string {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
  );

  const objectNode = findObjectAtPosition(sourceCode, position);
  if (!objectNode) return null;

  return convertToJsonSafeObject(objectNode, sourceFile);
}
