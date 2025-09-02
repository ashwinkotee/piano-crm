import type { ReactNode } from "react";

export default function Modal({ title, children, onClose, width = "max-w-xl" }:{
  title: string; children: ReactNode; onClose: ()=>void; width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className={`w-full ${width} max-h-[85vh] rounded-2xl border border-slate-200 bg-white p-4 shadow-card flex flex-col`}>
        <div className="mb-1 flex items-center justify-between">
          <div className="text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">?</button>
        </div>
        <div className="mt-2 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

