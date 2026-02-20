import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info, Settings } from "lucide-react";

// This is a read-only structural view of the questionnaire
// The questionnaire structure is defined in the section components
const QUESTIONNAIRE_STRUCTURE = [
  {
    section: 1,
    name: "Travel Context",
    description: "Travel companion, occasion, desired experience",
    questionCount: 3,
    type: "Radio / Select",
    questions: [
      { id: "Q2", label: "Travel companion", type: "radio", options: ["Solo", "Partner", "Family", "Friends", "Group"] },
      { id: "Q3", label: "Trip occasion", type: "radio", options: ["Leisure", "Adventure", "Cultural", "Wellness", "Business"] },
      { id: "Q34", label: "Elemental resonance ranking", type: "drag-rank", options: ["Fire", "Water", "Stone", "Urban", "Desert"] },
    ]
  },
  {
    section: 2,
    name: "Personality (Big Five)",
    description: "Q4–Q23: Extraversion, Openness, Conscientiousness, Agreeableness, Emotional Stability",
    questionCount: 20,
    type: "Likert Sliders (0–100)",
    questions: [
      { id: "Q4", label: "I enjoy meeting new people while traveling", type: "slider" },
      { id: "Q5", label: "I prefer to be around people rather than alone", type: "slider" },
      { id: "Q6", label: "I feel energized after social experiences", type: "slider" },
      { id: "Q7", label: "I prefer quiet, intimate settings over crowded places [R]", type: "slider" },
      { id: "Q8", label: "I seek out unusual or off-the-beaten-path experiences", type: "slider" },
      { id: "Q9", label: "I'm drawn to art, music, and cultural experiences", type: "slider" },
      { id: "Q10", label: "I enjoy learning about different ways of life", type: "slider" },
      { id: "Q11", label: "I prefer familiar destinations over new ones [R]", type: "slider" },
      { id: "Q12", label: "I research thoroughly before a trip", type: "slider" },
      { id: "Q13", label: "I prefer structured itineraries over spontaneous plans", type: "slider" },
      { id: "Q14", label: "I like to have a clear schedule for each day", type: "slider" },
      { id: "Q15", label: "I often change plans on a whim [R]", type: "slider" },
      { id: "Q16", label: "I enjoy sharing experiences with locals", type: "slider" },
      { id: "Q17", label: "I like helping fellow travelers when they seem lost", type: "slider" },
      { id: "Q18", label: "I prefer group activities over solo exploration", type: "slider" },
      { id: "Q19", label: "I don't go out of my way to accommodate others [R]", type: "slider" },
      { id: "Q20", label: "I handle travel disruptions with ease", type: "slider" },
      { id: "Q21", label: "I feel calm even when plans change unexpectedly", type: "slider" },
      { id: "Q22", label: "I feel anxious in unfamiliar environments [R]", type: "slider" },
      { id: "Q23", label: "Travel often leaves me emotionally drained [R]", type: "slider" },
    ]
  },
  {
    section: 3,
    name: "Travel Behavior",
    description: "Q24–Q33: Spontaneity, Adventure Orientation, Environmental Adaptation",
    questionCount: 10,
    type: "Likert Sliders (0–100)",
    questions: [
      { id: "Q24", label: "I prefer booking trips with little advance planning", type: "slider" },
      { id: "Q25", label: "I enjoy discovering things as I go rather than planning ahead", type: "slider" },
      { id: "Q26", label: "I like the freedom of an open itinerary", type: "slider" },
      { id: "Q27", label: "I prefer to have all accommodations booked in advance [R]", type: "slider" },
      { id: "Q28", label: "I seek physically challenging or extreme activities", type: "slider" },
      { id: "Q29", label: "I enjoy pushing beyond my comfort zone while traveling", type: "slider" },
      { id: "Q30", label: "I avoid activities that involve significant risk [R]", type: "slider" },
      { id: "Q31", label: "I adapt quickly to different climates and environments", type: "slider" },
      { id: "Q32", label: "I'm comfortable traveling in remote or undeveloped areas", type: "slider" },
      { id: "Q33", label: "I prefer hotels with modern amenities over local guesthouses [R]", type: "slider" },
    ]
  },
  {
    section: 4,
    name: "Luxury & Pace",
    description: "Q35–Q42: Inner Compass motivations (Transformation, Clarity, Aliveness, Connection)",
    questionCount: 8,
    type: "Likert Sliders (0–100)",
    questions: [
      { id: "Q35", label: "Travel helps me become a better version of myself", type: "slider" },
      { id: "Q36", label: "I seek experiences that shift my perspective on life", type: "slider" },
      { id: "Q37", label: "I use travel to gain clarity on important life decisions", type: "slider" },
      { id: "Q38", label: "Travel helps me understand what truly matters to me", type: "slider" },
      { id: "Q39", label: "I travel to feel more alive and present", type: "slider" },
      { id: "Q40", label: "I seek out experiences that excite and energize me", type: "slider" },
      { id: "Q41", label: "Deep human connection is a core reason I travel", type: "slider" },
      { id: "Q42", label: "I prioritize experiences that bring me closer to others", type: "slider" },
    ]
  },
  {
    section: 5,
    name: "Sensory Priorities",
    description: "Drag-to-rank sensory experiences",
    questionCount: 1,
    type: "Drag & Rank",
    questions: [
      { id: "Q34_sensory", label: "Rank sensory priorities: Visual, Culinary, Cultural, Nature, Wellness, Achievement", type: "drag-rank" },
    ]
  },
  {
    section: 6,
    name: "Contact & Life Context",
    description: "Q43–Q46: Life phase, shift desired, emotional context, contact details",
    questionCount: 4,
    type: "Select / Text",
    questions: [
      { id: "Q43", label: "Current life phase", type: "select" },
      { id: "Q44", label: "Shift desired from this trip", type: "select" },
      { id: "Q45", label: "Emotional context (multi-select)", type: "multi-select" },
      { id: "Q46", label: "What do you most need to complete?", type: "text" },
    ]
  }
];

