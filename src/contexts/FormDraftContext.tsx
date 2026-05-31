import { createContext, useCallback, useContext, useRef } from "react";

// ─── Context definition ───────────────────────────────────────────────────────

interface FormDraftContextValue {
  /** Mark a section as dirty (has unsaved changes) */
  setDirty: (sectionId: string, isDirty: boolean) => void;
  /** Check if a specific section has unsaved changes */
  checkDirty: (sectionId: string) => boolean;
}

const FormDraftContext = createContext<FormDraftContextValue>({
  setDirty: () => {},
  checkDirty: () => false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FormDraftProvider({ children }: { children: React.ReactNode }) {
  // Use a ref so updates don't trigger re-renders
  const mapRef = useRef(new Map<string, boolean>());

  const setDirty = useCallback((sectionId: string, isDirty: boolean) => {
    mapRef.current.set(sectionId, isDirty);
  }, []);

  const checkDirty = useCallback((sectionId: string) => {
    return mapRef.current.get(sectionId) ?? false;
  }, []);

  return (
    <FormDraftContext.Provider value={{ setDirty, checkDirty }}>
      {children}
    </FormDraftContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useFormDraft = () => useContext(FormDraftContext);
