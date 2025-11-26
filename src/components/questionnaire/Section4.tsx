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
  emoji: string;
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
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`flex items-center gap-4 p-5 rounded-xl border transition-all ${
          isDragging
            ? "bg-primary/10 border-primary shadow-lg scale-105"
            : "bg-muted/30 border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        {/* Rank Number */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="font-bold text-primary text-lg">{index + 1}</span>
        </div>

        {/* Element Info */}
        <span className="text-3xl flex-shrink-0">{element.emoji}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-lg">{element.name}</h4>
          <p className="text-sm text-muted-foreground">{element.description}</p>
        </div>

        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};

const Section4 = ({ initialData, onNext, onBack }: Section4Props) => {
  const initialElements: Element[] = [
    { id: "fire", emoji: "🔥", name: "FIRE", description: "Volcanic, intense, transformative landscapes" },
    { id: "water", emoji: "🌊", name: "WATER", description: "Calm, still, emotionally regulating spaces" },
    { id: "stone", emoji: "🪨", name: "STONE", description: "Ancient, sacred, grounded environments" },
    { id: "urban", emoji: "🏙", name: "URBAN", description: "Modern, buzzing, architecturally stimulating" },
    { id: "desert", emoji: "🏜", name: "DESERT", description: "Silent, minimal, open horizons" },
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
      className="space-y-12"
    >
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
        <h3 className="text-2xl font-heading font-semibold mb-4">
          Rank these landscape types from most to least resonant with your soul.
        </h3>
        <p className="text-sm text-muted-foreground mb-8">
          Drag and drop to reorder. <strong>Rank 1</strong> (top) = Most Resonant
        </p>

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
            <div className="space-y-3">
              {elements.map((element, index) => (
                <SortableItem key={element.id} element={element} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Scoring Info */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong>Scoring:</strong> Rank 1 = 100 points • Rank 2 = 75 points • Rank 3 = 50 points • Rank 4 = 25 points • Rank 5 = 0 points
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8">
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
