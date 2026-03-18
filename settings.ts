import { PluginSettingTab, App, Setting, ButtonComponent, TextComponent, DropdownComponent } from 'obsidian';
import { NIMService } from './nim-service';

interface PluginSettings {
  endpoint: string;
  apiKey: string;
  embeddingModel: string;
  chatModel: string;
  connectionThreshold: number;
  autoProcessOnLoad: boolean;
  autoProcessThreshold: number;
  maxSuggestedConnections: number;
  showNotifications: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
  endpoint: 'https://integrate.api.nvidia.com',
  apiKey: '',
  embeddingModel: 'nvidia/nv-embedqa-e5-v5',
  chatModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
  connectionThreshold: 0.6,
  autoProcessOnLoad: false,
  autoProcessThreshold: 0.7,
  maxSuggestedConnections: 5,
  showNotifications: true
};

export class NIMGraphSettingsTab extends PluginSettingTab {
  settings: PluginSettings;
  nimService: NIMService | null = null;
  private saveAction: () => Promise<void>;

  constructor(app: App, settings: PluginSettings, saveAction: () => Promise<void>) {
    super(app, app);
    this.settings = settings;
    this.saveAction = saveAction;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'NVIDIA NIM Graph Manager Settings' });

    new Setting(containerEl)
      .setName('API Endpoint')
      .setDesc('The NVIDIA NIM API endpoint URL')
      .addText((text) => {
        text
          .setPlaceholder('https://integrate.api.nvidia.com')
          .setValue(this.settings.endpoint)
          .onChange(async (value) => {
            this.settings.endpoint = value;
            await this.saveAction();
          });
        text.inputEl.type = 'url';
      });

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Your NVIDIA NIM API key (will be stored securely)')
      .addText((text) => {
        text
          .setPlaceholder('Enter your API key')
          .setValue(this.settings.apiKey)
          .onChange(async (value) => {
            this.settings.apiKey = value;
            await this.saveAction();
          });
        text.inputEl.type = 'password';
      });

    this.createModelSettings(containerEl);

    this.createConnectionSettings(containerEl);

    this.createAutoProcessingSettings(containerEl);

    this.createTestSettings(containerEl);
  }

  private createModelSettings(containerEl: HTMLElement): void {
    const modelSection = containerEl.createEl('div', { cls: 'setting-item' });
    modelSection.createEl('h3', { text: 'Model Configuration' });

    new Setting(containerEl)
      .setName('Embedding Model')
      .setDesc('The model to use for generating text embeddings')
      .addDropdown((dropdown) => {
        const embeddingModels = [
          'nvidia/nv-embedqa-e5-v5',
          'nvidia/nv-embedqa-mistral-7b-v2',
          'nvidia/nv-embedqa-001',
          'openai/text-embedding-ada-002'
        ];

        embeddingModels.forEach(model => {
          dropdown.addOption(model, model.split('/').pop() || model);
        });

        dropdown.setValue(this.settings.embeddingModel);
        dropdown.onChange(async (value) => {
          this.settings.embeddingModel = value;
          await this.saveAction();
        });
      });

    new Setting(containerEl)
      .setName('Chat Model')
      .setDesc('The model to use for generating connection explanations')
      .addDropdown((dropdown) => {
        const chatModels = [
          'nvidia/llama-3.1-nemotron-70b-instruct',
          'nvidia/llama-3.1-8b-instruct',
          'nvidia/llama-3-70b-instruct',
          'nvidia/llama-3-8b-instruct',
          'meta/llama-3.1-405b-instruct'
        ];

        chatModels.forEach(model => {
          dropdown.addOption(model, model.split('/').pop() || model);
        });

        dropdown.setValue(this.settings.chatModel);
        dropdown.onChange(async (value) => {
          this.settings.chatModel = value;
          await this.saveAction();
        });
      });

    new Setting(containerEl)
      .setName('Refresh Available Models')
      .setDesc('Fetch and update the list of available models from the API')
      .addButton((button) => {
        button.setButtonText('Refresh Models');
        button.onClick(async () => {
          button.setButtonText('Loading...');
          button.setDisabled(true);

          try {
            const service = this.createNIMService();
            const models = await service.getAvailableModels();
            
            const noticeEl = containerEl.createEl('div', {
              cls: 'setting-item-description',
              text: `Found ${models.data?.length || 0} available models`
            });

            setTimeout(() => noticeEl.remove(), 5000);
          } catch (error) {
            const errorEl = containerEl.createEl('div', {
              cls: 'setting-item-description mod-error',
              text: `Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`
            });

            setTimeout(() => errorEl.remove(), 5000);
          }

          button.setButtonText('Refresh Models');
          button.setDisabled(false);
        });
      });
  }

  private createConnectionSettings(containerEl: HTMLElement): void {
    const connectionSection = containerEl.createEl('div', { cls: 'setting-item' });
    connectionSection.createEl('h3', { text: 'Connection Settings' });

    new Setting(containerEl)
      .setName('Connection Threshold')
      .setDesc('Minimum similarity score required for suggesting a connection (0.0 - 1.0)')
      .addText((text) => {
        text
          .setPlaceholder('0.6')
          .setValue(this.settings.connectionThreshold.toString())
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
              this.settings.connectionThreshold = numValue;
              await this.saveAction();
            }
          });
        text.inputEl.type = 'number';
        text.inputEl.min = '0';
        text.inputEl.max = '1';
        text.inputEl.step = '0.1';
      });

    new Setting(containerEl)
      .setName('Max Suggested Connections')
      .setDesc('Maximum number of connections to suggest per note')
      .addText((text) => {
        text
          .setPlaceholder('5')
          .setValue(this.settings.maxSuggestedConnections.toString())
          .onChange(async (value) => {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && numValue > 0) {
              this.settings.maxSuggestedConnections = numValue;
              await this.saveAction();
            }
          });
        text.inputEl.type = 'number';
        text.inputEl.min = '1';
        text.inputEl.max = '50';
        text.inputEl.step = '1';
      });
  }

  private createAutoProcessingSettings(containerEl: HTMLElement): void {
    const autoSection = containerEl.createEl('div', { cls: 'setting-item' });
    autoSection.createEl('h3', { text: 'Automatic Processing' });

    new Setting(containerEl)
      .setName('Auto Process on Load')
      .setDesc('Automatically analyze graph connections when Obsidian loads')
      .addToggle((toggle) => {
        toggle
          .setValue(this.settings.autoProcessOnLoad)
          .onChange(async (value) => {
            this.settings.autoProcessOnLoad = value;
            await this.saveAction();
          });
      });

    new Setting(containerEl)
      .setName('Auto Process Threshold')
      .setDesc('Connection threshold used during automatic processing')
      .addText((text) => {
        text
          .setPlaceholder('0.7')
          .setValue(this.settings.autoProcessThreshold.toString())
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
              this.settings.autoProcessThreshold = numValue;
              await this.saveAction();
            }
          });
        text.inputEl.type = 'number';
        text.inputEl.min = '0';
        text.inputEl.max = '1';
        text.inputEl.step = '0.1';
      });

    new Setting(containerEl)
      .setName('Show Notifications')
      .setDesc('Display notifications when connections are found')
      .addToggle((toggle) => {
        toggle
          .setValue(this.settings.showNotifications)
          .onChange(async (value) => {
            this.settings.showNotifications = value;
            await this.saveAction();
          });
      });
  }

  private createTestSettings(containerEl: HTMLElement): void {
    const testSection = containerEl.createEl('div', { cls: 'setting-item' });
    testSection.createEl('h3', { text: 'Test Connection' });

    const testButtonContainer = new Setting(containerEl)
      .setName('Test API Connection')
      .setDesc('Verify your API configuration is working correctly')
      .addButton((button) => {
        button.setButtonText('Test Connection');
        button.setClass('mod-cta');

        button.el.addEventListener('click', async () => {
          const buttonEl = button.buttonEl;
          const originalText = buttonEl.textContent;
          
          buttonEl.textContent = 'Testing...';
          buttonEl.disabled = true;

          try {
            const service = this.createNIMService();
            const isHealthy = await service.healthCheck();

            if (isHealthy) {
              this.showSuccessMessage(containerEl, 'Connection successful! Your API configuration is working.');
            } else {
              this.showErrorMessage(containerEl, 'Connection failed. Please check your API key and endpoint.');
            }
          } catch (error) {
            this.showErrorMessage(containerEl, `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }

          buttonEl.textContent = originalText;
          buttonEl.disabled = false;
        });
      });

    new Setting(containerEl)
      .setName('Validate Configuration')
      .setDesc('Check if all required fields are configured')
      .addButton((button) => {
        button.setButtonText('Validate');
        
        button.el.addEventListener('click', () => {
          const issues: string[] = [];

          if (!this.settings.endpoint) {
            issues.push('API endpoint is required');
          }

          if (!this.settings.apiKey) {
            issues.push('API key is required');
          }

          if (!this.settings.embeddingModel) {
            issues.push('Embedding model must be selected');
          }

          if (!this.settings.chatModel) {
            issues.push('Chat model must be selected');
          }

          if (this.settings.connectionThreshold < 0 || this.settings.connectionThreshold > 1) {
            issues.push('Connection threshold must be between 0 and 1');
          }

          if (this.settings.autoProcessThreshold < 0 || this.settings.autoProcessThreshold > 1) {
            issues.push('Auto process threshold must be between 0 and 1');
          }

          if (this.settings.maxSuggestedConnections < 1) {
            issues.push('Max suggested connections must be at least 1');
          }

          if (issues.length === 0) {
            this.showSuccessMessage(containerEl, 'All configuration is valid!');
          } else {
            this.showErrorMessage(containerEl, issues.join('. '));
          }
        });
      });
  }

  private createNIMService(): NIMService {
    return new NIMService({
      apiKey: this.settings.apiKey,
      endpoint: this.settings.endpoint,
      embeddingModel: this.settings.embeddingModel,
      chatModel: this.settings.chatModel
    });
  }

  private showSuccessMessage(containerEl: HTMLElement, message: string): void {
    const successEl = containerEl.createEl('div', {
      cls: 'setting-item-description mod-success',
      text: `✓ ${message}`
    });

    setTimeout(() => successEl.remove(), 5000);
  }

  private showErrorMessage(containerEl: HTMLElement, message: string): void {
    const errorEl = containerEl.createEl('div', {
      cls: 'setting-item-description mod-error',
      text: `✗ ${message}`
    });

    setTimeout(() => errorEl.remove(), 5000);
  }

  updateSettings(newSettings: Partial<PluginSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): PluginSettings {
    return { ...this.settings };
  }
}

export { DEFAULT_SETTINGS, PluginSettings };
