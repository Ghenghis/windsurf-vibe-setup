# Module: distributed-tracing

## Overview

- **Category**: core
- **File**: distributed-tracing.js
- **Lines of Code**: 548
- **Class**: DistributedTracing

## Description

Module description

## Configuration

- `traceDir`
- `maxTraceAge`
- `samplingRate`
- `maxSpansPerTrace`

## Constructor

```javascript
new DistributedTracing(options);
```

### Options

- `options = {}`

## Methods

### initialize()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### startTrace(name, metadata = {})

- **Parameters**: `name`, `metadata = {}`
- **Returns**: _To be documented_

### startSpan(traceId, name, parentSpanId = null)

- **Parameters**: `traceId`, `name`, `parentSpanId = null`
- **Returns**: _To be documented_

### if(trace.spans.length > this.config.maxSpansPerTrace)

- **Parameters**: `trace.spans.length > this.config.maxSpansPerTrace`
- **Returns**: _To be documented_

### endSpan(spanId, status = 'ok', error = null)

- **Parameters**: `spanId`, `status = 'ok'`, `error = null`
- **Returns**: _To be documented_

### if(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### endTrace(traceId, status = 'ok')

- **Parameters**: `traceId`, `status = 'ok'`
- **Returns**: _To be documented_

### forEach(span => {

      if (span.status === 'active')

- **Parameters**: `span => {
    if (span.status === 'active'`
- **Returns**: _To be documented_

### if(this.completedTraces.length > 1000)

- **Parameters**: `this.completedTraces.length > 1000`
- **Returns**: _To be documented_

### addSpanTags(spanId, tags)

- **Parameters**: `spanId`, `tags`
- **Returns**: _To be documented_

### if(span)

- **Parameters**: `span`
- **Returns**: _To be documented_

### addSpanLog(spanId, message, level = 'info')

- **Parameters**: `spanId`, `message`, `level = 'info'`
- **Returns**: _To be documented_

### if(span)

- **Parameters**: `span`
- **Returns**: _To be documented_

### getTraceContext(traceId)

- **Parameters**: `traceId`
- **Returns**: _To be documented_

### injectContext(traceId, headers = {})

- **Parameters**: `traceId`, `headers = {}`
- **Returns**: _To be documented_

### if(context.baggage)

- **Parameters**: `context.baggage`
- **Returns**: _To be documented_

### extractContext(headers)

- **Parameters**: `headers`
- **Returns**: _To be documented_

### continueTrace(context, name)

- **Parameters**: `context`, `name`
- **Returns**: _To be documented_

### if(!context || !context.traceId)

- **Parameters**: `!context || !context.traceId`
- **Returns**: _To be documented_

### findByCorrelationId(correlationId)

- **Parameters**: `correlationId`
- **Returns**: _To be documented_

### getTraceTimeline(traceId)

- **Parameters**: `traceId`
- **Returns**: _To be documented_

### if(span.endTime)

- **Parameters**: `span.endTime`
- **Returns**: _To be documented_

### if(trace.endTime)

- **Parameters**: `trace.endTime`
- **Returns**: _To be documented_

### analyzeTrace(traceId)

- **Parameters**: `traceId`
- **Returns**: _To be documented_

### if(errorSpans.length > 0)

- **Parameters**: `errorSpans.length > 0`
- **Returns**: _To be documented_

### if(slowSpans.length > 0)

- **Parameters**: `slowSpans.length > 0`
- **Returns**: _To be documented_

### updateSpanMetrics(span)

- **Parameters**: `span`
- **Returns**: _To be documented_

### if(span.error)

- **Parameters**: `span.error`
- **Returns**: _To be documented_

### updateTraceMetrics(trace)

- **Parameters**: `trace`
- **Returns**: _To be documented_

### saveTrace(trace)

_(async)_

- **Parameters**: `trace`
- **Returns**: _To be documented_

### cleanupOldTraces()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const [traceId, trace] of this.activeTraces)

- **Parameters**: `const [traceId`, `trace] of this.activeTraces`
- **Returns**: _To be documented_

### if(now - trace.timestamp > this.config.maxTraceAge)

- **Parameters**: `now - trace.timestamp > this.config.maxTraceAge`
- **Returns**: _To be documented_

### getStatus()

- **Parameters**: None
- **Returns**: _To be documented_

### shutdown()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.cleanupInterval)

- **Parameters**: `this.cleanupInterval`
- **Returns**: _To be documented_

## Events

- `initialized`
- `traceStarted`
- `traceCompleted`
- `shutdown`

## Dependencies

- fs
- path
- events
- crypto
- perf_hooks

## Integration

This module integrates with other VIBE components to provide module description.

## Example Usage

```javascript
const DistributedTracing = require('./enhancements/core/distributed-tracing.js');

const distributedtracing = new DistributedTracing({
  // Configuration options
});

await distributedtracing.initialize();
```

## Source Code

[View source](../../../../enhancements/core/distributed-tracing.js)

---

_Documentation auto-generated from source code_
