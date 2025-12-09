# Module: self-documentation-generator

## Overview

- **Category**: core
- **File**: self-documentation-generator.js
- **Lines of Code**: 893
- **Class**: SelfDocumentationGenerator

## Description

Module description

## Configuration

- `docsDir`
- `scanInterval`
- `autoUpdate`
- `includeExamples`
- `generateDiagrams`
- `formats`
- `languages`
- `detailLevel`

## Constructor

```javascript
new SelfDocumentationGenerator(options);
```

### Options

- `options = {}`

## Methods

### initialize()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.config.autoUpdate)

- **Parameters**: `this.config.autoUpdate`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### createDirectories()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const dir of dirs)

- **Parameters**: `const dir of dirs`
- **Returns**: _To be documented_

### scanCodebase()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### scanDirectory(dir)

_(async)_

- **Parameters**: `dir`
- **Returns**: _To be documented_

### for(const entry of entries)

- **Parameters**: `const entry of entries`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### analyzeFile(filePath)

_(async)_

- **Parameters**: `filePath`
- **Returns**: _To be documented_

### if(functionName)

- **Parameters**: `functionName`
- **Returns**: _To be documented_

### if(module)

- **Parameters**: `module`
- **Returns**: _To be documented_

### if(analysis.hasDocumentation)

- **Parameters**: `analysis.hasDocumentation`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### getLineNumber(content, index)

- **Parameters**: `content`, `index`
- **Returns**: _To be documented_

### extractParameters(functionSignature)

- **Parameters**: `functionSignature`
- **Returns**: _To be documented_

### if(paramMatch && paramMatch[1])

- **Parameters**: `paramMatch && paramMatch[1]`
- **Returns**: _To be documented_

### extractClassMethods(content, classStartIndex)

- **Parameters**: `content`, `classStartIndex`
- **Returns**: _To be documented_

### if(methodName !== 'constructor')

- **Parameters**: `methodName !== 'constructor'`
- **Returns**: _To be documented_

### findClassEnd(content)

- **Parameters**: `content`
- **Returns**: _To be documented_

### for(let i = 0; i < content.length; i++)

- **Parameters**: `let i = 0; i < content.length; i++`
- **Returns**: _To be documented_

### if(content[i] === '{')

- **Parameters**: `content[i] === '{'`
- **Returns**: _To be documented_

### if(content[i] === '}')

- **Parameters**: `content[i] === '}'`
- **Returns**: _To be documented_

### if(inClass && braceCount === 0)

- **Parameters**: `inClass && braceCount === 0`
- **Returns**: _To be documented_

### generateAllDocumentation()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.config.includeExamples)

- **Parameters**: `this.config.includeExamples`
- **Returns**: _To be documented_

### generateAPIDocumentation()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const [filePath, analysis] of this.codeStructure)

- **Parameters**: `const [filePath`, `analysis] of this.codeStructure`
- **Returns**: _To be documented_

### for(const classInfo of analysis.classes)

- **Parameters**: `const classInfo of analysis.classes`
- **Returns**: _To be documented_

### for(const functionInfo of analysis.functions)

- **Parameters**: `const functionInfo of analysis.functions`
- **Returns**: _To be documented_

### documentClass(classInfo, analysis)

_(async)_

- **Parameters**: `classInfo`, `analysis`
- **Returns**: _To be documented_

### for(const method of classInfo.methods)

- **Parameters**: `const method of classInfo.methods`
- **Returns**: _To be documented_

### if(this.config.includeExamples)

- **Parameters**: `this.config.includeExamples`
- **Returns**: _To be documented_

### documentFunction(functionInfo, analysis)

_(async)_

- **Parameters**: `functionInfo`, `analysis`
- **Returns**: _To be documented_

### if(this.config.includeExamples)

- **Parameters**: `this.config.includeExamples`
- **Returns**: _To be documented_

### findDocComment(line, comments)

- **Parameters**: `line`, `comments`
- **Returns**: _To be documented_

### for(const comment of comments)

- **Parameters**: `const comment of comments`
- **Returns**: _To be documented_

### if(comment.isJSDoc && comment.line < line)

- **Parameters**: `comment.isJSDoc && comment.line < line`
- **Returns**: _To be documented_

### if(distance < minDistance && distance <= 3)

- **Parameters**: `distance < minDistance && distance <= 3`
- **Returns**: _To be documented_

### if(closestComment)

- **Parameters**: `closestComment`
- **Returns**: _To be documented_

### parseJSDoc(jsdocText)

- **Parameters**: `jsdocText`
- **Returns**: _To be documented_

### generateMethodDescription(method)

- **Parameters**: `method`
- **Returns**: _To be documented_

### inferReturnType(item)

- **Parameters**: `item`
- **Returns**: _To be documented_

### if(item.isAsync)

- **Parameters**: `item.isAsync`
- **Returns**: _To be documented_

### generateClassExample(classInfo)

- **Parameters**: `classInfo`
- **Returns**: _To be documented_

### generateFunctionExample(functionInfo)

- **Parameters**: `functionInfo`
- **Returns**: _To be documented_

### generateUsageExample(functionInfo)

- **Parameters**: `functionInfo`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### generateMethodExamples(method)

- **Parameters**: `method`
- **Returns**: _To be documented_

### saveAPIDocumentation(apiDocs)

_(async)_

- **Parameters**: `apiDocs`
- **Returns**: _To be documented_

### for(const classDoc of apiDocs.classes)

