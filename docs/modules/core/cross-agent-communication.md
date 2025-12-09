# Module: cross-agent-communication

## Overview

- **Category**: core
- **File**: cross-agent-communication.js
- **Lines of Code**: 1313
- **Class**: CrossAgentCommunication

## Description

Module description

## Configuration

- `communicationDir`
- `agentPort`
- `broadcastPort`
- `heartbeatInterval`
- `messageTimeout`
- `maxRetries`
- `encryptMessages`
- `consensusThreshold`

## Constructor

```javascript
new CrossAgentCommunication(options);
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

### createDirectories()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const dir of dirs)

- **Parameters**: `const dir of dirs`
- **Returns**: _To be documented_

### registerLocalAgent(config = {})

_(async)_

- **Parameters**: `config = {}`
- **Returns**: _To be documented_

### generatePublicKey()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### discoverAgents()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### multicastDiscovery()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### checkKnownAgents()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const endpoint of knownEndpoints)

- **Parameters**: `const endpoint of knownEndpoints`
- **Returns**: _To be documented_

### if(agent)

- **Parameters**: `agent`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### pingAgent(endpoint)

_(async)_

- **Parameters**: `endpoint`
- **Returns**: _To be documented_

### if(response.type === 'pong' && response.agent)

- **Parameters**: `response.type === 'pong' && response.agent`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### registerRemoteAgent(agent)

- **Parameters**: `agent`
- **Returns**: _To be documented_

### if(agent.id !== this.localAgent.id)

- **Parameters**: `agent.id !== this.localAgent.id`
- **Returns**: _To be documented_

### startServer()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### handleConnection(socket)

- **Parameters**: `socket`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### handleMessage(message, connection)

_(async)_

- **Parameters**: `message`, `connection`
- **Returns**: _To be documented_

### switch(message.type)

- **Parameters**: `message.type`
- **Returns**: _To be documented_

### if(handler)

- **Parameters**: `handler`
- **Returns**: _To be documented_

### validateMessage(message)

- **Parameters**: `message`
- **Returns**: _To be documented_

### if(!message.type || !message.id)

- **Parameters**: `!message.type || !message.id`
- **Returns**: _To be documented_

### verifySignature(message)

- **Parameters**: `message`
- **Returns**: _To be documented_

### handlePing(message, connection)

_(async)_

- **Parameters**: `message`, `connection`
- **Returns**: _To be documented_

### handleDiscovery(message, connection)

_(async)_

- **Parameters**: `message`, `connection`
- **Returns**: _To be documented_

### if(message.agent)

- **Parameters**: `message.agent`
- **Returns**: _To be documented_

### send(agentId, message)

_(async)_

- **Parameters**: `agentId`, `message`
- **Returns**: _To be documented_

### if(this.config.encryptMessages)

- **Parameters**: `this.config.encryptMessages`
- **Returns**: _To be documented_

### if(!agent)

- **Parameters**: `!agent`
- **Returns**: _To be documented_

### sendDirect(agentId, content)

_(async)_

- **Parameters**: `agentId`, `content`
- **Returns**: _To be documented_

### sendBroadcast(content)

_(async)_

- **Parameters**: `content`
- **Returns**: _To be documented_

### for(const [agentId, agent] of this.remoteAgents)

- **Parameters**: `const [agentId`, `agent] of this.remoteAgents`
- **Returns**: _To be documented_

### sendMulticast(agentIds, content)

_(async)_

- **Parameters**: `agentIds`, `content`
- **Returns**: _To be documented_

### for(const agentId of agentIds)

- **Parameters**: `const agentId of agentIds`
- **Returns**: _To be documented_

### if(agent)

- **Parameters**: `agent`
- **Returns**: _To be documented_

### sendRequest(agentId, request)

_(async)_

- **Parameters**: `agentId`, `request`
- **Returns**: _To be documented_

### sendResponse(agentId, requestId, response)

_(async)_

- **Parameters**: `agentId`, `requestId`, `response`
- **Returns**: _To be documented_

### sendToAgent(agent, message)

_(async)_

- **Parameters**: `agent`, `message`
- **Returns**: _To be documented_

### signMessage(message)

_(async)_

- **Parameters**: `message`
- **Returns**: _To be documented_

### handleRequest(message, connection)

_(async)_

- **Parameters**: `message`, `connection`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### processRequest(request, fromAgent)

_(async)_

- **Parameters**: `request`, `fromAgent`
- **Returns**: _To be documented_

### switch(request.action)

- **Parameters**: `request.action`
- **Returns**: _To be documented_

### handleResponse(message, connection)

_(async)_

- **Parameters**: `message`, `connection`
- **Returns**: _To be documented_

### if(pending)

- **Parameters**: `pending`
- **Returns**: _To be documented_

### if(success)

- **Parameters**: `success`
- **Returns**: _To be documented_

### delegateTask(task, options = {})

_(async)_

- **Parameters**: `task`, `options = {}`
- **Returns**: _To be documented_

### if(!agentId)

- **Parameters**: `!agentId`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### selectAgentForTask(task, options)

_(async)_

- **Parameters**: `task`, `options`
- **Returns**: _To be documented_

### for(const [agentId, agent] of this.remoteAgents)

- **Parameters**: `const [agentId`, `agent] of this.remoteAgents`
- **Returns**: _To be documented_

### if(score > 0)

- **Parameters**: `score > 0`
- **Returns**: _To be documented_

### if(candidates.length === 0)

- **Parameters**: `candidates.length === 0`
- **Returns**: _To be documented_

### scoreAgentForTask(agent, task)

- **Parameters**: `agent`, `task`
- **Returns**: _To be documented_

### for(const capability of requiredCapabilities)

- **Parameters**: `const capability of requiredCapabilities`
- **Returns**: _To be documented_

### if(agent.type === task.type)

- **Parameters**: `agent.type === task.type`
- **Returns**: _To be documented_

### if(timeSinceLastSeen < 10000)

- **Parameters**: `timeSinceLastSeen < 10000`
- **Returns**: _To be documented_

### handleDelegation(message, connection)

_(async)_

- **Parameters**: `message`, `connection`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### processDelegatedTask(task)

_(async)_

- **Parameters**: `task`
- **Returns**: _To be documented_

### seekConsensus(topic, proposal, options = {})

_(async)_

- **Parameters**: `topic`, `proposal`, `options = {}`
- **Returns**: _To be documented_

### for(const [agentId] of this.remoteAgents)

- **Parameters**: `const [agentId] of this.remoteAgents`
- **Returns**: _To be documented_

### for(const vote of votes)

- **Parameters**: `const vote of votes`
- **Returns**: _To be documented_

### if(approvalRate >= this.config.consensusThreshold)

- **Parameters**: `approvalRate >= this.config.consensusThreshold`
- **Returns**: _To be documented_

### requestVote(agentId, consensusId, topic, proposal)

_(async)_

- **Parameters**: `agentId`, `consensusId`, `topic`, `proposal`
- **Returns**: _To be documented_

### handleConsensus(message, connection)

_(async)_

- **Parameters**: `message`, `connection`
- **Returns**: _To be documented_

### evaluateProposal(topic, proposal)

_(async)_

- **Parameters**: `topic`, `proposal`
- **Returns**: _To be documented_

### createChannel(name, options = {})

_(async)_

- **Parameters**: `name`, `options = {}`
- **Returns**: _To be documented_

### subscribeToChannel(channelId)

_(async)_

- **Parameters**: `channelId`
- **Returns**: _To be documented_

### if(!channel)

- **Parameters**: `!channel`
- **Returns**: _To be documented_

### publishToChannel(channelId, content)

_(async)_

- **Parameters**: `channelId`, `content`
- **Returns**: _To be documented_

### if(!channel)

- **Parameters**: `!channel`
- **Returns**: _To be documented_

### for(const subscriberId of subscribers)

- **Parameters**: `const subscriberId of subscribers`
- **Returns**: _To be documented_

### if(subscriberId !== this.localAgent.id)

- **Parameters**: `subscriberId !== this.localAgent.id`
- **Returns**: _To be documented_

### if(agent)

- **Parameters**: `agent`
- **Returns**: _To be documented_

### processTask(data)

_(async)_

- **Parameters**: `data`
- **Returns**: _To be documented_

### analyzeData(data)

_(async)_

- **Parameters**: `data`
- **Returns**: _To be documented_

### makeDecision(data)

_(async)_

- **Parameters**: `data`
- **Returns**: _To be documented_

### getCapabilities()

- **Parameters**: None
- **Returns**: _To be documented_

### handleBroadcast(message, connection)

_(async)_

- **Parameters**: `message`, `connection`
- **Returns**: _To be documented_

### if(message.content?.type === 'channel-created')

- **Parameters**: `message.content?.type === 'channel-created'`
- **Returns**: _To be documented_

### startHeartbeat()

- **Parameters**: None
- **Returns**: _To be documented_

### sendHeartbeat()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const [agentId, agent] of this.remoteAgents)

- **Parameters**: `const [agentId`, `agent] of this.remoteAgents`
- **Returns**: _To be documented_

### checkAgentHealth()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const [agentId, agent] of this.remoteAgents)

- **Parameters**: `const [agentId`, `agent] of this.remoteAgents`
- **Returns**: _To be documented_

### if(now - agent.lastSeen > timeout)

- **Parameters**: `now - agent.lastSeen > timeout`
- **Returns**: _To be documented_

### if(agent.status === 'active')

- **Parameters**: `agent.status === 'active'`
- **Returns**: _To be documented_

### announcePresence()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### storeMessage(message, direction)

_(async)_

- **Parameters**: `message`, `direction`
- **Returns**: _To be documented_

### loadAgentRegistry()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const agent of registry)

- **Parameters**: `const agent of registry`
- **Returns**: _To be documented_

### if(agent.id !== this.localAgent?.id)

- **Parameters**: `agent.id !== this.localAgent?.id`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### loadRemoteAgents()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const agent of remoteAgents)

- **Parameters**: `const agent of remoteAgents`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### saveAgentConfig(agent)

_(async)_

- **Parameters**: `agent`
- **Returns**: _To be documented_

### saveRemoteAgents()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### saveDelegation(delegation)

_(async)_

- **Parameters**: `delegation`
- **Returns**: _To be documented_

### saveConsensus(consensus)

_(async)_

- **Parameters**: `consensus`
- **Returns**: _To be documented_

### registerMessageHandler(messageType, handler)

- **Parameters**: `messageType`, `handler`
- **Returns**: _To be documented_

### unregisterMessageHandler(messageType)

- **Parameters**: `messageType`
- **Returns**: _To be documented_

### startCollaboration(topic, participants, options = {})

_(async)_

- **Parameters**: `topic`, `participants`, `options = {}`
- **Returns**: _To be documented_

### for(const participantId of participants)

- **Parameters**: `const participantId of participants`
- **Returns**: _To be documented_

### if(participantId !== this.localAgent.id)

- **Parameters**: `participantId !== this.localAgent.id`
- **Returns**: _To be documented_

### endCollaboration(collaborationId, results)

_(async)_

- **Parameters**: `collaborationId`, `results`
- **Returns**: _To be documented_

### if(!collaboration)

- **Parameters**: `!collaboration`
- **Returns**: _To be documented_

### for(const participantId of collaboration.participants)

- **Parameters**: `const participantId of collaboration.participants`
- **Returns**: _To be documented_

### if(participantId !== this.localAgent.id)

- **Parameters**: `participantId !== this.localAgent.id`
- **Returns**: _To be documented_

### getStatus()

- **Parameters**: None
- **Returns**: _To be documented_

### shutdown()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.heartbeatTimer)

- **Parameters**: `this.heartbeatTimer`
- **Returns**: _To be documented_

### for(const [id, connection] of this.connections)

- **Parameters**: `const [id`, `connection] of this.connections`
- **Returns**: _To be documented_

### if(this.server)

- **Parameters**: `this.server`
- **Returns**: _To be documented_

## Events

- `initialized`
- `agentDiscovered`
- `messageReceived`
- `taskCompleted`
- `consensusReached`
- `channelSubscribed`
- `broadcastReceived`
- `newChannelDiscovered`
- `agentOffline`
- `shutdown`

## Dependencies

- fs
- path
- events
- crypto
- net

## Integration

This module integrates with other VIBE components to provide module description.

## Example Usage

```javascript
const CrossAgentCommunication = require('./enhancements/core/cross-agent-communication.js');

const crossagentcommunication = new CrossAgentCommunication({
  // Configuration options
});

await crossagentcommunication.initialize();
```

## Source Code

[View source](../../../../enhancements/core/cross-agent-communication.js)

---

_Documentation auto-generated from source code_
