import {
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  Position,
} from "@xyflow/react";

export default function PrerequisiteEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition || Position.Bottom,
    targetX,
    targetY,
    targetPosition: targetPosition || Position.Top,
    borderRadius: 8,
  });

  // Different styles based on prerequisite status
  const edgeStyle = {
    ...style,
    stroke: data?.satisfied ? "#10b981" : "#ef4444", // Green if satisfied, red if not
    strokeWidth: 2,
    strokeDasharray: data?.corequisite ? "5,5" : undefined, // Dashed for corequisites
  };

  return <BaseEdge path={edgePath} style={edgeStyle} markerEnd={markerEnd} />;
}