
import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { SectionTest } from "../types/course";

interface Props {
  tests: SectionTest[];
  getTestName: (testId: string) => string;
  onReorder: (reorderedTests: SectionTest[]) => Promise<void>;
  onConfigure: (testKey: string) => void;
  onRemove: (sectionTestId: string) => Promise<void>;
  onVisibility: (testKey: string) => void;
  saving: boolean;
  sectionId: string;
}

const TestList: React.FC<Props> = ({
  tests,
  getTestName,
  onReorder,
  onConfigure,
  onRemove,
  onVisibility,
  saving,
  sectionId,
}) => {
  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    const reordered = Array.from(tests).sort((a, b) => a.order - b.order);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    const updated = reordered.map((t, idx) => ({ ...t, order: idx + 1 }));
    await onReorder(updated);
  };

  return (
    <div>
      <div className="text-sm font-medium mb-2">Assigned Tests</div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={`droppable-${sectionId}`}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`${
                snapshot.isDraggingOver ? "bg-blue-50" : ""
              } transition-colors rounded-lg`}
            >
              {tests
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((t, idx) => {
                  // stableKey: prefer local row _id (unique per staged row), fallback to testId
                  const stableKey = t._id ?? t.testId;
                  const draggableId = String(stableKey ?? `tmp-${idx}`);

                  return (
                    <Draggable key={String(stableKey ?? idx)} draggableId={draggableId} index={idx}>
                      {(drag, dragSnapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={`flex items-center p-3 mb-2 rounded-lg bg-gray-50 hover:shadow-sm border transition ${
                            dragSnapshot.isDragging ? "shadow-lg bg-white z-50 rotate-1" : ""
                          }`}
                        >
                          {/* Drag Handle */}
                          <div
                            {...drag.dragHandleProps}
                            className="pr-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              width="12"
                              height="16"
                              viewBox="0 0 12 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="2" cy="2" r="1.5" fill="currentColor" />
                              <circle cx="2" cy="8" r="1.5" fill="currentColor" />
                              <circle cx="2" cy="14" r="1.5" fill="currentColor" />
                              <circle cx="10" cy="2" r="1.5" fill="currentColor" />
                              <circle cx="10" cy="8" r="1.5" fill="currentColor" />
                              <circle cx="10" cy="14" r="1.5" fill="currentColor" />
                            </svg>
                          </div>

                          {/* Test Content */}
                          <div className="flex items-center justify-between flex-1">
                            {/* Test Name */}
                            <span
                              className={`font-medium ${dragSnapshot.isDragging ? "pointer-events-none" : ""}`}
                            >
                              {t.testId ? getTestName(t.testId) : "Unnamed Test"}
                            </span>

                            {/* Action Buttons */}
                            <div className={`flex gap-2 ${dragSnapshot.isDragging ? "pointer-events-none" : ""}`}>
                              {/* Configure Button */}
                              <button
                                onClick={() => {
                                  if (!stableKey) return;
                                  console.log("[TestList] Configure clicked, key:", stableKey);
                                  onConfigure(String(stableKey));
                                }}
                                disabled={!stableKey}
                                className="text-blue-600 text-sm hover:underline disabled:opacity-50"
                              >
                                Configure
                              </button>

                              {/* Visibility Button */}
                              <button
                                onClick={() => {
                                  if (!stableKey) return;
                                  console.log("[TestList] Visibility clicked, key:", stableKey);
                                  onVisibility(String(stableKey));
                                }}
                                disabled={!stableKey}
                                className="px-2 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                              >
                                Visibility
                              </button>

                              {/* Remove Button */}
                              <button
                                onClick={() => onRemove(t._id)}
                                disabled={saving}
                                className="text-red-600 text-sm hover:underline disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
              {provided.placeholder}

              {/* Empty State */}
              {tests.length === 0 && <div className="text-gray-500 text-sm p-4">No tests assigned</div>}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default TestList;
