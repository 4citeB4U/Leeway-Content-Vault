/**
 * LEEWAY HEADER — DO NOT REMOVE
 * REGION: LEEWAY.CONTENT_VAULT.CORE
 * TAG: LEEWAY.CONTENT_VAULT.CORE.TYPES
 * WHAT: Portable Content Vault artifact and theme contracts derived from Foundry ContentWallet.
 * WHY: Preserve the original card and handoff fields without retaining unrelated Foundry runtime types.
 * WHO: LeeWay Content Vault engineering under Creator authority.
 * WHERE: src/types.ts
 * WHEN: 2026-11-04
 * HOW: Type the existing source UI and restrict modifications to the vault boundary.
 * LICENSE: Original author-owned Foundry source provenance retained.
 */
import type {HandoffDestination as Destination} from './foundry/contracts';
export type HandoffDestination = Destination;
export type ContentItemType = 'video' | 'audio' | 'pdf' | 'blog' | 'short' | 'thumbnail' | 'image' | 'post' | 'manifest';
export interface ContentItem {
  id: string;
  beastId: string;
  artifactId?: string;
  version?: number;
  projectId?: string;
  mimeType?: string;
  sourceApp?: 'content-foundry' | 'office-suites' | 'leeway-ide' | 'crm-erp';
  status?: 'available' | 'processing' | 'ready' | 'handoff-staged' | 'error';
  lastHandoffDestination?: Destination;
  type: ContentItemType;
  name: string;
  category: string;
  timestamp: string;
  previewUrl?: string;
  content?: string;
  fileData?: string;
}
export interface VaultSettings {
  leftPanelBg: string;
  buttonRounding: number;
  accentColor: string;
}
