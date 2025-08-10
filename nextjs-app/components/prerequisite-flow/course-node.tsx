import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";

export interface CourseNodeData extends Record<string, unknown> {
  code: string;
  name: string;
  credits: number;
  status: "completed" | "in-progress" | "not-started" | "locked";
  semester?: string;
  selected?: boolean;
}

type CourseNodeType = Node<CourseNodeData, "courseNode">;

function CourseNode({ data, id }: NodeProps<CourseNodeType>) {
  const statusColors = {
    completed: "border-green-500 bg-green-50 dark:bg-green-950/30",
    "in-progress": "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
    "not-started": "border-border bg-card",
    locked: "border-red-500 bg-red-50 dark:bg-red-950/30 opacity-60",
  };

  return (
    <>
      {/* Prerequisite input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!size-2 !rounded-full !bg-muted-foreground !border-2 !border-background"
      />
      
      <div
        className={cn(
          "rounded-lg border-2 shadow-sm px-4 py-3 min-w-[140px] cursor-pointer transition-all hover:shadow-md",
          statusColors[data.status],
          data.selected && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <div className="text-center">
          <div className="font-semibold text-sm">{data.code}</div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {data.name}
          </div>
          <div className="text-xs mt-2 font-medium">
            {data.credits} credits
          </div>
          {data.semester && (
            <div className="text-xs text-muted-foreground mt-1">
              {data.semester}
            </div>
          )}
        </div>
      </div>

      {/* Dependent courses output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-2 !rounded-full !bg-muted-foreground !border-2 !border-background"
      />
    </>
  );
}

export default memo(CourseNode);