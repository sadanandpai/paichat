"use client";

import { useMemo, useState } from "react";
import { loadTool, saveTool } from "@/app/admin/actions";
import {
  TOOL_CATALOG,
  type ToolDataMap,
  type ToolId,
  type ToolMeta,
} from "@/lib/tools/catalog";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; message: string }
  | { kind: "err"; message: string };

type RagFormProps = {
  initialData: ToolDataMap;
  loadError?: string;
};

export function RagForm({ initialData, loadError }: RagFormProps) {
  const [selected, setSelected] = useState<ToolId>("intro");
  const [drafts, setDrafts] = useState<ToolDataMap>(initialData);
  const [saved, setSaved] = useState<ToolDataMap>(initialData);
  const [status, setStatus] = useState<Status>(
    loadError
      ? { kind: "err", message: loadError }
      : { kind: "ok", message: "Loaded from Redis." },
  );
  const [busy, setBusy] = useState<"save" | "reset" | null>(null);

  const tool = useMemo(
    () => TOOL_CATALOG.find((item) => item.id === selected) as ToolMeta,
    [selected],
  );
  const text = drafts[selected] ?? "";
  const dirty = text !== saved[selected];
  const disabled = busy !== null;

  function selectTool(id: ToolId) {
    if (id === selected) return;
    setSelected(id);
    setStatus({ kind: "idle" });
  }

  async function onReset() {
    setBusy("reset");
    setStatus({ kind: "loading" });
    try {
      const result = await loadTool(selected);
      if (!result.ok) {
        setStatus({ kind: "err", message: result.error });
        return;
      }
      setDrafts((prev) => ({ ...prev, [selected]: result.text }));
      setSaved((prev) => ({ ...prev, [selected]: result.text }));
      setStatus({
        kind: "ok",
        message: result.text.trim()
          ? `Reloaded ${tool.label}.`
          : `${tool.label} is empty.`,
      });
    } catch (err) {
      setStatus({
        kind: "err",
        message: err instanceof Error ? err.message : "Failed to reload.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function onSave() {
    setBusy("save");
    setStatus({ kind: "loading" });
    try {
      const result = await saveTool(selected, text);
      if (!result.ok) {
        setStatus({ kind: "err", message: result.error });
        return;
      }
      setSaved((prev) => ({ ...prev, [selected]: text }));
      if (selected === "knowledge") {
        if (result.unchanged) {
          setStatus({
            kind: "ok",
            message: "Saved to Redis. Weaviate already matched.",
          });
          return;
        }
        setStatus({
          kind: "ok",
          message: `Saved to Redis. Indexed ${result.chunks} chunk${result.chunks === 1 ? "" : "s"}.`,
        });
        return;
      }
      setStatus({ kind: "ok", message: `Saved ${tool.label} to Redis.` });
    } catch (err) {
      setStatus({
        kind: "err",
        message: err instanceof Error ? err.message : "Failed to save.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 md:flex-row">
      <aside className="md:w-56 md:shrink-0">
        <p className="mb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Tools
        </p>
        <ul className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {TOOL_CATALOG.map((item) => {
            const active = item.id === selected;
            const itemDirty = drafts[item.id] !== saved[item.id];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => selectTool(item.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap disabled:opacity-50 ${
                    active
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  {itemDirty ? (
                    <span className={active ? "opacity-70" : "text-zinc-400"}>
                      {" "}
                      ·
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <form
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
      >
        <label className="flex min-h-0 flex-1 flex-col gap-2">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium">{tool.label}</span>
            <span className="font-mono text-xs text-zinc-500">{tool.name}</span>
          </span>
          <span className="text-sm text-zinc-500">{tool.description}</span>
          <textarea
            value={text}
            onChange={(event) =>
              setDrafts((prev) => ({ ...prev, [selected]: event.target.value }))
            }
            disabled={disabled}
            spellCheck={false}
            className="min-h-80 w-full flex-1 resize-y rounded-lg border border-zinc-200 bg-background px-3 py-2 font-mono text-sm leading-6 outline-none focus:border-zinc-400 disabled:opacity-60 dark:border-zinc-800 dark:focus:border-zinc-600"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={disabled || !dirty}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {busy === "save" ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => void onReset()}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-800"
          >
            {busy === "reset" ? "Loading…" : "Reset"}
          </button>
          <p
            className={
              status.kind === "err"
                ? "text-sm text-red-600 dark:text-red-400"
                : "text-sm text-zinc-500"
            }
          >
            {status.kind === "loading"
              ? "Working…"
              : status.kind === "idle"
                ? dirty
                  ? "Unsaved changes."
                  : null
                : status.message}
          </p>
        </div>
      </form>
    </div>
  );
}
