"use client";

import { useMemo } from "react";
import type { ITimezoneOption, Props as SelectProps } from "react-timezone-select";
import BaseSelect from "react-timezone-select";

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  classNames?: SelectProps["classNames"];
  menuPosition?: "absolute" | "fixed";
}

// Cal.com's common timezones for search
const COMMON_TIMEZONES = [
  { label: "Pacific Time - US & Canada", timezone: "America/Los_Angeles" },
  { label: "Eastern Time - US & Canada", timezone: "America/New_York" },
  { label: "Central Time - US & Canada", timezone: "America/Chicago" },
  { label: "Mountain Time - US & Canada", timezone: "America/Denver" },
  { label: "Atlantic Time - Canada", timezone: "America/Halifax" },
  { label: "Hawaii-Aleutian Standard Time", timezone: "Pacific/Honolulu" },
  { label: "Western European Time", timezone: "Europe/London" },
  { label: "Central European Time", timezone: "Europe/Berlin" },
  { label: "Eastern European Time", timezone: "Europe/Bucharest" },
  { label: "Japan Standard Time", timezone: "Asia/Tokyo" },
  { label: "India Standard Time", timezone: "Asia/Kolkata" },
  { label: "Gulf Standard Time", timezone: "Asia/Dubai" },
  { label: "Australian Eastern Time", timezone: "Australia/Sydney" },
  { label: "Brazil Time", timezone: "America/Sao_Paulo" },
  { label: "South Africa Standard Time", timezone: "Africa/Johannesburg" },
];

const addTimezonesToDropdown = (timezones: Array<{ label: string; timezone: string }>) => {
  const result: Record<string, string> = {};
  timezones.forEach(({ timezone, label }) => {
    result[timezone] = label;
  });
  return result;
};

export function TimezoneSelect({ value, onChange, classNames: customClassNames, menuPosition = "absolute" }: TimezoneSelectProps) {
  const timezones = useMemo(() => addTimezonesToDropdown(COMMON_TIMEZONES), []);

  return (
    <BaseSelect
      value={value}
      aria-label="Timezone Select"
      data-testid="timezone-select"
      timezones={timezones}
      menuPosition={menuPosition}
      unstyled={true}
      onChange={(selectedOption) => {
        if (!selectedOption) return;
        onChange(selectedOption.value);
      }}
      formatOptionLabel={(option) => (
        <p className="truncate">{(option as ITimezoneOption).value.replace(/_/g, " ")}</p>
      )}
      classNames={{
        ...customClassNames,
        input: (state) => "text-zinc-900 h-6 md:max-w-[145px] max-w-[250px]",
        
        option: (state) => {
          const classes = ["bg-white py-2.5 px-3 rounded-md text-zinc-900"];
          if (state.isFocused) classes.push("bg-zinc-50");
          if (state.isDisabled) classes.push("bg-zinc-100");
          if (state.isSelected) classes.push("bg-zinc-100 text-zinc-900");
          return classes.join(" ");
        },
        
        placeholder: (state) => `text-zinc-500 ${state.isFocused ? "hidden" : ""}`,
        
        dropdownIndicator: () => "text-zinc-900",
        
        control: (state) => {
          const classes = ["h-9 py-0 px-0 border-0 bg-transparent rounded-[10px] min-h-0"];
          if (state.isDisabled) classes.push("bg-zinc-50");
          return classes.join(" ");
        },
        
        singleValue: (state) => "text-zinc-900 placeholder:text-zinc-500",
        
        valueContainer: (state) => "text-zinc-900 placeholder:text-zinc-500 flex gap-1 p-0",
        
        menu: (state) => `rounded-md bg-white text-sm leading-4 text-zinc-900 mt-1 border border-zinc-200 ${
          state.selectProps.menuIsOpen ? "shadow-lg" : ""
        }`,
        
        groupHeading: () => "leading-none text-xs uppercase text-zinc-900 pl-2.5 pt-4 pb-2",
        
        menuList: (state) => "rounded-md overflow-y-auto max-h-[280px] py-1",
        
        indicatorsContainer: (state) => 
          state.selectProps.menuIsOpen
            ? "rotate-180 transition-transform ml-auto"
            : "transition-transform text-zinc-900 ml-auto",
        
        noOptionsMessage: () => "h-12 py-2 flex items-center justify-center text-zinc-500",
      }}
    />
  );
}

