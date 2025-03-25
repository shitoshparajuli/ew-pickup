import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PositionRankingTabsProps {
  positions: string[];
  onChange: (positions: string[]) => void;
}

interface SortableItemProps {
  id: string;
}

const SortableItem = ({ id }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '10px',
    marginBottom: '8px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    cursor: 'grab',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <span className="font-medium">{id}</span>
      <span className="text-gray-500 text-sm">
        Drag to reorder
      </span>
    </div>
  );
};

export default function PositionRankingTabs({ positions, onChange }: PositionRankingTabsProps) {
  const [rankedPositions, setRankedPositions] = useState<string[]>([]);

  // Initialize positions when they change
  useEffect(() => {
    setRankedPositions([...positions]);
  }, [positions]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = rankedPositions.indexOf(active.id as string);
      const newIndex = rankedPositions.indexOf(over.id as string);
      
      const newPositions = arrayMove(rankedPositions, oldIndex, newIndex);
      setRankedPositions(newPositions);
      onChange(newPositions);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Preferred positions
        </h3>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rankedPositions}
            strategy={verticalListSortingStrategy}
          >
            <div>
              {rankedPositions.length > 0 ? (
                rankedPositions.map((position) => (
                  <SortableItem key={position} id={position} />
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No positions available
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
} 