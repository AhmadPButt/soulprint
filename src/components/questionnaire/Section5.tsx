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

interface Section5Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
}

interface Priority {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface SortableItemProps {
  priority: Priority;
  index: number;
}

const SortableItem = ({ priority, index }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: priority.id });

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

        {/* Priority Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground">
            <span className="mr-2">{priority.emoji}</span>
            {priority.name}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{priority.description}</p>
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

const Section5 = ({ initialData, onNext, onBack }: Section5Props) => {
  const initialPriorities: Priority[] = [
    { id: "visual", emoji: "👁️", name: "Stunning landscapes and visual beauty", description: "Breathtaking scenery, dramatic views, and photogenic moments" },
    { id: "culinary", emoji: "🍽️", name: "Exceptional food and culinary experiences", description: "Fine dining, local cuisine, food markets, and cooking classes" },
    { id: "nature", emoji: "🌲", name: "Being surrounded by nature", description: "Forests, mountains, oceans, and wild spaces" },
    { id: "cultural", emoji: "🏛️", name: "Cultural immersion and learning", description: "History, art, architecture, and local traditions" },
    { id: "wellness", emoji: "🧘", name: "Spa, relaxation, and wellness", description: "Thermal baths, massages, meditation, and restoration" },
  ];

  const getInitialOrder = () => {
    if (initialData.Q41 && Array.isArray(initialData.Q41)) {
      const savedOrder = initialData.Q41 as string[];
      const orderedPriorities = savedOrder
        .map((id) => initialPriorities.find((p) => p.id === id))
        .filter((p): p is Priority => p !== undefined);
      if (orderedPriorities.length === 5) {
        return orderedPriorities;
      }
    }
    return initialPriorities;
  };

  const [priorities, setPriorities] = useState<Priority[]>(getInitialOrder());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPriorities((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleNext = () => {
    const ranking = priorities.map((p) => p.id);
    onNext({ Q41: ranking });
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
            Rank what matters most to you on this trip
          </h3>
          <p className="text-xs text-muted-foreground">
            Drag to reorder • Rank 1 = most important
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={priorities.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {priorities.map((priority, index) => (
                <SortableItem key={priority.id} priority={priority} index={index} />
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

export default Section5;