- **Parameters**: `const classDoc of apiDocs.classes`
- **Returns**: _To be documented_

### for(const functionDoc of apiDocs.functions)

- **Parameters**: `const functionDoc of apiDocs.functions`
- **Returns**: _To be documented_

### convertToMarkdown(apiDocs)

- **Parameters**: `apiDocs`
- **Returns**: _To be documented_

### for(const module of apiDocs.modules)

- **Parameters**: `const module of apiDocs.modules`
- **Returns**: _To be documented_

### if(module.classes?.length > 0)

- **Parameters**: `module.classes?.length > 0`
- **Returns**: _To be documented_

### if(module.functions?.length > 0)

- **Parameters**: `module.functions?.length > 0`
- **Returns**: _To be documented_

### for(const classDoc of apiDocs.classes)

- **Parameters**: `const classDoc of apiDocs.classes`
- **Returns**: _To be documented_

### if(classDoc.extends)

- **Parameters**: `classDoc.extends`
- **Returns**: _To be documented_

### if(classDoc.methods.length > 0)

- **Parameters**: `classDoc.methods.length > 0`
- **Returns**: _To be documented_

### for(const method of classDoc.methods)

- **Parameters**: `const method of classDoc.methods`
- **Returns**: _To be documented_

### for(const functionDoc of apiDocs.functions)

- **Parameters**: `const functionDoc of apiDocs.functions`
- **Returns**: _To be documented_

### if(functionDoc.examples.length > 0)

- **Parameters**: `functionDoc.examples.length > 0`
- **Returns**: _To be documented_

### saveClassDocumentation(classDoc)

_(async)_

- **Parameters**: `classDoc`
- **Returns**: _To be documented_

### if(classDoc.extends)

- **Parameters**: `classDoc.extends`
- **Returns**: _To be documented_

### if(classDoc.methods.length > 0)

- **Parameters**: `classDoc.methods.length > 0`
- **Returns**: _To be documented_

### for(const method of classDoc.methods)

- **Parameters**: `const method of classDoc.methods`
- **Returns**: _To be documented_

### if(method.examples.length > 0)

- **Parameters**: `method.examples.length > 0`
- **Returns**: _To be documented_

### saveFunctionDocumentation(functionDoc)

_(async)_

- **Parameters**: `functionDoc`
- **Returns**: _To be documented_

### if(functionDoc.examples.length > 0)

- **Parameters**: `functionDoc.examples.length > 0`
- **Returns**: _To be documented_

### getRelativePath(filePath)

- **Parameters**: `filePath`
- **Returns**: _To be documented_

### extractModuleDescription(analysis)

- **Parameters**: `analysis`
- **Returns**: _To be documented_

### if(firstComment)

- **Parameters**: `firstComment`
- **Returns**: _To be documented_

### generateUserGuides()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const guide of guides)

- **Parameters**: `const guide of guides`
- **Returns**: _To be documented_

### generateGettingStartedGuide()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### generateInstallationGuide()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### generateConfigurationGuide()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### generateAdvancedGuide()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### initialize()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### process(data)

_(async)_

- **Parameters**: `data`
- **Returns**: _To be documented_

### generateArchitectureDocumentation()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### generateArchitectureOverview()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### generateDesignPatterns()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### if(SystemService.instance)

- **Parameters**: `SystemService.instance`
- **Returns**: _To be documented_

### notify(event, data)

- **Parameters**: `event`, `data`
- **Returns**: _To be documented_

### create(type, options)

- **Parameters**: `type`, `options`
- **Returns**: _To be documented_

### switch(type)

- **Parameters**: `type`
- **Returns**: _To be documented_

### generateDiagrams()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### generateExamples()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const example of examples)

- **Parameters**: `const example of examples`
- **Returns**: _To be documented_

### generateBasicExample()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### main()

- **Parameters**: None
- **Returns**: _To be documented_

### process({\n task: 'optimize-code', \n code: 'function example()

- **Parameters**: `{\n    task: 'optimize-code'`, `\n    code: 'function example(`
- **Returns**: _To be documented_

### generateAdvancedExample()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### advancedSetup()

- **Parameters**: None
- **Returns**: _To be documented_

### generateCustomModuleExample()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### initialize()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### process(data)

_(async)_

- **Parameters**: `data`
- **Returns**: _To be documented_

### if(!this.isInitialized)

- **Parameters**: `!this.isInitialized`
- **Returns**: _To be documented_

### customLogic(data)

_(async)_

- **Parameters**: `data`
- **Returns**: _To be documented_

### shutdown()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### generateREADME()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### generateChangelog()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### loadTemplates()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const file of files)

- **Parameters**: `const file of files`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### startAutoUpdate()

- **Parameters**: None
- **Returns**: _To be documented_

### updateDocumentation()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### getStatus()

- **Parameters**: None
- **Returns**: _To be documented_

### shutdown()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.scanTimer)

- **Parameters**: `this.scanTimer`
- **Returns**: _To be documented_

## Events

- `initialized`
- `processed`
- `shutdown`

## Dependencies

- fs
- path
- events
- crypto
- events

## Integration

This module integrates with other VIBE components to provide module description.

## Example Usage

```javascript
const SelfDocumentationGenerator = require('./enhancements/core/self-documentation-generator.js');

const selfdocumentationgenerator = new SelfDocumentationGenerator({
  // Configuration options
});

await selfdocumentationgenerator.initialize();
```

## Source Code

[View source](../../../../enhancements/core/self-documentation-generator.js)

---

_Documentation auto-generated from source code_
