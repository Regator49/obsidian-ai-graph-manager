import { Plugin, TFile, App, Notice } from 'obsidian';
import { NIMGraphSettingsTab, PluginSettings, DEFAULT_SETTINGS } from './settings';
import { NIMService } from './nim-service';

interface NoteMetadata {
	path: string;
	title: string;
	content: string;
	tags: string[];
	links: string[];
	frontmatter: Record<string, any>;
}

interface Connection {
	sourceNote: string;
	targetNote: string;
	weight: number;
	reason: string;
	confidence: number;
}

export default class NIMGraphManager extends Plugin {
	settings: PluginSettings;
	nimService: NIMService;
	noteMetadata: Map<string, NoteMetadata>;
	potentialConnections: Connection[];

	async onload() {
		await this.loadSettings();
		this.noteMetadata = new Map();
		this.potentialConnections = [];

		this.nimService = new NIMService({
			endpoint: this.settings.endpoint,
			apiKey: this.settings.apiKey,
			embeddingModel: this.settings.embeddingModel,
			chatModel: this.settings.chatModel
		});

		this.addRibbonIcon('network', 'NIM Graph Manager', () => {
			this.analyzeAndSuggestConnections();
		});

		this.addCommand({
			id: 'analyze-graph',
			name: 'Analyze notes and suggest connections',
			callback: () => {
				this.analyzeAndSuggestConnections();
			}
		});

		this.addCommand({
			id: 'open-nim-settings',
			name: 'Open NIM Graph settings',
			callback: () => {
				(this.app as any).setting.open();
				(this.app as any).setting.openTabById('nim-graph-manager');
			}
		});

		this.addSettingTab(new NIMGraphSettingsTab(this.app, this));

		if (this.settings.autoProcessOnLoad) {
			this.analyzeAndSuggestConnections();
		}

		console.log('NIM Graph Manager plugin loaded');
	}

	onunload() {
		console.log('NIM Graph Manager plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		
		if (this.settings && this.nimService) {
			this.nimService.updateConfig({
				endpoint: this.settings.endpoint,
				apiKey: this.settings.apiKey,
				embeddingModel: this.settings.embeddingModel,
				chatModel: this.settings.chatModel
			});
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async analyzeAndSuggestConnections() {
		if (!this.settings.endpoint || !this.settings.apiKey) {
			new Notice('Please configure your NVIDIA NIM API settings first');
			return;
		}

		new Notice('Analyzing notes...');
		
		await this.collectNoteMetadata();
		this.potentialConnections = await this.generatePotentialConnections();
		
		this.displayConnectionSuggestions();
	}

	async collectNoteMetadata(): Promise<void> {
		const files = this.app.vault.getMarkdownFiles();
		
		for (const file of files) {
			const metadata = await this.extractNoteMetadata(file);
			this.noteMetadata.set(file.path, metadata);
		}
	}

	async extractNoteMetadata(file: TFile): Promise<NoteMetadata> {
		const content = await this.app.vault.read(file);
		const cache = this.app.metadataCache.getFileCache(file);
		
		const tags = new Set<string>();
		const links: string[] = [];
		const frontmatter: Record<string, any> = {};

		if (cache?.tags) {
			cache.tags.forEach(tag => tags.add(tag.tag.replace(/^#/, '')));
		}

		if (cache?.links) {
			cache.links.forEach(link => links.push(link.link));
		}

		if (cache?.frontmatter) {
			Object.assign(frontmatter, cache.frontmatter);
		}

		const title = frontmatter.title || file.basename;

		return {
			path: file.path,
			title,
			content,
			tags: [...tags],
			links,
			frontmatter
		};
	}

	async generatePotentialConnections(): Promise<Connection[]> {
		const connections: Connection[] = [];
		const entries = Array.from(this.noteMetadata.entries());

		for (let i = 0; i < entries.length; i++) {
			for (let j = i + 1; j < entries.length; j++) {
				const [pathA, metaA] = entries[i];
				const [pathB, metaB] = entries[j];

				const connection = await this.analyzeConnection(metaA, metaB);
				if (connection && connection.confidence > 0.5) {
					connections.push(connection);
				}
			}
		}

		return connections.sort((a, b) => b.confidence - a.confidence);
	}

	async analyzeConnection(metaA: NoteMetadata, metaB: NoteMetadata): Promise<Connection | null> {
		const sharedTags = metaA.tags.filter(tag => metaB.tags.includes(tag));
		const hasExistingLink = metaA.links.includes(metaB.title) || metaB.links.includes(metaA.title);
		
		if (hasExistingLink) {
			return null;
		}

		let confidence = 0;
		let reasons: string[] = [];

		if (sharedTags.length > 0) {
			confidence += 0.3 * sharedTags.length;
			reasons.push(`Shared tags: ${sharedTags.join(', ')}`);
		}

		const termOverlap = this.calculateTermOverlap(metaA, metaB);
		if (termOverlap > 0.2) {
			confidence += 0.3;
			reasons.push(`High term overlap: ${(termOverlap * 100).toFixed(0)}%`);
		}

		if (this.settings.apiKey && this.settings.endpoint) {
			try {
				const aiReasoning = await this.getAIConnectionSuggestion(metaA, metaB);
				if (aiReasoning.suggested) {
					confidence += aiReasoning.confidence;
					reasons.push(aiReasoning.reason);
				}
			} catch (error) {
				console.error('AI suggestion failed:', error);
			}
		}

		if (confidence === 0) {
			return null;
		}

		return {
			sourceNote: metaA.path,
			targetNote: metaB.path,
			weight: confidence,
			reason: reasons.join('; '),
			confidence: Math.min(confidence, 1)
		};
	}

	calculateTermOverlap(metaA: NoteMetadata, metaB: NoteMetadata): number {
		const extractTerms = (content: string): Set<string> => {
			const words = content.toLowerCase()
				.replace(/[^\w\s]/g, '')
				.split(/\s+/)
				.filter(word => word.length > 3);
			return new Set(words);
		};

		const termsA = extractTerms(metaA.content);
		const termsB = extractTerms(metaB.content);

		const intersection = new Set([...termsA].filter(x => termsB.has(x)));
		const union = new Set([...termsA, ...termsB]);

		return union.size > 0 ? intersection.size / union.size : 0;
	}

	async getAIConnectionSuggestion(metaA: NoteMetadata, metaB: NoteMetadata): Promise<{
		suggested: boolean;
		confidence: number;
		reason: string;
	}> {
		try {
			const note1 = { id: metaA.path, title: metaA.title, content: metaA.content };
			const note2 = { id: metaB.path, title: metaB.title, content: metaB.content };
			
			const similarity = this.calculateTermOverlap(metaA, metaB);
			const explanation = await this.nimService.generateConnectionExplanation(
				note1, 
				note2, 
				similarity
			);
			
			return {
				suggested: true,
				confidence: similarity * 0.4,
				reason: explanation
			};
		} catch (error) {
			console.error('AI suggestion failed:', error);
			return {
				suggested: false,
				confidence: 0,
				reason: ''
			};
		}
	}

	displayConnectionSuggestions() {
		if (this.potentialConnections.length === 0) {
			new Notice('No significant connections found');
			return;
		}

		const message = `Found ${this.potentialConnections.length} potential connections. Check console for details.`;
		new Notice(message);

		console.log('Potential connections:', this.potentialConnections);
	}
}