export function QuestionnaireEditorTab() {
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Questionnaire Structure</h3>
          <p className="text-sm text-muted-foreground">View and understand the questionnaire layout. Question logic and scoring are defined in the codebase.</p>
        </div>
        <Badge variant="outline" className="gap-1 text-xs">
          <Info className="h-3 w-3" />
          42 Questions · 6 Sections
        </Badge>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700">
              Question text and options are defined in the React components (Section1.tsx through Section6.tsx). 
              To edit question wording, update the relevant component file. Scoring weights are in the compute-soulprint edge function.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {QUESTIONNAIRE_STRUCTURE.map(section => (
          <Card
            key={section.section}
            className={`cursor-pointer transition-all hover:border-primary/40 ${selectedSection === section.section ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setSelectedSection(selectedSection === section.section ? null : section.section)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs w-fit">Section {section.section}</Badge>
                <Badge variant="secondary" className="text-xs">{section.questionCount}Q</Badge>
              </div>
              <CardTitle className="text-sm mt-2">{section.name}</CardTitle>
              <CardDescription className="text-xs">{section.type}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedSection !== null && (() => {
        const section = QUESTIONNAIRE_STRUCTURE.find(s => s.section === selectedSection);
        if (!section) return null;
        return (
          <Card>
            <CardHeader>
              <CardTitle>Section {section.section}: {section.name}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {section.questions.map((q, i) => (
                    <div key={q.id} className="p-3 rounded-lg border border-border bg-muted/20 flex items-start gap-3">
                      <div className="flex-shrink-0 w-14">
                        <Badge variant="outline" className="font-mono text-xs">{q.id}</Badge>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{q.label}</p>
                        {q.label.includes("[R]") && (
                          <p className="text-xs text-amber-600 mt-0.5">Reverse-scored</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">{q.type}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })()}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Scoring Configuration
          </CardTitle>
          <CardDescription>Summary of how responses map to SoulPrint dimensions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground uppercase text-xs tracking-wider">Big Five Dimensions</p>
              {[
                { dim: "Extraversion (E)", questions: "Q4, Q5, Q6, Q7(R)" },
                { dim: "Openness (O)", questions: "Q8, Q9, Q10, Q11(R)" },
                { dim: "Conscientiousness (C)", questions: "Q12, Q13, Q14, Q15(R)" },
                { dim: "Agreeableness (A)", questions: "Q16, Q17, Q18, Q19(R)" },
                { dim: "Emotional Stability (ES)", questions: "Q20, Q21, Q22(R), Q23(R)" },
              ].map(d => (
                <div key={d.dim} className="flex justify-between py-1 border-b border-border/30">
                  <span className="font-medium">{d.dim}</span>
                  <span className="text-muted-foreground font-mono text-xs">{d.questions}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground uppercase text-xs tracking-wider">Travel & Inner Compass</p>
              {[
                { dim: "Spontaneity (SF)", questions: "Q24, Q25, Q26, Q27(R)" },
                { dim: "Adventure (AO)", questions: "Q28, Q29, Q30(R)" },
                { dim: "Adaptation (EA)", questions: "Q31, Q32, Q33(R)" },
                { dim: "Transformation", questions: "Q35, Q36" },
                { dim: "Clarity", questions: "Q37, Q38" },
                { dim: "Aliveness", questions: "Q39, Q40" },
                { dim: "Connection", questions: "Q41, Q42" },
              ].map(d => (
                <div key={d.dim} className="flex justify-between py-1 border-b border-border/30">
                  <span className="font-medium">{d.dim}</span>
                  <span className="text-muted-foreground font-mono text-xs">{d.questions}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
