import { create } from 'zustand'
import { createElementFromCatalog } from '../config/elementCatalog'
import { createDefaultModel, DEFAULT_MODEL } from '../config/model'
import type {
  CatalogType,
  CircuitId,
  ClipAxis,
  DesignElement,
  DesignModel,
  FireplaceVisibility,
  ModelSnapshot,
  ReviewPresetId,
  ViewerUiState,
} from '../config/modelSchema'
import { REVIEW_PRESETS } from '../config/reviewPresets'
import { derivedInclineHorizontal, validateModel } from '../config/validateModel'

const MAX_HISTORY = 40

interface ViewerStore extends ViewerUiState {
  model: DesignModel
  past: DesignModel[]
  future: DesignModel[]
  snapshots: ModelSnapshot[]
  cameraView: 'front' | 'side' | 'top' | 'iso' | 'reset' | null
  cameraNonce: number
  cameraAction:
    | 'zoomIn'
    | 'zoomOut'
    | 'fit'
    | 'orbitLeft'
    | 'orbitRight'
    | 'orbitUp'
    | 'orbitDown'
    | null
  cameraActionNonce: number

  setModel: (model: DesignModel, pushHistory?: boolean) => void
  undo: () => void
  redo: () => void
  resetModel: () => void
  updateFireplace: (patch: Partial<DesignModel['fireplace']>) => void
  updateInsertFit: (patch: Partial<DesignModel['insertFit']>) => void
  setLayerVisible: (id: string, visible: boolean) => void
  setElementVisible: (id: string, visible: boolean) => void
  select: (id: string | null) => void
  setFireplaceVisibility: (v: FireplaceVisibility) => void
  setShowDimensions: (v: boolean) => void
  setShowLabels: (v: boolean) => void
  setShowFlows: (v: boolean) => void
  setFlowAnimation: (v: boolean) => void
  setActiveCircuits: (v: ViewerUiState['activeCircuits']) => void
  setShellOpacity: (v: number) => void
  setMasonryOpacity: (v: number) => void
  setChamberOpacity: (v: number) => void
  setEnvelopeSeparate: (v: number) => void
  setShowEnvelopeEdges: (v: boolean) => void
  setShowEnvelopeLabels: (v: boolean) => void
  setExplode: (v: number) => void
  setClipEnabled: (v: boolean) => void
  setClipAxis: (v: ClipAxis) => void
  setClipPosition: (v: number) => void
  setTheme: (v: 'light' | 'dark') => void
  setCameraView: (v: ViewerStore['cameraView']) => void
  requestCameraAction: (action: NonNullable<ViewerStore['cameraAction']>) => void
  setDoorOpen: (open: boolean) => void
  toggleDoor: () => void
  applyReviewMode: (id: ReviewPresetId) => void
  setGuidedTourStep: (step: number | null) => void
  addElement: (type: CatalogType) => void
  duplicateElement: (id: string) => void
  removeElement: (id: string) => void
  updateElement: (id: string, patch: Partial<DesignElement>) => void
  addFlowEdge: (
    circuit: Exclude<CircuitId, 'none'>,
    from: { ownerId: string; portId: string },
    to: { ownerId: string; portId: string },
    label?: string,
  ) => void
  setReviewNotes: (notes: string) => void
  saveSnapshot: (name: string) => void
  restoreSnapshot: (id: string) => void
  importModel: (model: DesignModel) => void
  validationIssues: () => ReturnType<typeof validateModel>
}

function syncIncline(model: DesignModel): DesignModel {
  const inclineHorizontal = derivedInclineHorizontal(model.fireplace)
  const fit = model.insertFit

  // Migración a fachada v2 (puerta, rejillas, ventilador, toma exterior…)
  if ((model.version ?? 1) < 2 || !model.layers.some((l) => l.id === 'grilleBottom')) {
    const fresh = createDefaultModel()
    const optionalVisibility = new Map(
      model.layers.filter((l) => l.optional).map((l) => [l.id, l.visible]),
    )
    return {
      ...fresh,
      fireplace: {
        ...model.fireplace,
        inclineHorizontal,
        origins: { ...model.fireplace.origins, inclineHorizontal: 'derived' },
      },
      insertFit: {
        ...fit,
        roofClearance: fit.roofClearance ?? 2.5,
      },
      reviewNotes: model.reviewNotes,
      layers: fresh.layers.map((l) =>
        optionalVisibility.has(l.id)
          ? { ...l, visible: optionalVisibility.get(l.id)! }
          : l,
      ),
    }
  }

  return {
    ...model,
    version: Math.max(model.version ?? 2, 2),
    fireplace: {
      ...model.fireplace,
      inclineHorizontal,
      origins: { ...model.fireplace.origins, inclineHorizontal: 'derived' },
    },
    insertFit: {
      ...fit,
      roofClearance: fit.roofClearance ?? 2.5,
    },
  }
}

