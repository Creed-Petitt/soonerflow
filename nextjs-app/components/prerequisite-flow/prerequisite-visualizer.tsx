"use client";

import { useCallback, useRef, useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import CourseNode from "./course-node";
import PrerequisiteEdge from "./prerequisite-edge";
import useCourseStore from "@/stores/useCourseStore";
import { generatePrerequisiteEdges, commonPrerequisites } from "@/lib/prerequisite-parser";

// Register custom node types and edge types
const nodeTypes = {
  courseNode: CourseNode,
};

const edgeTypes = {
  prerequisite: PrerequisiteEdge,
};

function PrerequisiteVisualizerInner() {
  // Get nodes and edges from store
  const flowChartNodes = useCourseStore((state) => state.flowChartNodes);
  const flowChartEdges = useCourseStore((state) => state.flowChartEdges);
  const updateFlowChartNodes = useCourseStore((state) => state.updateFlowChartNodes);
  const updateFlowChartEdges = useCourseStore((state) => state.updateFlowChartEdges);
  const completedCourses = useCourseStore((state) => state.completedCourses);
  
  // Generate edges based on prerequisites
  const generatedEdges = useMemo(() => {
    const edges: any[] = [];
    
    // For each node, check if any other nodes are prerequisites
    flowChartNodes.forEach(node => {
      const courseCode = node.data.code;
      const courseKey = courseCode.replace(' ', '');
      
      // Check common prerequisites map
      const prereqs = commonPrerequisites[courseCode] || [];
      
      prereqs.forEach(prereqCode => {
        const prereqKey = prereqCode.replace(' ', '').toLowerCase();
        const sourceNode = flowChartNodes.find(n => 
          n.data.code === prereqCode || n.id === prereqKey
        );
        
        if (sourceNode) {
          // Check if prerequisite is completed
          const isCompleted = Array.from(completedCourses.values()).some(
            course => course.code === prereqCode
          );
          
          edges.push({
            id: `e-${prereqKey}-${node.id}`,
            source: sourceNode.id,
            target: node.id,
            type: 'prerequisite',
            data: { 
              satisfied: isCompleted
            }
          });
        }
      });
    });
    
    return edges;
  }, [flowChartNodes, completedCourses]);
  
  // Combine store edges with generated edges (prefer store edges)
  const combinedEdges = useMemo(() => {
    const edgeMap = new Map();
    
    // Add generated edges first
    generatedEdges.forEach(edge => {
      edgeMap.set(edge.id, edge);
    });
    
    // Override with store edges (user customizations)
    flowChartEdges.forEach(edge => {
      edgeMap.set(edge.id, edge);
    });
    
    return Array.from(edgeMap.values());
  }, [flowChartEdges, generatedEdges]);
  
  // Use store data as initial state
  const [nodes, setNodes, onNodesChange] = useNodesState(flowChartNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(combinedEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  
  // Sync with store when nodes/edges change in store
  useEffect(() => {
    setNodes(flowChartNodes);
  }, [flowChartNodes, setNodes]);
  
  useEffect(() => {
    setEdges(combinedEdges);
  }, [combinedEdges, setEdges]);
  
  // Update store when nodes change (from dragging)
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    // Get the updated nodes after change
    setTimeout(() => {
      const currentNodes = nodes;
      updateFlowChartNodes(currentNodes);
    }, 0);
  }, [nodes, onNodesChange, updateFlowChartNodes]);

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-semibold text-muted-foreground">No courses added to flowchart</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Add" on any course in the requirements table and select "Prerequisite Flowchart"
            </p>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: "prerequisite",
          className: "opacity-50",
        }}
        style={
          {
            "--xy-background-pattern-dots-color-default":
              "var(--color-border)",
            "--xy-edge-stroke-width-default": 2,
            "--xy-edge-stroke-default": "var(--color-muted-foreground)",
            "--xy-edge-stroke-selected-default": "var(--color-primary)",
            "--xy-attribution-background-color-default": "transparent",
          } as React.CSSProperties
        }
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} />
      </ReactFlow>
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