# Module: universal-api-connector

## Overview

- **Category**: core
- **File**: universal-api-connector.js
- **Lines of Code**: 1065
- **Class**: UniversalAPIConnector

## Description

Module description

## Configuration

- `apiDir`
- `discoveryTimeout`
- `maxRetries`
- `retryDelay`
- `rateLimitBuffer`
- `autoDiscovery`
- `cacheResponses`
- `cacheTTL`

## Constructor

```javascript
new UniversalAPIConnector(options);
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

### registerAPI(config)

_(async)_

- **Parameters**: `config`
- **Returns**: _To be documented_

### if(this.config.autoDiscovery)

- **Parameters**: `this.config.autoDiscovery`
- **Returns**: _To be documented_

### if(config.endpoints)

- **Parameters**: `config.endpoints`
- **Returns**: _To be documented_

### for(const endpoint of config.endpoints)

- **Parameters**: `const endpoint of config.endpoints`
- **Returns**: _To be documented_

### discoverEndpoints(api)

_(async)_

- **Parameters**: `api`
- **Returns**: _To be documented_

### for(const path of discoveryPaths)

- **Parameters**: `const path of discoveryPaths`
- **Returns**: _To be documented_

### if(response && response.data)

- **Parameters**: `response && response.data`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### parseDiscoveredSchema(api, schema)

_(async)_

- **Parameters**: `api`, `schema`
- **Returns**: _To be documented_

### if(schema.paths)

- **Parameters**: `schema.paths`
- **Returns**: _To be documented_

### if(schema.endpoints)

- **Parameters**: `schema.endpoints`
- **Returns**: _To be documented_

### for(const endpoint of schema)

- **Parameters**: `const endpoint of schema`
- **Returns**: _To be documented_

### parseOpenAPISchema(api, schema)

_(async)_

- **Parameters**: `api`, `schema`
- **Returns**: _To be documented_

### parseCustomSchema(api, schema)

_(async)_

- **Parameters**: `api`, `schema`
- **Returns**: _To be documented_

### for(const endpoint of schema.endpoints)

- **Parameters**: `const endpoint of schema.endpoints`
- **Returns**: _To be documented_

### registerEndpoint(apiId, endpoint)

- **Parameters**: `apiId`, `endpoint`
- **Returns**: _To be documented_

### call(apiId, endpoint, options = {})

_(async)_

- **Parameters**: `apiId`, `endpoint`, `options = {}`
- **Returns**: _To be documented_

### if(!api)

- **Parameters**: `!api`
- **Returns**: _To be documented_

### if(this.config.cacheResponses)

- **Parameters**: `this.config.cacheResponses`
- **Returns**: _To be documented_

### if(cached)

- **Parameters**: `cached`
- **Returns**: _To be documented_

### if(this.config.cacheResponses && response.success)

- **Parameters**: `this.config.cacheResponses && response.success`
- **Returns**: _To be documented_

### prepareRequest(api, endpoint, options)

_(async)_

- **Parameters**: `api`, `endpoint`, `options`
- **Returns**: _To be documented_

### if(options.pathParams)

- **Parameters**: `options.pathParams`
- **Returns**: _To be documented_

### if(options.params)

- **Parameters**: `options.params`
- **Returns**: _To be documented_

### addAuthentication(api, request)

_(async)_

- **Parameters**: `api`, `request`
- **Returns**: _To be documented_

### if(auth.type === 'none')

- **Parameters**: `auth.type === 'none'`
- **Returns**: _To be documented_

### if(authMethod)

- **Parameters**: `authMethod`
- **Returns**: _To be documented_

### authenticateWithApiKey(request, auth)

_(async)_

- **Parameters**: `request`, `auth`
- **Returns**: _To be documented_

### if(auth.location === 'header')

- **Parameters**: `auth.location === 'header'`
- **Returns**: _To be documented_

### if(auth.location === 'query')

- **Parameters**: `auth.location === 'query'`
- **Returns**: _To be documented_

### authenticateWithBearer(request, auth)

_(async)_

- **Parameters**: `request`, `auth`
- **Returns**: _To be documented_

### authenticateWithBasic(request, auth)

_(async)_

- **Parameters**: `request`, `auth`
- **Returns**: _To be documented_

### authenticateWithOAuth2(request, auth)

_(async)_

- **Parameters**: `request`, `auth`
- **Returns**: _To be documented_

### authenticateWithJWT(request, auth)

_(async)_

- **Parameters**: `request`, `auth`
- **Returns**: _To be documented_

### authenticateWithCustom(request, auth)

_(async)_

- **Parameters**: `request`, `auth`
- **Returns**: _To be documented_

### if(auth.handler)

- **Parameters**: `auth.handler`
- **Returns**: _To be documented_

### getOAuth2Token(auth)

_(async)_

- **Parameters**: `auth`
- **Returns**: _To be documented_

### refreshOAuth2Token(auth)

_(async)_

- **Parameters**: `auth`
- **Returns**: _To be documented_

### if(auth.refreshToken)

- **Parameters**: `auth.refreshToken`
- **Returns**: _To be documented_

### generateJWT(auth)

_(async)_

- **Parameters**: `auth`
- **Returns**: _To be documented_

### executeWithRetry(request, retryCount = 0)

_(async)_

- **Parameters**: `request`, `retryCount = 0`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### if(retryCount < this.config.maxRetries)

- **Parameters**: `retryCount < this.config.maxRetries`
- **Returns**: _To be documented_

### if(shouldRetry)

- **Parameters**: `shouldRetry`
- **Returns**: _To be documented_

### shouldRetry(error, retryCount)

_(async)_

- **Parameters**: `error`, `retryCount`
- **Returns**: _To be documented_

### if(error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')

- **Parameters**: `error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT'`
- **Returns**: _To be documented_

