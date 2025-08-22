"use client";

import { useCallback, useRef, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useNodesState,
  useReactFlow,
  BackgroundVariant,
  Controls,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import CourseNode from "./course-node";
import PrerequisiteEdge from "./prerequisite-edge";
import useFlowchartStore from "@/stores/useFlowchartStore";
import { toast } from "sonner";

// Register custom node types and edge types
const nodeTypes = {
  courseNode: CourseNode,
};

const edgeTypes = {
  prerequisite: PrerequisiteEdge,
};

function PrerequisiteVisualizerInner() {
  // Get nodes and edges from store
  const storeNodes = useFlowchartStore((state) => state.nodes);
  const storeEdges = useFlowchartStore((state) => state.edges);
  const updateNodes = useFlowchartStore((state) => state.updateNodes);
  const updateEdges = useFlowchartStore((state) => state.updateEdges);
  
  // State for prerequisites
  const [prerequisitesMap, setPrerequisitesMap] = useState<Record<string, any>>({});
  const [loadingPrereqs, setLoadingPrereqs] = useState(false);
  const [showPrerequisiteLines, setShowPrerequisiteLines] = useState(true);
  
  // Fetch prerequisites whenever nodes change
  useEffect(() => {
    if (storeNodes.length > 0) {
      fetchPrerequisites();
    }
  }, [storeNodes.length]);
  
  const fetchPrerequisites = async () => {
    if (loadingPrereqs) return;
    
    setLoadingPrereqs(true);
    try {
      // Get all course codes from nodes
      const courseCodes = storeNodes.map(node => node.data.code);
      
      const response = await fetch("/api/prerequisites/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_codes: courseCodes }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrerequisitesMap(data);
      }
    } catch (error) {
      console.error("Error fetching prerequisites:", error);
    } finally {
      setLoadingPrereqs(false);
    }
  };
  
  // Generate edges based on prerequisites
  const generatedEdges = useMemo(() => {
    const edges: any[] = [];
    
    // For each node, check its prerequisites
    storeNodes.forEach(node => {
      const courseCode = node.data.code;
      const prereqs = prerequisitesMap[courseCode] || [];
      
      // Process each prerequisite group
      prereqs.forEach((prereqGroup: any) => {
        // For each course in the prerequisite group
        prereqGroup.courses?.forEach((prereqCourse: any) => {
          const prereqCode = `${prereqCourse.subject} ${prereqCourse.number}`;
          const prereqNodeId = prereqCode.replace(' ', '').toLowerCase();
          
          // Check if prerequisite node exists in flowchart
          const sourceNode = storeNodes.find(n => 
            n.id === prereqNodeId || n.data.code === prereqCode
          );
          
          if (sourceNode) {
            // Check if prerequisite is satisfied (completed)
            const isSatisfied = sourceNode.data.status === "completed";
            
            edges.push({
              id: `e-${sourceNode.id}-${node.id}`,
              source: sourceNode.id,
              target: node.id,
              type: "prerequisite",
              data: { 
                satisfied: isSatisfied,
                type: prereqGroup.type || "required",
              },
              markerEnd: {
                type: prereqGroup.type === "concurrent" ? "arrowclosed" : "arrowclosed",
                width: 12,
                height: 12,
                color: prereqGroup.type === "concurrent" 
                  ? "#f59e0b" 
                  : isSatisfied ? "#10b981" : "#ef4444",
              },
              markerStart: prereqGroup.type === "concurrent" ? {
                type: "arrowclosed",
                width: 12,
                height: 12,
                color: "#f59e0b",
              } : undefined,
            });
          }
        });
      });
    });
    
    return edges;
  }, [storeNodes, prerequisitesMap]);
  
  // Combine store edges with generated edges (prefer generated for automatic updates)
  const combinedEdges = useMemo(() => {
    if (!showPrerequisiteLines) {
      return [];
    }
    
    const edgeMap = new Map();
    
    // Add store edges first (user customizations)
    storeEdges.forEach(edge => {
      edgeMap.set(edge.id, edge);
    });
    
    // Override with generated edges (automatic prerequisite detection)
    generatedEdges.forEach(edge => {
      edgeMap.set(edge.id, edge);
    });
    
    return Array.from(edgeMap.values());
  }, [storeEdges, generatedEdges, showPrerequisiteLines]);
  
  // Use store data as initial state
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  
  // Sync with store nodes
  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);
  
  // Update store when nodes change (from dragging)
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
  }, [onNodesChange]);
  
  // Only update store on drag end, not during drag
  const handleNodeDragStop = useCallback((event: any, node: any) => {
    // Update the store with the new position
    const updatedNodes = nodes.map((n) => 
      n.id === node.id ? { ...n, position: node.position } : n
    );
    updateNodes(updatedNodes);
  }, [nodes, updateNodes]);
  
  // Auto-fit view when nodes change significantly
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.1 });
      }, 100);
    }
  }, [nodes.length, fitView]);

  // Handle manual edge connections
  const handleConnect = useCallback((params: any) => {
    const newEdge = {
      ...params,
      id: `manual-${params.source}-${params.target}`,
      type: "prerequisite",
      data: { 
        satisfied: false,
        type: "required",
        isManual: true,
      },
      markerEnd: {
        type: "arrowclosed",
        width: 20,
        height: 20,
        color: "#6b7280",
      },
    };
    updateEdges([...storeEdges, newEdge]);
  }, [storeEdges, updateEdges]);

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-semibold text-muted-foreground">No courses added to flowchart</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Add Course" to get started
            </p>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={combinedEdges}
        onNodesChange={handleNodesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={"loose" as any}
        fitView
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "prerequisite",
        }}
        proOptions={{ hideAttribution: true }}
        elevateEdgesOnSelect={true}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          color="#888" 
          size={1}
        />
      </ReactFlow>
      
      {/* Prerequisite Lines Toggle */}
      <button
        onClick={() => setShowPrerequisiteLines(!showPrerequisiteLines)}
        className="absolute top-4 right-4 z-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        title={showPrerequisiteLines ? "Hide prerequisite lines" : "Show prerequisite lines"}
      >
        {showPrerequisiteLines ? "Hide Lines" : "Show Lines"}
      </button>
    </div>
  );
}

export default function PrerequisiteVisualizer() {
  return (
    <ReactFlowProvider>
      <PrerequisiteVisualizerInner />
    </ReactFlowProvider>
  );
}