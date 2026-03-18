# AI Graph Manager

Universal AI-powered graph management for Obsidian using customizable API providers (NVIDIA NIM, OpenAI, Anthropic, etc.) for intelligent note connections and graph optimization.

## Features

- **Universal API Support**: Works with NVIDIA NIM, OpenAI, Anthropic, and any OpenAI-compatible API
- **AI-Powered Connections**: Leverage AI to analyze your notes and suggest meaningful connections between them
- **Graph Optimization**: Automatically optimizes the graph view by highlighting important relationships and clustering related notes
- **Smart Suggestions**: Receive intelligent recommendations for note connections based on content analysis
- **Multi-Model Support**: Compatible with various AI models and hosting providers
- **Customizable Settings**: Configure API keys, model parameters, and optimization preferences
- **Real-Time Analysis**: Analyze changes in your vault and update graph connections dynamically
- **Batch Processing**: Process multiple notes at once for efficient graph updates
- **Visual Enhancement**: Improved graph visualization with AI-driven insights

## Installation

### Via BRAT (Beta Reviewer's Automatic Tester)

BRAT is the recommended method for installing beta and unreleased Obsidian plugins.

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) from the Obsidian Community Plugins
2. Open Obsidian's Settings → Community Plugins → Browse
3. Install "BRAT" if you haven't already
4. Go to Settings → Community Plugins → BRAT
5. Click "Add a Beta Plugin for Testing"
6. Enter this repository URL: `https://github.com/Regator49/obsidian-ai-graph-manager.git`
7. Click "Scan"
8. Click "Install" next to "AI Graph Manager"
9. Navigate to Community Plugins and enable "AI Graph Manager"

### Manual Installation

1. Download the latest release from the [Releases page](https://github.com/Regator49/obsidian-ai-graph-manager/releases)
2. Extract the downloaded ZIP file
3. Copy the extracted folder to your Obsidian vault's `.obsidian/plugins/` directory
4. Rename the folder to `ai-graph-manager`
5. Restart Obsidian
6. Go to Settings → Community Plugins and enable "AI Graph Manager"

## Configuration

### Setting Up Your API Connection

AI Graph Manager supports multiple API providers. Choose the one that works best for you:

#### NVIDIA NIM (Recommended)

1. **Get NVIDIA NIM Access**:
   - Visit [NVIDIA NIM](https://build.nvidia.com/nim) to explore available models
   - Sign up or log in to your NVIDIA account
   - Navigate to API Keys section
   - Generate a new API key for your application

2. **Configure API Settings**:
   - Open Obsidian Settings → Community Plugins → AI Graph Manager
   - Set **API Endpoint** to: `https://integrate.api.nvidia.com`
   - Enter your NVIDIA NIM API Key in the "API Key" field
   - Select your preferred models from the dropdowns

#### OpenAI

1. **Get OpenAI Access**:
   - Visit [OpenAI API](https://platform.openai.com/)
   - Generate an API key

2. **Configure API Settings**:
   - Set **API Endpoint** to: `https://api.openai.com/v1`
   - Enter your OpenAI API Key
   - Select `gpt-4` or `gpt-3.5-turbo` as your models

#### Other Providers

Any OpenAI-compatible API should work by setting the appropriate:
- **API Endpoint**: The base URL of your API provider
- **API Key**: Your authentication key
- **Embedding Model**: For text embeddings (e.g., `text-embedding-ada-002`)
- **Chat Model**: For chat completions (e.g., `gpt-4`)

3. **Test Connection**:
   - Click "Test API Connection" to verify your credentials
   - A success message indicates your setup is complete

### Plugin Settings

- **Connection Threshold**: Minimum similarity score for suggested connections (0.0-1.0)
- **Max Suggested Connections**: Maximum number of connection suggestions per note
- **Auto Process on Load**: Automatically analyze graph connections when Obsidian loads
- **Auto Process Threshold**: Higher threshold for automatic processing (reduces noise)
- **Show Notifications**: Display notifications when connections are found

## Usage

### Basic Usage

1. **Enable the Plugin**: After installation, enable "NIM Graph Manager" in Community Plugins settings

2. **Open Graph View**: Click the graph icon in the left ribbon or press `Ctrl+G` to open the graph view

3. **AI-Enhanced Graph**: The graph view now displays AI-suggested connections with dashed lines, while existing links remain solid

4. **View Suggestions**: Hover over notes to see suggested connections with confidence scores

### Command Palette Commands

Access commands via `Ctrl+P` (or `Cmd+P` on Mac):

- `NIM Graph Manager: Analyze Active Note` - Analyze the currently open note
- `NIM Graph Manager: Analyze All Notes` - Analyze all notes in your vault
- `NIM Graph Manager: Apply Suggestions` - Apply AI-suggested connections as actual links
- `NIM Graph Manager: Clear Suggestions` - Clear all pending suggestions
- `NIM Graph Manager: Refresh Graph` - Refresh the graph view with latest analysis

### Creating Connections

1. **Review Suggestions**: Open the graph view and look for dashed lines indicating suggested connections
2. **Apply Connections**: Right-click on a suggested connection and select "Apply" to create the link
3. **Manual Analysis**: Use the command palette to analyze specific notes

### Viewing Analysis Results

- **Graph View**: Visual representation of all connections and suggestions
- **Note View**: Suggestions panel appears at the bottom of each note
- **Status Bar**: Shows analysis progress and API usage statistics

### Integration with Existing Workflows

- Works seamlessly with Obsidian's built-in graph view
- Compatible with other graph-related plugins (Dataview, Excalidraw, etc.)
- Suggestion data is stored locally in your vault (.obsidian/nim-graph-data.json)

## Screenshots

Coming soon!

*Main graph view with AI-suggested connections*

*Configuration settings panel*

*Suggestion interface in note editor*

## Contributing

Contributions are welcome! Here's how you can help:

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/obsidian-nim-graph.git
   cd obsidian-nim-graph
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build in development mode:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

### Guidelines

- Follow the [Obsidian Plugin Review guidelines](https://github.com/obsidianmd/obsidian-releases/blob/master/README.md)
- Write meaningful commit messages
- Include tests for new features
- Update documentation for user-facing changes
- Report bugs via GitHub Issues

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Troubleshooting

### Common Issues

**API Connection Failed**:
- Verify your API key is correct and active
- Check if you have available credits/quota on your NVIDIA NIM account
- Ensure your network allows connections to NVIDIA's API endpoints

**No Suggestions Appearing**:
- Check if "Auto-Analyze" is enabled in settings
- Manually trigger analysis via command palette
- Verify your vault contains enough notes for meaningful analysis

**Graph Not Updating**:
- Refresh the graph view by toggling it on/off
- Check the "Graph Update Frequency" setting
- Clear suggestion data and re-analyze

### Debug Mode

Enable debug mode in plugin settings to see detailed logs in the Obsidian Developer Console (Ctrl+Shift+I).

## License

MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Credits

- Built with [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- Powered by [NVIDIA NIM](https://www.nvidia.com/en-us/ai-data-science/products/nim/)
- Inspired by the Obsidian community

## Support

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Documentation**: Check the [Wiki](https://github.com/yourusername/obsidian-nim-graph/wiki) for detailed guides

## Acknowledgments

Thanks to the Obsidian community for creating such an amazing platform and to NVIDIA for providing the NIM API infrastructure.