### makeRequest(config)

_(async)_

- **Parameters**: `config`
- **Returns**: _To be documented_

### if(res.statusCode >= 200 && res.statusCode < 300)

- **Parameters**: `res.statusCode >= 200 && res.statusCode < 300`
- **Returns**: _To be documented_

### catch(parseError)

- **Parameters**: `parseError`
- **Returns**: _To be documented_

### if(config.data)

- **Parameters**: `config.data`
- **Returns**: _To be documented_

### delay(ms)

- **Parameters**: `ms`
- **Returns**: _To be documented_

### isRateLimited(apiId)

_(async)_

- **Parameters**: `apiId`
- **Returns**: _To be documented_

### if(!limit)

- **Parameters**: `!limit`
- **Returns**: _To be documented_

### waitForRateLimit(apiId)

_(async)_

- **Parameters**: `apiId`
- **Returns**: _To be documented_

### if(limit)

- **Parameters**: `limit`
- **Returns**: _To be documented_

### if(timeToWait > 0)

- **Parameters**: `timeToWait > 0`
- **Returns**: _To be documented_

### startRateLimitManager()

- **Parameters**: None
- **Returns**: _To be documented_

### for(const [key, limit] of this.rateLimits)

- **Parameters**: `const [key`, `limit] of this.rateLimits`
- **Returns**: _To be documented_

### handleBadRequest(error, request)

_(async)_

- **Parameters**: `error`, `request`
- **Returns**: _To be documented_

### handleUnauthorized(error, request)

_(async)_

- **Parameters**: `error`, `request`
- **Returns**: _To be documented_

### handleForbidden(error, request)

_(async)_

- **Parameters**: `error`, `request`
- **Returns**: _To be documented_

### handleNotFound(error, request)

_(async)_

- **Parameters**: `error`, `request`
- **Returns**: _To be documented_

### handleRateLimited(error, request)

_(async)_

- **Parameters**: `error`, `request`
- **Returns**: _To be documented_

### handleServerError(error, request)

_(async)_

- **Parameters**: `error`, `request`
- **Returns**: _To be documented_

### handleServiceUnavailable(error, request)

_(async)_

- **Parameters**: `error`, `request`
- **Returns**: _To be documented_

### getCacheKey(apiId, endpoint, options)

- **Parameters**: `apiId`, `endpoint`, `options`
- **Returns**: _To be documented_

### getFromCache(key)

- **Parameters**: `key`
- **Returns**: _To be documented_

### if(cached)

- **Parameters**: `cached`
- **Returns**: _To be documented_

### cacheResponse(key, response)

- **Parameters**: `key`, `response`
- **Returns**: _To be documented_

### if(this.responseCache.size > 1000)

- **Parameters**: `this.responseCache.size > 1000`
- **Returns**: _To be documented_

### for(let i = 0; i < 100; i++)

- **Parameters**: `let i = 0; i < 100; i++`
- **Returns**: _To be documented_

### clearCache(apiId = null)

- **Parameters**: `apiId = null`
- **Returns**: _To be documented_

### if(apiId)

