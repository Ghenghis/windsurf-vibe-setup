# Machine Learning Project Rules

## Project Type
This is a Machine Learning / AI research project.

## Tech Stack
- Python 3.10+
- PyTorch or TensorFlow
- Hugging Face Transformers
- Weights & Biases for experiment tracking
- Jupyter notebooks for exploration

## Code Standards

### File Structure
```
project/
├── data/              # Data files (gitignored)
│   ├── raw/           # Original data
│   ├── processed/     # Cleaned data
│   └── external/      # Third-party data
├── notebooks/         # Jupyter notebooks
├── src/
│   ├── data/          # Data loading/processing
│   ├── models/        # Model architectures
│   ├── training/      # Training loops
│   ├── evaluation/    # Metrics and evaluation
│   └── utils/         # Helper functions
├── configs/           # Hydra/YAML configs
├── scripts/           # CLI scripts
├── checkpoints/       # Model weights (gitignored)
└── runs/              # Experiment logs (gitignored)
```

### Naming Conventions
- Experiments: descriptive names (`bert_base_finetune_v2`)
- Models: architecture + size (`gpt2_small.py`)
- Configs: experiment name + date

## Best Practices
- Use configuration files (Hydra, YAML)
- Log all hyperparameters
- Set random seeds for reproducibility
- Use mixed precision training
- Checkpoint frequently
- Version control data with DVC

## GPU Considerations
- Check CUDA availability before training
- Use `torch.cuda.empty_cache()` when needed
- Set `PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128`
- Monitor GPU memory usage

## Experiment Tracking
- Log metrics to W&B or MLflow
- Save model configs with checkpoints
- Document results in README
- Keep a research log

## Don't Do
- No hardcoded paths (use configs)
- No training without validation
- No pushing large files to git
- No experiments without logging
- No models without evaluation metrics
