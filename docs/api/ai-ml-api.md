# ai-ml API Reference

## Overview

This document provides the complete API reference for all ai-ml modules.

## Modules

### hive-mind-ml-manager

- **Class**: `HiveMindMLManager`
- **Methods**: 42
- **Events**: 4
- [Full Documentation](../modules/ai-ml/hive-mind-ml-manager.md)

### huggingface-integrator

- **Class**: `HuggingFaceIntegrator`
- **Methods**: 35
- **Events**: 4
- [Full Documentation](../modules/ai-ml/huggingface-integrator.md)

### vibe-ml-core

- **Class**: `VIBEMLCore`
- **Methods**: 40
- **Events**: 5
- [Full Documentation](../modules/ai-ml/vibe-ml-core.md)

## Quick Reference

### All Methods

- `hive-mind-ml-manager.initialize()`
- `hive-mind-ml-manager.if(this.config.autoManage)`
- `hive-mind-ml-manager.connectSystems()`
- `hive-mind-ml-manager.for(let i = 1; i <= moduleCount; i++)`
- `hive-mind-ml-manager.startOrchestration()`
- `hive-mind-ml-manager.performOrchestrationCycle()`
- `hive-mind-ml-manager.if(trainingDecision.shouldTrain)`
- `hive-mind-ml-manager.if(deploymentDecision.shouldDeploy)`
- `hive-mind-ml-manager.if(this.config.communityLearning)`
- `hive-mind-ml-manager.executeDataCollection()`
- `hive-mind-ml-manager.for(const [moduleId, module] of this.systems.hiveModules)`
- `hive-mind-ml-manager.if(data)`
- `hive-mind-ml-manager.collectModuleData(module)`
- `hive-mind-ml-manager.executeProcessing()`
- `hive-mind-ml-manager.makeTrainingDecision()`
- `hive-mind-ml-manager.if(hasEnoughData)`
- `hive-mind-ml-manager.if(timeSinceLastTraining > 3600000)`
- `hive-mind-ml-manager.if(needsImprovement)`
- `hive-mind-ml-manager.executeTraining()`
- `hive-mind-ml-manager.executeEvaluation()`
- `hive-mind-ml-manager.makeDeploymentDecision()`
- `hive-mind-ml-manager.if(evaluationPass)`
- `hive-mind-ml-manager.if(improvementDetected)`
- `hive-mind-ml-manager.if(stable)`
- `hive-mind-ml-manager.executeDeployment()`
- `hive-mind-ml-manager.executeEvolution()`
- `hive-mind-ml-manager.executeCommunitySync()`
- `hive-mind-ml-manager.calculateOutcomes(cycle)`
- `hive-mind-ml-manager.makeQuickDecisions()`
- `hive-mind-ml-manager.if(this.pipeline.dataCollection.dataPoints < 500)`
- `hive-mind-ml-manager.if(this.pipeline.training.accuracy < 0.6)`
- `hive-mind-ml-manager.for(const decision of decisions)`
- `hive-mind-ml-manager.executeDecision(decision)`
- `hive-mind-ml-manager.switch(decision.action)`
- `hive-mind-ml-manager.updateMetrics()`
- `hive-mind-ml-manager.generateWithML(prompt)`
- `hive-mind-ml-manager.saveCycle(cycle)`
- `hive-mind-ml-manager.loadOrchestrationState()`
- `hive-mind-ml-manager.catch(error)`
- `hive-mind-ml-manager.saveOrchestrationState()`
- `hive-mind-ml-manager.getStatus()`
- `hive-mind-ml-manager.shutdown()`
- `huggingface-integrator.initialize()`
- `huggingface-integrator.if(this.config.autoSync)`
- `huggingface-integrator.startAutoSync()`
- `huggingface-integrator.performSync()`
- `huggingface-integrator.catch(error)`
- `huggingface-integrator.uploadLocalData()`
- `huggingface-integrator.if(datasetUpload)`
- `huggingface-integrator.if(modelUpload)`
- `huggingface-integrator.prepareDatasetUpload(name, config)`
- `huggingface-integrator.prepareModelUpload(name, config)`
- `huggingface-integrator.downloadCommunityData()`
- `huggingface-integrator.for(const model of communityModels)`
- `huggingface-integrator.if(download)`
- `huggingface-integrator.for(const dataset of communityDatasets)`
- `huggingface-integrator.if(download)`
- `huggingface-integrator.discoverCommunityModels()`
- `huggingface-integrator.discoverCommunityDatasets()`
- `huggingface-integrator.downloadModel(model)`
- `huggingface-integrator.downloadDataset(dataset)`
- `huggingface-integrator.mergeCommunityImprovements(downloads)`
- `huggingface-integrator.for(const download of downloads)`
- `huggingface-integrator.if(download.type === 'model')`
- `huggingface-integrator.if(download.type === 'dataset')`
- `huggingface-integrator.for(const pattern of patterns)`
- `huggingface-integrator.extractModelImprovements(download)`
- `huggingface-integrator.extractDatasetPatterns(download)`
- `huggingface-integrator.createSpace(name, config)`
- `huggingface-integrator.updateSpace(name, app)`
- `huggingface-integrator.getCommunityInsights()`
- `huggingface-integrator.loadSyncState()`
- `huggingface-integrator.catch(error)`
- `huggingface-integrator.saveSyncState()`
- `huggingface-integrator.getStatus()`
- `huggingface-integrator.shutdown()`
- `huggingface-integrator.if(this.syncInterval)`
- `vibe-ml-core.initialize()`
- `vibe-ml-core.initializeMLLibraries()`
- `vibe-ml-core.startDataCollection()`
- `vibe-ml-core.if(this.config.autoTrain)`
- `vibe-ml-core.collectData()`
- `vibe-ml-core.if(this.stats.totalDataPoints % 100 === 0)`
- `vibe-ml-core.collectInteractionData()`
- `vibe-ml-core.collectCodeGenData()`
- `vibe-ml-core.sortArray(arr)`
- `vibe-ml-core.collectErrorData()`
- `vibe-ml-core.addToDataset(dataPoint)`
- `vibe-ml-core.if(dataPoint.data.codeGen)`
- `vibe-ml-core.if(dataPoint.data.errors)`
- `vibe-ml-core.trainModels()`
- `vibe-ml-core.if(this.state.datasetSize < 100)`
- `vibe-ml-core.if(this.datasets.codeGeneration.length > 50)`
- `vibe-ml-core.if(this.datasets.errorCorrection.length > 50)`
- `vibe-ml-core.if(this.config.uploadToHF)`
- `vibe-ml-core.trainCodeGenerator()`
- `vibe-ml-core.trainErrorPredictor()`
- `vibe-ml-core.generateCode(prompt)`
- `vibe-ml-core.if(!this.models.codeGenerator.trained)`
- `vibe-ml-core.generated()`
- `vibe-ml-core.fallbackGeneration(prompt)`
- `vibe-ml-core.placeholder()`
- `vibe-ml-core.predictAndFixError(error, context)`
- `vibe-ml-core.if(!this.models.errorPredictor.trained)`
- `vibe-ml-core.saveCheckpoint(trainingSession)`
- `vibe-ml-core.uploadToHuggingFace()`
- `vibe-ml-core.downloadFromHuggingFace()`
- `vibe-ml-core.generateReport()`
- `vibe-ml-core.calculateAverageAccuracy()`
- `vibe-ml-core.if(model.accuracy)`
- `vibe-ml-core.saveDatasets()`
- `vibe-ml-core.loadDatasets()`
- `vibe-ml-core.catch(error)`
- `vibe-ml-core.getStatus()`
- `vibe-ml-core.shutdown()`
- `vibe-ml-core.if(this.collectionInterval)`
- `vibe-ml-core.if(this.trainingInterval)`

### All Events

- `hive-mind-ml-manager:initialized`
- `hive-mind-ml-manager:cycleComplete`
- `hive-mind-ml-manager:metricsUpdated`
- `hive-mind-ml-manager:shutdown`
- `huggingface-integrator:initialized`
- `huggingface-integrator:syncComplete`
- `huggingface-integrator:syncError`
- `huggingface-integrator:shutdown`
- `vibe-ml-core:initialized`
- `vibe-ml-core:dataCollected`
- `vibe-ml-core:trainingComplete`
- `vibe-ml-core:huggingFaceUpload`
- `vibe-ml-core:shutdown`

---

_API documentation auto-generated from source code_
