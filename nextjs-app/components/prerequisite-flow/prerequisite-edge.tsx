import {
  BaseEdge,
  EdgeProps,
  EdgeLabelRenderer,
  useNodes,
} from "@xyflow/react";
import { getSmartEdge } from "@tisoap/react-flow-smart-edge";

export default function PrerequisiteEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  markerStart,
  data,
  source,
  target,
}: EdgeProps) {
  const nodes = useNodes();
  
  // Use smart edge routing that avoids all nodes
  const getSmartEdgeResponse = getSmartEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    nodes,
  });

  // Fallback to direct path if smart edge fails
  const edgePath = getSmartEdgeResponse?.svgPathString || `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
  
  // Calculate label position (middle of the edge)
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  // Determine edge color and style based on type and status
  const isCorequisite = data?.type === "concurrent";
  const isSatisfied = data?.satisfied;
  
  const edgeStyle = {
    ...style,
    stroke: isCorequisite 
      ? "#f59e0b" // Amber for corequisites
      : isSatisfied 
        ? "#10b981" // Green if prerequisite satisfied
        : "#ef4444", // Red if prerequisite not satisfied
    strokeWidth: 2,
    strokeDasharray: isCorequisite ? "5,5" : undefined, // Dotted ONLY for corequisites
  };

  return (
    <BaseEdge 
      path={edgePath} 
      style={edgeStyle} 
      markerEnd={markerEnd}
      markerStart={isCorequisite ? markerStart : undefined} // Bidirectional for corequisites
    />
  );
}