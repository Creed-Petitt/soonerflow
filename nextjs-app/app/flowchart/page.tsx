"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import CustomNavbar from "@/components/custom-navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PrerequisiteVisualizer from "@/components/prerequisite-flow/prerequisite-visualizer";
import useFlowchartStore from "@/stores/useFlowchartStore";
import { Plus, Trash2, CloudUpload, Check } from "lucide-react";
import QuickAddPanel from "@/components/prerequisite-flow/quick-add-panel";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

export default function FlowchartPage() {
  const { data: session, status } = useSession();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Flowchart store methods
  const nodes = useFlowchartStore((state) => state.nodes);
  const edges = useFlowchartStore((state) => state.edges);
  const clearFlowchart = useFlowchartStore((state) => state.clearFlowchart);
  const loadFromDatabase = useFlowchartStore((state) => state.loadFromDatabase);
  const saveToDatabase = useFlowchartStore((state) => state.saveToDatabase);
  const isSaving = useFlowchartStore((state) => state.isSaving);
  const lastSavedAt = useFlowchartStore((state) => state.lastSavedAt);

  // Create a debounced version of the nodes and edges for auto-save
  const debouncedNodes = useDebounce(nodes, 2000); // 2 second delay
  const debouncedEdges = useDebounce(edges, 2000);

  // Load flowchart on mount when user is authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user?.githubId) {
      loadFromDatabase(session.user.githubId).then(() => {
      });
    }
  }, [status, session?.user?.githubId]);

  // Auto-save when nodes or edges change (debounced)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.githubId && debouncedNodes.length > 0) {
      saveToDatabase(session.user.githubId).then(() => {
      });
    }
  }, [debouncedNodes, debouncedEdges, session?.user?.githubId, status]);

  // Handle manual clear with database update
  const handleClearFlowchart = async () => {
    clearFlowchart();
    if (session?.user?.githubId) {
      try {
        await fetch(`/api/flowchart/${session.user.githubId}/clear`, {
          method: 'DELETE',
        });
        toast.success("Flowchart cleared");
      } catch (error) {
        console.error("Error clearing flowchart:", error);
      }
    }
  };

  // Calculate total credits
  const totalCredits = nodes.reduce(
    (sum, node) => sum + (node.data.credits || 3),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <CustomNavbar />
      
      <main className="px-6 py-4">
        {/* Simplified Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium text-muted-foreground">Visualize your degree progress</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Save status indicator */}
            {session?.user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isSaving ? (
                  <>
                    <CloudUpload className="h-4 w-4 animate-pulse" />
                    <span>Saving...</span>
                  </>
                ) : lastSavedAt ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Saved</span>
                  </>
                ) : null}
              </div>
            )}
            
            {/* Course counter */}
            <div className="text-right text-sm">
              <p className="font-medium">{nodes.length} courses</p>
              <p className="text-muted-foreground">{totalCredits} credits</p>
            </div>
            
            {/* Add Course button */}
            <Button
              onClick={() => setShowQuickAdd(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
            
            {/* Clear All button */}
            <Button
              variant="outline"
              onClick={handleClearFlowchart}
              disabled={nodes.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Main Flowchart */}
        <Card className="h-[calc(100vh-200px)] p-0 overflow-hidden">
          <PrerequisiteVisualizer />
        </Card>

        {/* Quick Add Panel Modal */}
        {showQuickAdd && (
          <QuickAddPanel
            isOpen={showQuickAdd}
            onClose={() => setShowQuickAdd(false)}
          />
        )}
      </main>
    </div>
  );
}