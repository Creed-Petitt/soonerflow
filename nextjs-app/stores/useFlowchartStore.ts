import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import { CourseNodeData } from '@/components/prerequisite-flow/course-node';

interface FlowchartStore {
  // State
  nodes: Node<CourseNodeData>[];
  edges: Edge[];
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  
  // Actions
  addNode: (node: Node<CourseNodeData>) => void;
  removeNode: (nodeId: string) => void;
  updateNodes: (nodes: Node<CourseNodeData>[]) => void;
  updateEdges: (edges: Edge[]) => void;
  clearFlowchart: () => void;
  
  // Persistence
  saveToDatabase: (githubId: string) => Promise<void>;
  loadFromDatabase: (githubId: string) => Promise<void>;
  
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
  isLoading: false,
  isSaving: false,
  lastSavedAt: null,
  
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
  
  // Save flowchart to database
  saveToDatabase: async (githubId: string) => {
    const { nodes, edges } = get();
    set({ isSaving: true });
    
    try {
      const response = await fetch(`/api/flowchart/${githubId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes, edges }),
      });
      
      if (response.ok) {
        const data = await response.json();
        set({ 
          isSaving: false, 
          lastSavedAt: data.updated_at ? new Date(data.updated_at) : new Date() 
        });
      } else {
        throw new Error('Failed to save flowchart');
      }
    } catch (error) {
      console.error('Error saving flowchart:', error);
      set({ isSaving: false });
    }
  },
  
  // Load flowchart from database
  loadFromDatabase: async (githubId: string) => {
    set({ isLoading: true });
    
    try {
      const response = await fetch(`/api/flowchart/${githubId}/load`);
      
      if (response.ok) {
        const data = await response.json();
        set({ 
          nodes: data.nodes || [], 
          edges: data.edges || [],
          isLoading: false,
          lastSavedAt: data.updated_at ? new Date(data.updated_at) : null
        });
      } else {
        throw new Error('Failed to load flowchart');
      }
    } catch (error) {
      console.error('Error loading flowchart:', error);
      set({ isLoading: false });
    }
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