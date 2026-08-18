"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash, Reply } from "lucide-react";

interface MessageHoverToolbarProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
  canEdit?: boolean;
}

export function MessageHoverToolbar({
  onEdit,
  onDelete,
  onReply,
  canEdit = false,
}: MessageHoverToolbarProps) {
  // Always show if onReply is available (for all messages)
  // Edit/Delete only for own messages
  if (!onReply && (!canEdit || !onEdit || !onDelete)) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 shadow-lg rounded-lg px-1.5 py-1 border border-zinc-200 dark:border-zinc-700">
        {/* Reply button - available for all messages */}
        {onReply && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onReply}
                className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-all duration-200"
                aria-label="Reply to message"
              >
                <Reply className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Reply</TooltipContent>
          </Tooltip>
        )}

        {/* Edit button - only for own messages */}
        {canEdit && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onEdit}
                className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-all duration-200"
                aria-label="Edit message"
              >
                <Edit className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Edit</TooltipContent>
          </Tooltip>
        )}

        {/* Delete button - only for own messages */}
        {canEdit && onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onDelete}
                className="p-2 text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all duration-200"
                aria-label="Delete message"
              >
                <Trash className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Delete</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}


