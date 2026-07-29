import type { StudioModule, StudioContext, StudioHandle } from "@ec/studio-sdk";
import { detectFormat, decompressGzip, parseTar } from "./tar";
import type { TarEntry } from "./tar";

// ─── CSS ──────────────────────────────────────────────────────────────────────

const STYLE_ID = "ec-studio-tar-styles";

const CSS = `
.tar-root{height:100%;display:flex;flex-direction:column;font-family:var(--font-mono,ui-monospace,monospace);font-size:12px;color:#e2e8f0}
.tar-drop{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;margin:12px;border:1.5px dashed rgba(34,224,255,.22);border-radius:12px;cursor:pointer;transition:border-color .15s,background .15s}
.tar-drop.drag-over{border-color:rgba(34,224,255,.65);background:rgba(34,224,255,.04)}
.tar-drop-icon{font-size:36px;opacity:.55}
.tar-drop-label{color:rgba(34,224,255,.72);font-size:11px;letter-spacing:.13em;text-transform:uppercase}
.tar-drop-hint{font-size:10px;opacity:.38;letter-spacing:.06em}
.tar-header{display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid rgba(124,77,255,.18);flex-shrink:0}
.tar-archive-name{font-size:11px;opacity:.55;letter-spacing:.08em;text-transform:uppercase;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tar-clear-btn{flex-shrink:0;font-size:10px;padding:2px 8px;border:1px solid rgba(34,224,255,.22);border-radius:4px;background:none;color:rgba(34,224,255,.65);cursor:pointer;letter-spacing:.08em;text-transform:uppercase;transition:border-color .12s,background .12s}
.tar-clear-btn:hover{border-color:rgba(34,224,255,.55);background:rgba(34,224,255,.06)}
.tar-status{font-size:10px;padding:3px 12px;opacity:.38;letter-spacing:.06em;flex-shrink:0}
.tar-body{flex:1;display:flex;overflow:hidden}
.tar-tree{width:230px;border-right:1px solid rgba(124,77,255,.14);overflow-y:auto;padding:4px 0;flex-shrink:0}
.tar-node{display:flex;align-items:center;gap:5px;padding:3px 12px;cursor:default;white-space:nowrap;overflow:hidden}
.tar-node.clickable{cursor:pointer}
.tar-node.clickable:hover{background:rgba(34,224,255,.06)}
.tar-node.selected{background:rgba(34,224,255,.11);color:#22e0ff}
.tar-node-icon{flex-shrink:0;font-size:10px}
.tar-node-name{overflow:hidden;text-overflow:ellipsis;font-size:11px}
.tar-node-size{flex-shrink:0;margin-left:auto;opacity:.3;font-size:10px;padding-left:4px}
.tar-preview{flex:1;overflow:auto;padding:12px}
.tar-preview-empty{height:100%;display:flex;align-items:center;justify-content:center;opacity:.28;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
.tar-preview-text{white-space:pre-wrap;word-break:break-all;font-size:11px;line-height:1.65;color:#cbd5e1;margin:0}
.tar-preview-binary{color:rgba(34,224,255,.45);font-size:11px;letter-spacing:.07em}
.tar-preview-symlink{color:rgba(249,115,22,.7);font-size:11px;letter-spacing:.07em}
.tar-error{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px;text-align:center}
.tar-error-icon{font-size:28px}
.tar-error-msg{color:#f97316;font-size:11px;letter-spacing:.06em;max-width:36ch}
.tar-retry-btn{margin-top:6px;font-size:10px;padding:3px 10px;border:1px solid rgba(249,115,22,.35);border-radius:4px;background:none;color:rgba(249,115,22,.75);cursor:pointer;letter-spacing:.08em;text-transform:uppercase;transition:border-color .12s,background .12s}
.tar-retry-btn:hover{border-color:rgba(249,115,22,.6);background:rgba(249,115,22,.06)}
`;

// ─── utilities ────────────────────────────────────────────────────────────────

function fmtSize(n: number): string {
  if (n < 1024) return `${n}b`;
  if (n < 1_048_576) return `${(n / 1024).toFixed(1)}k`;
  return `${(n / 1_048_576).toFixed(1)}M`;
}

