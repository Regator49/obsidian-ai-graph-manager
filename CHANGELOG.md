# Changelog

All notable changes to the NIM Graph Manager plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- [ ] Multi-language support
- [ ] Custom model configuration for different vault folders
- [ ] Export analysis results to CSV/JSON
- [ ] Integration with Obsidian Publish
- [ ] Mobile app support
- [ ] Graph visualization customization options
- [ ] Suggestion history and undo functionality

## [0.0.1] - 2024-03-18

### Added
- Initial release of NIM Graph Manager plugin
- Integration with NVIDIA NIM API for AI-powered graph analysis
- Graph view suggestions with confidence scores
- Command palette commands for manual analysis
- Settings panel for API configuration
- Auto-analysis on note changes
- Batch processing for multiple notes
- Connection acceptance workflow
- Status bar integration for progress tracking
- Debug mode for troubleshooting
- Basic graph clustering algorithm
- Local storage of suggestion data

### Configuration
- NVIDIA NIM API key configuration
- Model selection dropdown (supports multiple NIM models)
- Temperature and max tokens parameter controls
- Custom base URL for self-hosted NIM instances
- Connection strength threshold setting
- Graph update frequency control
- Auto-analyze toggle option

### Documentation
- README with installation instructions
- Configuration guide for NVIDIA NIM API
- Usage documentation
- Contributing guidelines
- MIT License

### Known Issues
- Large vaults (1000+ notes) may experience slow analysis
- API rate limits can cause temporary interruptions
- Some special characters in note titles may affect analysis accuracy
- Suggestions may not always reflect recent changes in realtime

## [Future Roadmap]

### Version 0.1.0 (Upcoming)
- Enhanced clustering algorithms with user-defined parameters
- Visual customization for graph elements
- Export/import suggestion data
- Performance improvements for large vaults
- More intuitive suggestion acceptance UI

### Version 0.2.0 (Planned)
- Support for multiple AI providers beyond NVIDIA NIM
- Advanced filtering and search for suggestions
- Integration with popular note-taking workflows
- Suggestion categories (e.g., related topics, references, themes)
- Historical tracking of connection evolution

### Version 1.0.0 (Future)
- Full mobile app support
- Multi-language note analysis
- Collaborative suggestion features
- Plugin ecosystem integrations
- Production-ready API failover and retry mechanisms

---

**Note:** This is an alpha-release plugin. Features and API stability may change in future versions. Please report any issues or suggestions via GitHub Issues.
