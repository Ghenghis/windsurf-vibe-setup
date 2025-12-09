# Module: enhanced-memory-system

## Overview

- **Category**: core
- **File**: enhanced-memory-system.js
- **Lines of Code**: 763
- **Class**: EnhancedMemorySystem

## Description

Module description

## Configuration

No configuration options

## Constructor

```javascript
new EnhancedMemorySystem(options);
```

### Options

- `options = {}`

## Methods

### initialize()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### remember(key, value, type = 'working', metadata = {})

_(async)_

- **Parameters**: `key`, `value`, `type = 'working'`, `metadata = {}`
- **Returns**: _To be documented_

### switch(type)

- **Parameters**: `type`
- **Returns**: _To be documented_

### if(this.episodicMemory.length > 1000)

- **Parameters**: `this.episodicMemory.length > 1000`
- **Returns**: _To be documented_

### if(memory.embedding)

- **Parameters**: `memory.embedding`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### recall(query, type = 'all', options = {})

_(async)_

- **Parameters**: `query`, `type = 'all'`, `options = {}`
- **Returns**: _To be documented_

### if(type === 'all' || type === 'working')

- **Parameters**: `type === 'all' || type === 'working'`
- **Returns**: _To be documented_

### for(const [key, memory] of this.workingMemory)

- **Parameters**: `const [key`, `memory] of this.workingMemory`
- **Returns**: _To be documented_

### if(type === 'all' || type === 'short-term')

- **Parameters**: `type === 'all' || type === 'short-term'`
- **Returns**: _To be documented_

### for(const [key, memory] of this.shortTermMemory)

- **Parameters**: `const [key`, `memory] of this.shortTermMemory`
- **Returns**: _To be documented_

### if(type === 'all' || type === 'episodic')

- **Parameters**: `type === 'all' || type === 'episodic'`
- **Returns**: _To be documented_

### if(type === 'all' || type === 'semantic')

- **Parameters**: `type === 'all' || type === 'semantic'`
- **Returns**: _To be documented_

### if(type === 'all' || type === 'long-term')

- **Parameters**: `type === 'all' || type === 'long-term'`
- **Returns**: _To be documented_

### for(const [key, memory] of this.longTermMemory)

- **Parameters**: `const [key`, `memory] of this.longTermMemory`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### consolidateMemory()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const [key, memory] of this.workingMemory)

- **Parameters**: `const [key`, `memory] of this.workingMemory`
- **Returns**: _To be documented_

### for(const [key, memory] of this.shortTermMemory)

- **Parameters**: `const [key`, `memory] of this.shortTermMemory`
- **Returns**: _To be documented_

### if(memory.accessCount > 5 || memory.importance > 0.8)

- **Parameters**: `memory.accessCount > 5 || memory.importance > 0.8`
- **Returns**: _To be documented_

### for(const pattern of patterns)

- **Parameters**: `const pattern of patterns`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### generateEmbedding(text)

_(async)_

- **Parameters**: `text`
- **Returns**: _To be documented_

### for(let i = 0; i < 32; i++)

- **Parameters**: `let i = 0; i < 32; i++`
- **Returns**: _To be documented_

### calculateSimilarity(embedding1, embedding2)

- **Parameters**: `embedding1`, `embedding2`
- **Returns**: _To be documented_

### for(let i = 0; i < embedding1.length; i++)

- **Parameters**: `let i = 0; i < embedding1.length; i++`
- **Returns**: _To be documented_

### isRelevant(query, memory, queryEmbedding, threshold)

- **Parameters**: `query`, `memory`, `queryEmbedding`, `threshold`
- **Returns**: _To be documented_

### if(queryEmbedding && memory.embedding)

- **Parameters**: `queryEmbedding && memory.embedding`
- **Returns**: _To be documented_

### if(similarity >= threshold)

- **Parameters**: `similarity >= threshold`
- **Returns**: _To be documented_

### rankByRelevance(results, query, queryEmbedding)

- **Parameters**: `results`, `query`, `queryEmbedding`
- **Returns**: _To be documented_

### calculateRelevanceScore(memory, query, queryEmbedding)

- **Parameters**: `memory`, `query`, `queryEmbedding`
- **Returns**: _To be documented_

### if(queryEmbedding && memory.embedding)

- **Parameters**: `queryEmbedding && memory.embedding`
- **Returns**: _To be documented_

### calculateImportance(value)

