import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import { CourseNodeData } from '@/components/prerequisite-flow/course-node';

interface FlowchartStore {
  // State
  nodes: Node<CourseNodeData>[];
  edges: Edge[];
  
  // Actions
  addNode: (node: Node<CourseNodeData>) => void;
  removeNode: (nodeId: string) => void;
  updateNodes: (nodes: Node<CourseNodeData>[]) => void;
  updateEdges: (edges: Edge[]) => void;
  clearFlowchart: () => void;
  
  // Export function for scheduler
  exportNodes: () => Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
  }>;
}

const useFlowchartStore = create<FlowchartStore>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  
  // Add a single node
  addNode: (node) => {
    set((state) => {
      // Check if node already exists
      if (state.nodes.some(n => n.id === node.id)) {
        return state;
      }
      return { nodes: [...state.nodes, node] };
    });
  },
  
  // Remove a node and its connected edges
  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter(node => node.id !== nodeId),
      edges: state.edges.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId
      )
    }));
  },
  
  // Update all nodes (for drag and drop)
  updateNodes: (nodes) => {
    set({ nodes });
  },
  
  // Update all edges
  updateEdges: (edges) => {
    set({ edges });
  },
  
  // Clear everything
  clearFlowchart: () => {
    set({ nodes: [], edges: [] });
  },
  
  // Export nodes for scheduler
  exportNodes: () => {
    const { nodes } = get();
    return nodes.map(node => ({
      id: node.id,
      code: node.data.code,
      name: node.data.name || node.data.code,
      credits: node.data.credits || 3,
    }));
  },
}));

export default useFlowchartStore;