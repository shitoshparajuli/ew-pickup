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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 mb-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded cursor-grab flex justify-between items-center"
      {...attributes}
      {...listeners}
    >
      <span className="font-medium dark:text-white">{id}</span>
      <span className="text-gray-500 dark:text-gray-300 text-sm">
        Drag to reorder
      </span>
    </div>
  );
};

const DEFAULT_POSITIONS = ['Attacker', 'Midfielder', 'Defender'];

export default function PositionRankingTabs({ positions, onChange }: PositionRankingTabsProps) {
  const [rankedPositions, setRankedPositions] = useState<string[]>([]);

  // Initialize positions when they change
  useEffect(() => {
    // Use default positions if the provided array is empty
    const positionsToUse = positions.length > 0 ? positions : DEFAULT_POSITIONS;
    setRankedPositions([...positionsToUse]);
    
    // If we're using default positions and they're different from what was passed in,
    // notify parent component of the change
    if (positions.length === 0 && DEFAULT_POSITIONS.length > 0) {
      onChange([...DEFAULT_POSITIONS]);
    }
  }, [positions, onChange]);

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
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <div className="text-gray-500 dark:text-gray-400 text-center py-4">
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