function pushPast(past: DesignModel[], model: DesignModel) {
  return [...past.slice(-(MAX_HISTORY - 1)), structuredClone(model)]
}

const initialUi: ViewerUiState = {
  fireplaceVisibility: 'solid',
  showDimensions: true,
  showLabels: false,
  showFlows: true,
  flowAnimation: true,
  activeCircuits: 'all',
  shellOpacity: 0.55,
  masonryOpacity: 0.92,
  chamberOpacity: 1,
  envelopeSeparate: 0,
  showEnvelopeEdges: true,
  showEnvelopeLabels: false,
  explode: 0,
  clipEnabled: false,
  clipAxis: 'x',
  clipPosition: 0,
  selectedId: null,
  reviewMode: null,
  guidedTourStep: null,
  theme:
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  doorOpen: false,
}

export const useViewerStore = create<ViewerStore>((set, get) => ({
  ...initialUi,
  model: structuredClone(DEFAULT_MODEL),
  past: [],
  future: [],
  snapshots: [],
  cameraView: 'iso',
  cameraNonce: 0,
  cameraAction: null,
  cameraActionNonce: 0,

  setModel: (model, pushHistory = true) => {
    const next = syncIncline(model)
    set((s) => ({
      model: next,
      past: pushHistory ? pushPast(s.past, s.model) : s.past,
      future: pushHistory ? [] : s.future,
    }))
  },

  undo: () => {
    const { past, model, future } = get()
    if (!past.length) return
    const prev = past[past.length - 1]
    set({
      model: prev,
      past: past.slice(0, -1),
      future: [structuredClone(model), ...future],
    })
  },

  redo: () => {
    const { past, model, future } = get()
    if (!future.length) return
    const next = future[0]
    set({
      model: next,
      past: pushPast(past, model),
      future: future.slice(1),
    })
  },

  resetModel: () => {
    get().setModel(createDefaultModel())
  },

  updateFireplace: (patch) => {
    const model = { ...get().model, fireplace: { ...get().model.fireplace, ...patch } }
    get().setModel(syncIncline(model))
  },

  updateInsertFit: (patch) => {
    get().setModel({
      ...get().model,
      insertFit: { ...get().model.insertFit, ...patch },
    })
  },

  setLayerVisible: (id, visible) => {
    const model = get().model
    get().setModel({
      ...model,
      layers: model.layers.map((l) => (l.id === id ? { ...l, visible } : l)),
    }, false)
  },

  setElementVisible: (id, visible) => {
    const model = get().model
    get().setModel({
      ...model,
      elements: model.elements.map((e) => (e.id === id ? { ...e, visible } : e)),
    }, false)
  },

  select: (id) => set({ selectedId: id }),
  setFireplaceVisibility: (fireplaceVisibility) => set({ fireplaceVisibility }),
  setShowDimensions: (showDimensions) => set({ showDimensions }),
  setShowLabels: (showLabels) => set({ showLabels }),
  setShowFlows: (showFlows) => set({ showFlows }),
  setFlowAnimation: (flowAnimation) => set({ flowAnimation }),
  setActiveCircuits: (activeCircuits) => set({ activeCircuits }),
  setShellOpacity: (shellOpacity) => set({ shellOpacity }),
  setMasonryOpacity: (masonryOpacity) => set({ masonryOpacity }),
  setChamberOpacity: (chamberOpacity) => set({ chamberOpacity }),
  setEnvelopeSeparate: (envelopeSeparate) => set({ envelopeSeparate }),
  setShowEnvelopeEdges: (showEnvelopeEdges) => set({ showEnvelopeEdges }),
  setShowEnvelopeLabels: (showEnvelopeLabels) => set({ showEnvelopeLabels }),
  setExplode: (explode) => set({ explode }),
  setClipEnabled: (clipEnabled) => set({ clipEnabled }),
  setClipAxis: (clipAxis) => set({ clipAxis }),
  setClipPosition: (clipPosition) => set({ clipPosition }),
  setTheme: (theme) => {
    document.documentElement.dataset.theme = theme
    set({ theme })
  },
  setCameraView: (cameraView) =>
    set((s) => ({ cameraView, cameraNonce: s.cameraNonce + 1 })),

  requestCameraAction: (cameraAction) =>
    set((s) => ({ cameraAction, cameraActionNonce: s.cameraActionNonce + 1 })),

  setDoorOpen: (doorOpen) => set({ doorOpen }),
  toggleDoor: () => set((s) => ({ doorOpen: !s.doorOpen })),

  applyReviewMode: (id) => {
    const preset = REVIEW_PRESETS.find((p) => p.id === id)
    if (!preset) return
    const patch = preset.apply()
    const { visibleLayerIds, cameraView, ...ui } = patch
    set({ ...ui, reviewMode: id })
    if (cameraView) {
      set((s) => ({ cameraView, cameraNonce: s.cameraNonce + 1 }))
    }
    if (visibleLayerIds) {
      const model = get().model
      get().setModel(
        {
          ...model,
          layers: model.layers.map((l) => ({
            ...l,
            visible: l.optional ? l.visible : visibleLayerIds.includes(l.id),
          })),
        },
        false,
      )
    }
  },

  setGuidedTourStep: (guidedTourStep) => set({ guidedTourStep }),

  addElement: (type) => {
    const id = `${type}_${Date.now().toString(36)}`
    const el = createElementFromCatalog(type, id, { x: 0, y: 8, z: -8 })
    get().setModel({ ...get().model, elements: [...get().model.elements, el] })
    set({ selectedId: id })
  },

  duplicateElement: (id) => {
    const src = get().model.elements.find((e) => e.id === id)
    if (!src) return
    const copy: DesignElement = {
      ...structuredClone(src),
      id: `${src.catalogType}_${Date.now().toString(36)}`,
      name: `${src.name} (copia)`,
      position: {
        x: src.position.x + 4,
        y: src.position.y,
        z: src.position.z + 4,
      },
    }
    get().setModel({ ...get().model, elements: [...get().model.elements, copy] })
    set({ selectedId: copy.id })
  },

  removeElement: (id) => {
    const model = get().model
    get().setModel({
      ...model,
      elements: model.elements.filter((e) => e.id !== id),
      flowEdges: model.flowEdges.filter(
        (e) => e.from.ownerId !== id && e.to.ownerId !== id,
      ),
    })
    if (get().selectedId === id) set({ selectedId: null })
  },

  updateElement: (id, patch) => {
    const model = get().model
    get().setModel({
      ...model,
      elements: model.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })
  },

  addFlowEdge: (circuit, from, to, label) => {
    const id = `e_${Date.now().toString(36)}`
    get().setModel({
      ...get().model,
      flowEdges: [...get().model.flowEdges, { id, circuit, from, to, label }],
    })
  },

  setReviewNotes: (reviewNotes) => {
    get().setModel({ ...get().model, reviewNotes }, false)
  },

  saveSnapshot: (name) => {
    const snap: ModelSnapshot = {
      id: `snap_${Date.now().toString(36)}`,
      name,
      createdAt: new Date().toISOString(),
      model: structuredClone(get().model),
    }
    set((s) => ({ snapshots: [...s.snapshots, snap] }))
  },

  restoreSnapshot: (id) => {
    const snap = get().snapshots.find((s) => s.id === id)
    if (snap) get().setModel(structuredClone(snap.model))
  },

  importModel: (model) => {
    get().setModel(syncIncline(model))
  },

  validationIssues: () => validateModel(get().model),
}))

// Apply theme on load
document.documentElement.dataset.theme = useViewerStore.getState().theme