const TEXT_EXTENSIONS = new Set([
  "txt","md","markdown","json","jsonc","yaml","yml","toml","ini","cfg","conf",
  "sh","bash","zsh","fish","env","gitignore","gitattributes","editorconfig",
  "py","js","ts","tsx","jsx","mjs","cjs","mts","cts","go","rs","c","cpp","cc",
  "h","hpp","java","kt","rb","php","pl","lua","swift","cs","fs","fsx","ex","exs",
  "erl","hrl","elm","hs","ml","mli","clj","cljs","scala","groovy",
  "html","htm","xml","svg","css","scss","sass","less","graphql","gql",
  "sql","csv","tsv","log","properties","dockerfile","makefile","cmake","gradle",
  "license","notice","readme","authors","changelog","contributing",
]);

function looksLikeText(entry: TarEntry): boolean {
  const ext = (entry.name.split(".").pop() ?? "").toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  // Sniff: null byte or non-printable control characters → binary
  const sample = entry.data.subarray(0, 512);
  for (const b of sample) {
    if (b === 0) return false;
    if (b < 8 || (b >= 14 && b < 32 && b !== 0x1b)) return false;
  }
  return true;
}

// ─── studio ───────────────────────────────────────────────────────────────────

const studio: StudioModule = {
  manifest: {
    id: "tar",
    name: "Tar Unzip",
    kind: "lab",
    tier: 1,
    budgetKb: 90,
    capabilities: ["fs"],
    roots: ["tar.entries"],
  },

  mount(ctx: StudioContext): StudioHandle {
    // Inject shared stylesheet once — removed on dispose when no other instance is live
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement("style");
      s.id = STYLE_ID;
      s.textContent = CSS;
      document.head.appendChild(s);
    }

    const tarMap = ctx.doc.getMap("tar.entries");
    const root = document.createElement("div");
    root.className = "tar-root";
    ctx.host.appendChild(root);

    let entries: TarEntry[] = [];
    let selectedIdx = -1;
    let archiveName = "";

    // ── views ─────────────────────────────────────────────────────────────────

    function renderDropZone() {
      root.innerHTML = "";

      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".tar,.tar.gz,.tgz,.tar.bz2,.tbz2";
      input.style.display = "none";
      root.appendChild(input);

      const drop = document.createElement("div");
      drop.className = "tar-drop";
      drop.innerHTML =
        `<div class="tar-drop-icon">📦</div>` +
        `<div class="tar-drop-label">Drop a .tar, .tar.gz or .tgz</div>` +
        `<div class="tar-drop-hint">or click to browse</div>`;

      drop.addEventListener("click", () => input.click());
      drop.addEventListener("dragover", (e) => {
        e.preventDefault();
        drop.classList.add("drag-over");
      });
      drop.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
      drop.addEventListener("drop", (e) => {
        e.preventDefault();
        drop.classList.remove("drag-over");
        const file = e.dataTransfer?.files[0];
        if (file) void processFile(file);
      });
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (file) void processFile(file);
      });

      root.appendChild(drop);
    }

    function renderExplorer() {
      root.innerHTML = "";

      // header
      const hdr = document.createElement("div");
      hdr.className = "tar-header";
      const aname = document.createElement("span");
      aname.className = "tar-archive-name";
      aname.textContent = archiveName;
      const clearBtn = document.createElement("button");
      clearBtn.className = "tar-clear-btn";
      clearBtn.textContent = "clear";
      clearBtn.addEventListener("click", () => {
        entries = [];
        selectedIdx = -1;
        archiveName = "";
        ctx.doc.transact(() => tarMap.clear(), "local");
        renderDropZone();
      });
      hdr.appendChild(aname);
      hdr.appendChild(clearBtn);
      root.appendChild(hdr);

      // summary line
      const status = document.createElement("div");
      status.className = "tar-status";
      const fc = entries.filter((e) => e.type === "file").length;
      const dc = entries.filter((e) => e.type === "dir").length;
      status.textContent = `${fc} file${fc !== 1 ? "s" : ""}, ${dc} dir${dc !== 1 ? "s" : ""}`;
      root.appendChild(status);

      // body: tree + preview
      const body = document.createElement("div");
      body.className = "tar-body";
      root.appendChild(body);

      const tree = document.createElement("div");
      tree.className = "tar-tree";
      body.appendChild(tree);

      const preview = document.createElement("div");
      preview.className = "tar-preview";
      body.appendChild(preview);

      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const depth = e.name.split("/").filter(Boolean).length - 1;
        const displayName = e.name.split("/").pop() || e.name;

        const node = document.createElement("div");
        const isClickable = e.type === "file" || e.type === "symlink";
        node.className =
          "tar-node" +
          (isClickable ? " clickable" : "") +
          (i === selectedIdx ? " selected" : "");
        node.style.paddingLeft = `${12 + depth * 10}px`;

        const icon = e.type === "dir" ? "📁" : e.type === "symlink" ? "🔗" : "📄";

        const iconSpan = document.createElement("span");
        iconSpan.className = "tar-node-icon";
        iconSpan.textContent = icon;

        const nameSpan = document.createElement("span");
        nameSpan.className = "tar-node-name";
        nameSpan.textContent = displayName;

        node.appendChild(iconSpan);
        node.appendChild(nameSpan);

        if (e.type === "file") {
          const sizeSpan = document.createElement("span");
          sizeSpan.className = "tar-node-size";
          sizeSpan.textContent = fmtSize(e.size);
          node.appendChild(sizeSpan);
        }

        if (isClickable) {
          const idx = i;
          node.addEventListener("click", () => {
            selectedIdx = idx;
            ctx.doc.transact(() => tarMap.set("selectedFile", e.name), "local");
            renderExplorer();
          });
        }

        tree.appendChild(node);
      }

      // preview pane
      if (selectedIdx >= 0 && selectedIdx < entries.length) {
        const sel = entries[selectedIdx];
        if (sel.type === "symlink") {
          const div = document.createElement("div");
          div.className = "tar-preview-symlink";
          div.textContent = `→ ${sel.linkname ?? "(no target)"}`;
          preview.appendChild(div);
        } else if (looksLikeText(sel)) {
          const pre = document.createElement("pre");
          pre.className = "tar-preview-text";
          pre.textContent = new TextDecoder("utf-8", { fatal: false }).decode(sel.data);
          preview.appendChild(pre);
        } else {
          const div = document.createElement("div");
          div.className = "tar-preview-binary";
          div.textContent = `Binary file · ${fmtSize(sel.size)}`;
          preview.appendChild(div);
        }
      } else {
        const empty = document.createElement("div");
        empty.className = "tar-preview-empty";
        empty.textContent = "select a file to preview";
        preview.appendChild(empty);
      }
    }

    function renderError(msg: string) {
      root.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "tar-error";
      const icon = document.createElement("div");
      icon.className = "tar-error-icon";
      icon.textContent = "⚠️";
      const msgEl = document.createElement("div");
      msgEl.className = "tar-error-msg";
      msgEl.textContent = msg;
      const btn = document.createElement("button");
      btn.className = "tar-retry-btn";
      btn.textContent = "try another file";
      btn.addEventListener("click", renderDropZone);
      wrap.appendChild(icon);
      wrap.appendChild(msgEl);
      wrap.appendChild(btn);
      root.appendChild(wrap);
    }

    // ── file processing ───────────────────────────────────────────────────────

    async function processFile(file: File) {
      archiveName = file.name;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const fmt = detectFormat(bytes);

      if (fmt === "tar.bz2") {
        renderError("bzip2 decompression is not yet supported in the browser");
        return;
      }
      if (fmt === "unknown") {
        renderError("Unrecognised file format — expected .tar, .tar.gz, or .tgz");
        return;
      }

      let tarBytes: Uint8Array;
      try {
        tarBytes = fmt === "tar.gz" ? await decompressGzip(bytes) : bytes;
        entries = parseTar(tarBytes);
      } catch (err) {
        renderError(`Extraction failed: ${(err as Error).message}`);
        return;
      }

      ctx.doc.transact(() => {
        tarMap.set("archiveName", archiveName);
        tarMap.set("entryCount", entries.length);
        tarMap.delete("selectedFile");
      }, "local");

      selectedIdx = -1;
      renderExplorer();
    }

    // initial render
    renderDropZone();

    return {
      dispose() {
        root.remove();
        // Only remove the shared stylesheet when no other tar studio instance is present
        if (!ctx.host.ownerDocument.querySelector(".tar-root")) {
          document.getElementById(STYLE_ID)?.remove();
        }
      },
    };
  },
};

export default studio;
