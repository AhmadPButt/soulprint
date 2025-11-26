import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { ArrowLeft, ArrowRight, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Section4Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
}

interface Element {
  id: string;
  name: string;
  description: string;
}

interface SortableItemProps {
  element: Element;
  index: number;
}

const SortableItem = ({ element, index }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group ${isDragging ? "z-50" : ""}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
          isDragging
            ? "bg-foreground/10 border-primary shadow-xl scale-[1.02]"
            : "bg-foreground/[0.02] border-border/50 hover:border-primary/50 hover:bg-foreground/5"
        }`}
      >
        {/* Rank Number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="font-medium text-primary text-sm">{index + 1}</span>
        </div>

        {/* Element Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground">{element.name}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{element.description}</p>
        </div>

        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};

const Section4 = ({ initialData, onNext, onBack }: Section4Props) => {
  const initialElements: Element[] = [
    { id: "fire", name: "Fire", description: "Volcanic, intense, transformative landscapes" },
    { id: "water", name: "Water", description: "Calm, still, emotionally regulating spaces" },
    { id: "stone", name: "Stone", description: "Ancient, sacred, grounded environments" },
    { id: "urban", name: "Urban", description: "Modern, buzzing, architecturally stimulating" },
    { id: "desert", name: "Desert", description: "Silent, minimal, open horizons" },
  ];

  // Initialize from saved data if available
  const getInitialOrder = () => {
    if (initialData.Q34 && typeof initialData.Q34 === "string") {
      const savedOrder = initialData.Q34.split(",").map((s) => s.trim().toLowerCase());
      const orderedElements = savedOrder
        .map((name) => initialElements.find((el) => el.name.toLowerCase() === name))
        .filter((el): el is Element => el !== undefined);
      
      // If we have all elements, use saved order, otherwise use default
      if (orderedElements.length === 5) {
        return orderedElements;
      }
    }
    return initialElements;
  };

  const [elements, setElements] = useState<Element[]>(getInitialOrder());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleNext = () => {
    // Convert array order to comma-separated string
    const ranking = elements.map((el) => el.name).join(", ");
    onNext({ Q34: ranking });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-foreground">
            Rank these landscape types from most to least resonant with your soul
          </h3>
          <p className="text-xs text-muted-foreground">
            Drag to reorder • Rank 1 = most resonant
          </p>
        </div>

        {/* Drag and Drop List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={elements.map((el) => el.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {elements.map((element, index) => (
                <SortableItem key={element.id} element={element} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {onBack && (
          <Button onClick={onBack} variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}
        <Button onClick={handleNext} size="lg" className="ml-auto gap-2">
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default Section4;
