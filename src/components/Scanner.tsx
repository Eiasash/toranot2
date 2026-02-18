import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";

interface ScannerProps {
  onTextExtracted: (text: string) => void;
  onCancel: () => void;
}

type ScanState =
  | { step: "idle" }
  | { step: "preview"; imageUrl: string; file: File }
  | { step: "scanning"; imageUrl: string; progress: number }
  | { step: "done"; imageUrl: string; text: string };

export function Scanner({ onTextExtracted, onCancel }: ScannerProps) {
  const [state, setState] = useState<ScanState>({ step: "idle" });
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setState({ step: "preview", imageUrl, file });
  }

  async function runOcr(file: File, imageUrl: string) {
    setState({ step: "scanning", imageUrl, progress: 0 });

    const worker = await createWorker("heb+eng", undefined, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setState((prev) =>
            prev.step === "scanning"
              ? { ...prev, progress: Math.round(m.progress * 100) }
              : prev,
          );
        }
      },
    });

    const {
      data: { text },
    } = await worker.recognize(file);
    await worker.terminate();

    setState({ step: "done", imageUrl, text });
  }

  function handleUseText(text: string) {
    onTextExtracted(text);
    cleanup();
  }

  function cleanup() {
    if (state.step !== "idle" && "imageUrl" in state) {
      URL.revokeObjectURL(state.imageUrl);
    }
    setState({ step: "idle" });
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
  }

  // --- IDLE: show big capture buttons ---
  if (state.step === "idle") {
    return (
      <div className="flex flex-col gap-3">
        {/* Camera - primary action on mobile */}
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex items-center justify-center gap-3 w-full py-5 bg-emerald-600 text-white rounded-xl text-lg font-medium active:bg-emerald-700 active:scale-[0.98] transition-transform"
        >
          <CameraIcon size={28} />
          צלם דף תורן
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Gallery */}
        <button
          onClick={() => galleryRef.current?.click()}
          className="flex items-center justify-center gap-3 w-full py-4 bg-gray-100 text-gray-700 rounded-xl text-base font-medium active:bg-gray-200 active:scale-[0.98] transition-transform"
        >
          <GalleryIcon size={22} />
          בחר תמונה מהגלריה
        </button>
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={onCancel}
          className="text-sm text-gray-400 py-2 active:text-gray-600"
        >
          ביטול
        </button>
      </div>
    );
  }

  // --- PREVIEW: show image + scan button ---
  if (state.step === "preview") {
    return (
      <div className="flex flex-col gap-3">
        <img
          src={state.imageUrl}
          alt="תצוגה מקדימה"
          className="w-full max-h-[40vh] rounded-xl border border-gray-200 object-contain bg-gray-50"
        />
        <button
          onClick={() => runOcr(state.file, state.imageUrl)}
          className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-medium active:bg-blue-700 active:scale-[0.98] transition-transform"
        >
          <ScanIcon size={22} />
          סרוק טקסט
        </button>
        <button
          onClick={() => { cleanup(); }}
          className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl text-base font-medium active:bg-gray-200"
        >
          צלם שוב
        </button>
      </div>
    );
  }

  // --- SCANNING: progress bar ---
  if (state.step === "scanning") {
    return (
      <div className="flex flex-col gap-4 items-center py-6">
        <img
          src={state.imageUrl}
          alt="סורק..."
          className="w-full max-h-[30vh] rounded-xl border border-gray-200 object-contain opacity-50"
        />
        <div className="w-full space-y-2">
          <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
            <Spinner />
            סורק טקסט... {state.progress}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // --- DONE: editable text + import ---
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <img
          src={state.imageUrl}
          alt="תוצאה"
          className="w-20 h-20 rounded-lg border border-gray-200 object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 mb-1">טקסט שזוהה:</p>
          <p className="text-xs text-gray-400">ניתן לערוך לפני הייבוא</p>
        </div>
      </div>
      <textarea
        value={state.text}
        onChange={(e) => setState({ ...state, text: e.target.value })}
        dir="rtl"
        rows={8}
        className="w-full p-3 border border-gray-300 rounded-xl text-sm leading-relaxed resize-y focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
      />
      <button
        onClick={() => handleUseText(state.text)}
        disabled={!state.text.trim()}
        className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-medium active:bg-blue-700 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:pointer-events-none"
      >
        ייבוא רשימה
      </button>
      <div className="flex gap-2">
        <button
          onClick={() => { cleanup(); }}
          className="flex-1 py-3 bg-amber-100 text-amber-800 rounded-xl text-sm font-medium active:bg-amber-200"
        >
          סרוק שוב
        </button>
        <button
          onClick={() => { cleanup(); onCancel(); }}
          className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium active:bg-gray-200"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

// --- Inline SVG icons ---

function CameraIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function GalleryIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function ScanIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M9 14l2 2 4-4" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
