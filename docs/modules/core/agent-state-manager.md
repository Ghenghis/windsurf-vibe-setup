# Module: agent-state-manager

## Overview

- **Category**: core
- **File**: agent-state-manager.js
- **Lines of Code**: 416
- **Class**: AgentStateManager

## Description

Module description

## Configuration

No configuration options

## Constructor

```javascript
new AgentStateManager(options);
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

### saveAgentState(agentId, state)

_(async)_

- **Parameters**: `agentId`, `state`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### loadAgentState(agentId)

_(async)_

- **Parameters**: `agentId`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### createCheckpoint(metadata = {})

_(async)_

- **Parameters**: `metadata = {}`
- **Returns**: _To be documented_

### for(const [agentId, stateData] of this.states)

- **Parameters**: `const [agentId`, `stateData] of this.states`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### restoreFromCheckpoint(checkpointId)

_(async)_

- **Parameters**: `checkpointId`
- **Returns**: _To be documented_

### if(!checkpointInfo)

- **Parameters**: `!checkpointInfo`
- **Returns**: _To be documented_

### if(!checkpointFile)

- **Parameters**: `!checkpointFile`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### getLastCheckpoint()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.checkpoints.length === 0)

- **Parameters**: `this.checkpoints.length === 0`
- **Returns**: _To be documented_

### autoRecover()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### if(!lastCheckpoint)

- **Parameters**: `!lastCheckpoint`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### loadCheckpoints()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const file of files)

- **Parameters**: `const file of files`
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

### pruneCheckpoints()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.checkpoints.length <= this.maxCheckpoints)

- **Parameters**: `this.checkpoints.length <= this.maxCheckpoints`
- **Returns**: _To be documented_

### while(this.checkpoints.length > this.maxCheckpoints)

- **Parameters**: `this.checkpoints.length > this.maxCheckpoints`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### startAutoCheckpoint()

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.checkpointTimer)

- **Parameters**: `this.checkpointTimer`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### stopAutoCheckpoint()

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.checkpointTimer)

- **Parameters**: `this.checkpointTimer`
- **Returns**: _To be documented_

### getStatus()

- **Parameters**: None
- **Returns**: _To be documented_

### shutdown()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

## Events

- `initialized`
- `stateSaved`
- `checkpointCreated`
- `checkpointRestored`
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
const AgentStateManager = require('./enhancements/core/agent-state-manager.js');

const agentstatemanager = new AgentStateManager({
  // Configuration options
});

await agentstatemanager.initialize();
```

## Source Code

[View source](../../../../enhancements/core/agent-state-manager.js)

---

_Documentation auto-generated from source code_
