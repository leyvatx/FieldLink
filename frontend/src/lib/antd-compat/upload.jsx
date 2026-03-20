import { useState } from "react";
import { PiX } from "react-icons/pi";
import { cn } from "@/lib/utils";

function renderUploadListItem(file, removeFile) {
  const label = file?.name ?? file?.originFileObj?.name ?? "archivo";
  const href = file?.url;

  return (
    <div key={file.uid ?? file.id ?? label} className="fd-upload-item">
      <div className="min-w-0 flex-1 truncate">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-sm text-[color:var(--sk-color-primary)] hover:underline">
            {label}
          </a>
        ) : (
          <span className="text-sm">{label}</span>
        )}
      </div>
      <button
        type="button"
        className="rounded-md p-1 text-[color:var(--sk-color-text-secondary)] transition hover:text-[color:var(--sk-color-error)]"
        onClick={removeFile}
      >
        <PiX size={14} />
      </button>
    </div>
  );
}

export function Upload({
  children,
  beforeUpload,
  onChange,
  showUploadList = true,
  accept,
  multiple = false,
  disabled = false,
  fileList,
  listType = "text",
}) {
  const inputId = `upload-${Math.random().toString(36).slice(2)}`;
  const [internalFiles, setInternalFiles] = useState([]);
  const controlled = fileList !== undefined;
  const files = controlled ? fileList ?? [] : internalFiles;

  const emitChange = async (selectedFiles) => {
    const transformed = [];

    for (const file of selectedFiles) {
      try {
        const shouldContinue = beforeUpload ? await beforeUpload(file) : true;
        if (shouldContinue === false) continue;
      } catch {
        continue;
      }

      transformed.push({
        uid: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        status: "done",
        originFileObj: file,
      });
    }

    const nextList = multiple ? [...files, ...transformed] : transformed.slice(0, 1);
    if (!controlled) {
      setInternalFiles(nextList);
    }
    const lastFile = nextList[nextList.length - 1];
    onChange?.({ file: lastFile, fileList: nextList });
  };

  const removeFile = (target) => {
    const nextList = files.filter((file) => file !== target);
    if (!controlled) {
      setInternalFiles(nextList);
    }
    onChange?.({ file: target, fileList: nextList });
  };

  const wrapperClass =
    listType === "picture-circle"
      ? "inline-flex cursor-pointer rounded-full"
      : "block cursor-pointer rounded-2xl border border-dashed border-[color:var(--sk-color-border)] bg-[color:var(--sk-color-bg-container)] p-5 transition hover:border-[color:var(--sk-color-primary)]";

  return (
    <div className="ant-upload">
      <label htmlFor={inputId} className={cn(wrapperClass, disabled && "pointer-events-none opacity-60")}>
        {children}
      </label>
      <input
        id={inputId}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => emitChange(Array.from(event.target.files ?? []))}
      />
      {showUploadList !== false && files?.length ? (
        <div className="fd-upload-list">
          {files.map((file) => renderUploadListItem(file, () => removeFile(file)))}
        </div>
      ) : null}
    </div>
  );
}

export default Upload;