- **Parameters**: `apiId`
- **Returns**: _To be documented_

### for(const [key] of this.responseCache)

- **Parameters**: `const [key] of this.responseCache`
- **Returns**: _To be documented_

### updateStatistics(apiId, endpoint, response)

- **Parameters**: `apiId`, `endpoint`, `response`
- **Returns**: _To be documented_

### if(response.success)

- **Parameters**: `response.success`
- **Returns**: _To be documented_

### if(response.responseTime)

- **Parameters**: `response.responseTime`
- **Returns**: _To be documented_

### if(endpointConfig)

- **Parameters**: `endpointConfig`
- **Returns**: _To be documented_

### if(response.success)

- **Parameters**: `response.success`
- **Returns**: _To be documented_

### if(response.responseTime)

- **Parameters**: `response.responseTime`
- **Returns**: _To be documented_

### if(limit)

- **Parameters**: `limit`
- **Returns**: _To be documented_

### updateAPI(apiId, updates)

_(async)_

- **Parameters**: `apiId`, `updates`
- **Returns**: _To be documented_

### if(!api)

- **Parameters**: `!api`
- **Returns**: _To be documented_

### removeAPI(apiId)

_(async)_

- **Parameters**: `apiId`
- **Returns**: _To be documented_

### if(!api)

- **Parameters**: `!api`
- **Returns**: _To be documented_

### for(const [endpointId] of this.endpoints)

- **Parameters**: `const [endpointId] of this.endpoints`
- **Returns**: _To be documented_

### batch(apiId, requests)

_(async)_

- **Parameters**: `apiId`, `requests`
- **Returns**: _To be documented_

### if(!api)

- **Parameters**: `!api`
- **Returns**: _To be documented_

### for(let i = 0; i < requests.length; i += batchSize)

- **Parameters**: `let i = 0; i < requests.length; i += batchSize`
- **Returns**: _To be documented_

### if(i + batchSize < requests.length)

- **Parameters**: `i + batchSize < requests.length`
- **Returns**: _To be documented_

### connectWebSocket(apiId, endpoint, handlers = {})

_(async)_

- **Parameters**: `apiId`, `endpoint`, `handlers = {}`
- **Returns**: _To be documented_

### if(!api)

- **Parameters**: `!api`
- **Returns**: _To be documented_

### loadAPIConfigs()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const file of files)

- **Parameters**: `const file of files`
- **Returns**: _To be documented_

### if(api.endpoints)

- **Parameters**: `api.endpoints`
- **Returns**: _To be documented_

### for(const endpoint of api.endpoints)

- **Parameters**: `const endpoint of api.endpoints`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### loadSchemas()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### for(const file of files)

- **Parameters**: `const file of files`
- **Returns**: _To be documented_

### catch(error)

- **Parameters**: `error`
- **Returns**: _To be documented_

### saveAPIConfig(api)

_(async)_

- **Parameters**: `api`
- **Returns**: _To be documented_

### if(toSave.authentication)

- **Parameters**: `toSave.authentication`
- **Returns**: _To be documented_

### saveSchema(apiId, schema)

_(async)_

- **Parameters**: `apiId`, `schema`
- **Returns**: _To be documented_

### generateDocumentation(apiId)

_(async)_

- **Parameters**: `apiId`
- **Returns**: _To be documented_

### if(!api)

- **Parameters**: `!api`
- **Returns**: _To be documented_

### getStatus()

- **Parameters**: None
- **Returns**: _To be documented_

### shutdown()

_(async)_

- **Parameters**: None
- **Returns**: _To be documented_

### if(this.rateLimitInterval)

- **Parameters**: `this.rateLimitInterval`
- **Returns**: _To be documented_

### for(const [id, api] of this.apis)

- **Parameters**: `const [id`, `api] of this.apis`
- **Returns**: _To be documented_

## Events

- `initialized`
- `apiRegistered`
- `apiUpdated`
- `apiRemoved`
- `websocketConnected`
- `shutdown`

## Dependencies

- fs
- path
- events
- crypto
- http
- https

## Integration

This module integrates with other VIBE components to provide module description.

## Example Usage

```javascript
const UniversalAPIConnector = require('./enhancements/core/universal-api-connector.js');

const universalapiconnector = new UniversalAPIConnector({
  // Configuration options
});

await universalapiconnector.initialize();
```

## Source Code

[View source](../../../../enhancements/core/universal-api-connector.js)

---

_Documentation auto-generated from source code_
