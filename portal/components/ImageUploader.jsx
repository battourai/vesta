'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableImageItem({ id, url, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group w-28 h-28 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 shadow-sm"
    >
      <img src={url} alt="Upload preview" className="w-full h-full object-cover" />
      
      {/* Cover Photo Badge */}
      {index === 0 && (
        <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow pointer-events-none">
          Cover
        </span>
      )}

      {/* Dedicated Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 bg-gray-800/70 text-white px-1.5 py-0.5 rounded text-[10px] cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        ⠿
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-red-700 transition"
        title="Remove photo"
      >
        ✕
      </button>
    </div>
  );
}

export default function ImageUploader({ images, setImages }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      // Create a lightweight local blob URL for instant preview (bypasses heavy base64 strings)
      const previewUrl = URL.createObjectURL(file);
      const newItem = {
        id: Math.random().toString(36).substring(2, 9),
        file: file, // Keep the raw file object for direct cloud uploading later
        url: previewUrl, 
      };
      setImages((prev) => [...prev, newItem]);
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemove = (id) => {
    setImages((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Property Photos (Drag the ⠿ handle to reorder, first image is cover)
      </label>

      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB</p>
          </div>
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-3">
            {images.map((img, index) => (
              <SortableImageItem
                key={img.id}
                id={img.id}
                url={img.url}
                index={index}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}