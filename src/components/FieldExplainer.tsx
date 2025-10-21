"use client";

import { HelpCircle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { FieldConfig } from "@/lib/tutorial-flow";

interface FieldExplainerProps {
  field: FieldConfig;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string | null;
}

export function FieldExplainer({
  field,
  value,
  onChange,
  error,
}: FieldExplainerProps) {
  const renderInput = () => {
    switch (field.type) {
      case 'readonly':
        return (
          <div className="relative">
            <Input
              value={value}
              disabled
              className="bg-gray-50 border-gray-200"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'select':
        return (
          <Select value={String(value)} onValueChange={onChange}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={field.name} className="text-sm font-medium">
          {field.label}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="ml-1 text-xs">What's this?</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">{field.label}</h4>
              <p className="text-sm text-gray-600">
                {field.detailedExplanation}
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {renderInput()}

      <p className="text-xs text-gray-500">{field.helpText}</p>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}