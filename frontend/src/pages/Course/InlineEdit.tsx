// InlineEdit.tsx
import React, { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onSave: (newValue: string) => void | Promise<void>;
  placeholder?: string;
  className?: string;
  textarea?: boolean;
}

const InlineEdit: React.FC<Props> = ({ value, onSave, placeholder, className, textarea }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => setVal(value), [value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = async () => {
    setEditing(false);
    if (val !== value) await onSave(val);
  };

  const cancel = () => {
    setVal(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!textarea && e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (textarea && (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  if (!editing) {
    return (
      <div
        className={`${className} cursor-text rounded hover:bg-gray-50 px-1 -mx-1`}
        onClick={() => setEditing(true)}
      >
        {value?.trim() ? value : (
          <span className="text-gray-400">{placeholder || "Click to edit"}</span>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {textarea ? (
        <textarea
          ref={inputRef as any}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full border rounded px-2 py-2 text-sm"
          rows={3}
        />
      ) : (
        <input
          ref={inputRef as any}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full border rounded px-2 py-2 text-sm"
        />
      )}
      <div className="mt-1 flex gap-2">
        <button onClick={commit} className="rounded bg-blue-600 text-white px-3 py-1.5 text-sm">
          Save
        </button>
        <button onClick={cancel} className="rounded bg-gray-100 px-3 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default InlineEdit;