- **Parameters**: `value`
- **Returns**: _To be documented_

### isImportant(memory)

- **Parameters**: `memory`
- **Returns**: _To be documented_

### getCurrentContext()

- **Parameters**: None
- **Returns**: _To be documented_

### updateKnowledgeGraph(memory)

_(async)_

- **Parameters**: `memory`
- **Returns**: _To be documented_

### for(const entity of entities)

- **Parameters**: `const entity of entities`
- **Returns**: _To be documented_

### for(const rel of relationships)

- **Parameters**: `const rel of relationships`
- **Returns**: _To be documented_

### extractEntities(text)

- **Parameters**: `text`
- **Returns**: _To be documented_

### extractRelationships(text)

- **Parameters**: `text`
- **Returns**: _To be documented_

### for(const match of importMatches)

- **Parameters**: `const match of importMatches`
- **Returns**: _To be documented_

### findRelevantEpisodes(query, queryEmbedding, threshold)

- **Parameters**: `query`, `queryEmbedding`, `threshold`
- **Returns**: _To be documented_

### for(const episode of this.episodicMemory)

- **Parameters**: `const episode of this.episodicMemory`
- **Returns**: _To be documented_

### searchKnowledgeGraph(query, queryEmbedding)

_(async)_

- **Parameters**: `query`, `queryEmbedding`
- **Returns**: _To be documented_

### for(const [key, node] of this.semanticMemory)

- **Parameters**: `const [key`, `node] of this.semanticMemory`
- **Returns**: _To be documented_

### extractPatterns(episodes)

_(async)_

- **Parameters**: `episodes`
- **Returns**: _To be documented_

### for(const episode of episodes)

- **Parameters**: `const episode of episodes`
- **Returns**: _To be documented_

### for(const group of groups)

- **Parameters**: `const group of groups`
- **Returns**: _To be documented_

### if(!added)

- **Parameters**: `!added`
- **Returns**: _To be documented_

### for(const group of groups)

- **Parameters**: `const group of groups`
- **Returns**: _To be documented_

### if(group.length >= 3)

- **Parameters**: `group.length >= 3`
- **Returns**: _To be documented_

### consolidateEpisodic()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### updateIndex(memory)

- **Parameters**: `memory`
- **Returns**: _To be documented_

### for(const word of words)

- **Parameters**: `const word of words`
- **Returns**: _To be documented_

### persistMemory(type, memory)

_(async)_

- **Parameters**: `type`, `memory`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### loadMemories()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const type of types)

- **Parameters**: `const type of types`
- **Returns**: _To be documented_

### for(const file of files)

- **Parameters**: `const file of files`
- **Returns**: _To be documented_

### switch(type)

- **Parameters**: `type`
- **Returns**: _To be documented_

### if(memory.embedding)

- **Parameters**: `memory.embedding`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### if(error.code !== 'ENOENT')

- **Parameters**: `error.code !== 'ENOENT'`
- **Returns**: _To be documented_

### pruneOldMemories()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const [key, memory] of this.shortTermMemory)

- **Parameters**: `const [key`, `memory] of this.shortTermMemory`
- **Returns**: _To be documented_

### if(memory.timestamp < cutoff && memory.importance < 0.5)

- **Parameters**: `memory.timestamp < cutoff && memory.importance < 0.5`
- **Returns**: _To be documented_

### startConsolidation()

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.consolidationTimer)

- **Parameters**: `this.consolidationTimer`
- **Returns**: _To be documented_

### createAgentMemory(agentId)

- **Parameters**: `agentId`
- **Returns**: _To be documented_

### getTotalMemories()

- **Parameters**: None
- **Returns**: _To be documented_

### getStatus()

- **Parameters**: None
- **Returns**: _To be documented_

### shutdown()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.consolidationTimer)

- **Parameters**: `this.consolidationTimer`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

## Events

- `initialized`
- `remembered`
- `recalled`
- `consolidated`
- `shutdown`

## Dependencies

- fs
- path
- events
- crypto

## Integration

This module integrates with other VIBE components to provide module description.

## Example Usage

```javascript
const EnhancedMemorySystem = require('./enhancements/core/enhanced-memory-system.js');

const enhancedmemorysystem = new EnhancedMemorySystem({
  // Configuration options
});

await enhancedmemorysystem.initialize();
```

## Source Code

[View source](../../../../enhancements/core/enhanced-memory-system.js)

---

_Documentation auto-generated from source code_
