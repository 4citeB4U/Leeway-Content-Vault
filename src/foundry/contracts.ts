/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CONTRACTS
TAG: CONTRACTS.CONTENT_FOUNDRY.CONTINUUM_HANDOFF
DESCRIPTION: Portable artifact, workspace, and handoff contracts for the Content Foundry.
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render

5WH:
WHAT = Define the stable boundary between the Content Foundry, Continuum, Content Vault, Office Suites, and Leeway IDE.
WHY = Keep artifacts discoverable, versioned, portable, and honest about local versus external execution.
WHO = Leeway Industries / Agent Lee Enablement
WHERE = src/foundry/contracts.ts
WHEN = 2026-11-04
HOW = Use JSON-safe contracts and browser-local persistence until an authorized shared adapter is connected.

CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/

export const FOUNDRY_WORKSPACE_SCHEMA_VERSION = 1;

export type HandoffDestination = 'office-suites' | 'leeway-ide';

export interface FoundryArtifactRef {
  artifactId: string;
  versionId: string;
  name: string;
  type: string;
  mimeType?: string;
  projectId: string;
  sourceApp: 'content-foundry' | 'office-suites' | 'leeway-ide' | 'crm-erp';
  canonicalLocation: string;
  storageState: 'local-cache' | 'pending-sync' | 'canonical-reference';
  provenance: {
    capturedAt: string;
    importedFrom?: string;
    parentArtifactIds?: string[];
  };
}

export interface FoundryHandoffPacket {
  schemaVersion: 'leeway.handoff.v1';
  handoffId: string;
  createdAt: string;
  sourceApp: 'content-foundry';
  destination: HandoffDestination;
  projectId: string;
  intent: string;
  artifactRefs: FoundryArtifactRef[];
  workflow: {
    nodes: unknown[];
    edges: unknown[];
  };
  acceptanceCriteria: string[];
  governance: {
    approvalRequired: true;
    status: 'staged';
    externalExecution: 'not-claimed';
  };
}

export interface FoundryWorkspaceSnapshot {
  schemaVersion: number;
  projectId: string;
  nodes: unknown[];
  edges: unknown[];
  walletContent: unknown[];
  createdItems: unknown[];
  settings: unknown;
  camera: { x: number; y: number; zoom: number };
  handoffs: FoundryHandoffPacket[];
}

function randomSuffix(): string {
  const random = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 10)
    : Math.random().toString(36).slice(2, 12);
  return random.toUpperCase();
}

export function createArtifactId(seed?: string): string {
  if (seed) {
    const normalized = seed.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();
    return `LEEWAY-ART-${normalized || randomSuffix()}`;
  }
  return `LEEWAY-ART-${randomSuffix()}`;
}

export function createHandoffId(): string {
  return `LEEWAY-HANDOFF-${randomSuffix()}`;
}

export function loadWorkspaceSnapshot<T extends FoundryWorkspaceSnapshot>(fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem('leeway.content-foundry.workspace.v1');
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<FoundryWorkspaceSnapshot>;
    if (!parsed || parsed.schemaVersion !== FOUNDRY_WORKSPACE_SCHEMA_VERSION) return fallback;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges) || !Array.isArray(parsed.walletContent)) return fallback;

    return {
      ...fallback,
      ...parsed,
      schemaVersion: FOUNDRY_WORKSPACE_SCHEMA_VERSION,
      projectId: typeof parsed.projectId === 'string' && parsed.projectId.trim() ? parsed.projectId : fallback.projectId,
      handoffs: Array.isArray(parsed.handoffs) ? parsed.handoffs : fallback.handoffs,
    } as T;
  } catch (error) {
    console.warn('Content Foundry workspace restore skipped:', error);
    return fallback;
  }
}

export function saveWorkspaceSnapshot(snapshot: FoundryWorkspaceSnapshot): boolean {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem('leeway.content-foundry.workspace.v1', JSON.stringify(snapshot));
    return true;
  } catch (error) {
    console.error('Content Foundry workspace save failed:', error);
    return false;
  }
}

export function artifactRefFromItem(item: Record<string, unknown>, projectId: string): FoundryArtifactRef {
  const artifactId = String(item.artifactId || item.beastId || createArtifactId());
  const capturedAt = new Date().toISOString();
  const sourceApp = item.sourceApp === 'office-suites' || item.sourceApp === 'leeway-ide' || item.sourceApp === 'crm-erp'
    ? item.sourceApp
    : 'content-foundry';

  return {
    artifactId,
    versionId: `${artifactId}:v${String(item.version || 1)}`,
    name: String(item.name || 'Untitled Foundry artifact'),
    type: String(item.type || 'unknown'),
    mimeType: typeof item.mimeType === 'string' ? item.mimeType : undefined,
    projectId,
    sourceApp,
    canonicalLocation: `continuum://${projectId}/artifacts/${artifactId}`,
    storageState: 'local-cache',
    provenance: {
      capturedAt,
      importedFrom: typeof item.importedFrom === 'string' ? item.importedFrom : undefined,
      parentArtifactIds: Array.isArray(item.parentArtifactIds) ? item.parentArtifactIds.map(String) : undefined,
    },
  };
}

export function buildHandoffPacket(options: {
  destination: HandoffDestination;
  projectId: string;
  item: Record<string, unknown>;
  nodes: unknown[];
  edges: unknown[];
}): FoundryHandoffPacket {
  const destinationLabel = options.destination === 'leeway-ide' ? 'Leeway IDE' : 'Office Suites';

  return {
    schemaVersion: 'leeway.handoff.v1',
    handoffId: createHandoffId(),
    createdAt: new Date().toISOString(),
    sourceApp: 'content-foundry',
    destination: options.destination,
    projectId: options.projectId,
    intent: `Continue the approved Content Foundry work in ${destinationLabel}.`,
    artifactRefs: [artifactRefFromItem(options.item, options.projectId)],
    workflow: {
      nodes: options.nodes,
      edges: options.edges,
    },
    acceptanceCriteria: [
      'Preserve the projectId and artifactId values.',
      'Keep source provenance and version identity attached to the imported artifact.',
      'Do not claim external execution until the destination runtime returns evidence.',
      `Record the receiving application as ${destinationLabel}.`,
    ],
    governance: {
      approvalRequired: true,
      status: 'staged',
      externalExecution: 'not-claimed',
    },
  };
}

export function downloadJson(filename: string, value: unknown): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

// LeeWay Standards: portable contract module.
