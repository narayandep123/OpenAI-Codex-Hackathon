"use client";

import { useId, useState } from "react";
import { Check, ChevronDown, Stethoscope } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SurgeryComboboxProps {
  surgeries: string[];
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
}

export default function SurgeryCombobox({ surgeries, value, onValueChange, name, placeholder = "Select surgery" }: SurgeryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const [query, setQuery] = useState("");
  const listboxId = useId();
  const selectedValue = value ?? internalValue;

  const selectSurgery = (surgery: string) => {
    if (value === undefined) {
      setInternalValue(surgery);
    }

    onValueChange?.(surgery);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-label="Select surgery"
          className="relative flex h-10 w-full items-center rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-left text-sm text-slate-800 transition hover:border-slate-400"
        >
          <Stethoscope className="pointer-events-none absolute ml-[-1.75rem] h-4 w-4 text-[#05aba5]" aria-hidden="true" />
          <span className={cn("truncate", !selectedValue && "text-slate-500")}>{selectedValue || placeholder}</span>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(var(--radix-popover-trigger-width),calc(100vw-2rem))] p-0">
        <Command filter={(itemValue, search) => (itemValue.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ? 1 : 0)}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search surgeries..." />
          <CommandList id={listboxId} aria-label="Surgery options">
            <CommandEmpty>No surgery found matching &apos;{query}&apos;</CommandEmpty>
            <CommandGroup>
              {surgeries.map((surgery) => (
                <CommandItem key={surgery} value={surgery} onSelect={() => selectSurgery(surgery)}>
                  <Check className={cn("mr-2 h-4 w-4 text-teal-600", selectedValue === surgery ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  {surgery}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
