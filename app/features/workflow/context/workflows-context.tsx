import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useModels } from "./models-context";
import { createDefaultWorkflowState, type WorkflowState } from "../state";

export type WorkflowInstance = {
  id: string;
  name: string;
  state: WorkflowState;
};

type StateChange =
  Partial<WorkflowState> | ((prev: WorkflowState) => Partial<WorkflowState>);

type WorkflowsContextValue = {
  workflows: WorkflowInstance[];
  currentId: string | null;
  select: (id: string) => void;
  add: () => void;
  remove: (id: string) => void;
  updateState: (id: string, change: StateChange) => void;
};

const WorkflowsContext = createContext<WorkflowsContextValue | null>(null);

function createInstance(
  name: string,
  stepAutoRun: Record<string, boolean>,
): WorkflowInstance {
  return {
    id: crypto.randomUUID(),
    name,
    state: createDefaultWorkflowState(undefined, stepAutoRun),
  };
}

export function workflowTitle(workflow: WorkflowInstance) {
  const book = workflow.state.bookConfig.bookName?.trim() ?? "";
  return book || workflow.name;
}

function applyChange(state: WorkflowState, change: StateChange): WorkflowState {
  const partial = typeof change === "function" ? change(state) : change;
  return { ...state, ...partial };
}

export function WorkflowsProvider({ children }: { children: ReactNode }) {
  const { stepAutoRun } = useModels();
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>(() => [
    createInstance("مشروع - 1 -", stepAutoRun),
  ]);
  const [currentId, setCurrentId] = useState<string | null>(() => null);

  // Pick a current workflow once the initial list is ready.
  useEffect(() => {
    if (currentId === null && workflows.length > 0) {
      setCurrentId(workflows[0].id);
    }
  }, [currentId, workflows]);

  // Keep currentId valid: if it points to a removed workflow, pick the first
  // remaining one (or null when the list is empty).
  useEffect(() => {
    if (workflows.length === 0) {
      if (currentId !== null) setCurrentId(null);
      return;
    }
    if (!workflows.some((w) => w.id === currentId)) {
      setCurrentId(workflows[0].id);
    }
  }, [workflows, currentId]);

  const select = useCallback((id: string) => setCurrentId(id), []);
  const add = useCallback(() => {
    setWorkflows((prev) => {
      const next = [
        ...prev,
        createInstance(`مشروع - ${prev.length + 1} -`, stepAutoRun),
      ];
      setCurrentId(next[next.length - 1].id);
      return next;
    });
  }, [stepAutoRun]);
  const remove = useCallback((id: string) => {
    setWorkflows((prev) =>
      prev.filter((w) => {
        if (w.id !== id) return true;
        const url = w.state.preview?.url;
        if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
        return false;
      }),
    );
  }, []);
  const updateState = useCallback(
    (id: string, change: StateChange) =>
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, state: applyChange(w.state, change) } : w,
        ),
      ),
    [],
  );

  return (
    <WorkflowsContext.Provider
      value={{ workflows, currentId, select, add, remove, updateState }}
    >
      {children}
    </WorkflowsContext.Provider>
  );
}

export function useWorkflows() {
  const ctx = useContext(WorkflowsContext);
  if (!ctx)
    throw new Error("useWorkflows must be used within a WorkflowsProvider");
  return ctx;
}

export function useWorkflow(id: string | null) {
  const { workflows, updateState } = useWorkflows();
  const instance = id ? workflows.find((w) => w.id === id) : undefined;
  const update = useCallback(
    (change: StateChange) => {
      if (!id) return;
      updateState(id, change);
    },
    [id, updateState],
  );
  if (!instance) return null;
  return {
    name: instance.name,
    state: instance.state,
    update,
  };
}
