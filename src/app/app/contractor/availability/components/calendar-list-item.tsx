"use client";

import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface CalendarListItemProps {
  externalId: string;
  name: string;
  primary: boolean;
  readOnly: boolean;
  isSelected: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Calendar List Item Component
 * Displays a single calendar with toggle switch for conflict checking selection
 * Based on Cal.com's CalendarSwitch pattern
 */
export function CalendarListItem({
  externalId,
  name,
  primary,
  readOnly,
  isSelected,
  onToggle,
  disabled = false,
}: CalendarListItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      {/* Left: Toggle Switch */}
      <div className="flex items-center gap-3 flex-1">
        <Switch
          id={externalId}
          checked={isSelected}
          onCheckedChange={onToggle}
          disabled={disabled || readOnly}
        />
        
        {/* Center: Calendar Name and Badges */}
        <label
          htmlFor={externalId}
          className="flex items-center gap-2 cursor-pointer flex-1"
        >
          <span className="text-sm font-medium text-zinc-900">
            {name}
          </span>
          
          {/* Primary badge */}
          {primary && (
            <Badge variant="secondary" className="text-xs">
              Primary
            </Badge>
          )}
          
          {/* Read-only badge */}
          {readOnly && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Read-only
            </Badge>
          )}
        </label>
      </div>
    </div>
  );
}

