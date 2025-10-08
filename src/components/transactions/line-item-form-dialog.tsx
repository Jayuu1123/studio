'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import type { FormField } from "@/lib/types";
import { useState, useEffect } from "react";

interface LineItemFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (itemData: any) => void;
  fields: FormField[];
  initialData?: any;
  isEditing: boolean;
}

function DynamicLineItemField({ field, value, onChange, disabled }: { field: FormField, value: any, onChange: (fieldKey: string, value: any) => void, disabled: boolean }) {
    const fieldId = `line-item-${field.key}`;
    switch (field.type) {
        case 'text':
            return (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={fieldId} className="text-right">{field.label}</Label>
                    <Input id={fieldId} value={value || ''} onChange={(e) => onChange(field.key, e.target.value)} disabled={disabled} placeholder={field.placeholder} className="col-span-3"/>
                </div>
            );
        case 'number':
            return (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={fieldId} className="text-right">{field.label}</Label>
                    <Input id={fieldId} type="number" value={value || ''} onChange={(e) => onChange(field.key, e.target.valueAsNumber)} disabled={disabled} placeholder={field.placeholder} className="col-span-3"/>
                </div>
            );
        case 'date':
             return (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={fieldId} className="text-right">{field.label}</Label>
                    <div className="col-span-3">
                      <DatePicker date={value ? new Date(value) : undefined} setDate={(d) => onChange(field.key, d)} disabled={disabled} />
                    </div>
                </div>
            );
        case 'boolean':
             return (
                <div className="col-span-4 flex items-center justify-center gap-2 pt-2">
                    <Checkbox id={fieldId} checked={value || false} onCheckedChange={(c) => onChange(field.key, c)} disabled={disabled} />
                    <Label htmlFor={fieldId}>{field.label}</Label>
                </div>
            );
        case 'select':
            return (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={fieldId} className="text-right">{field.label}</Label>
                    <Select value={value} onValueChange={(v) => onChange(field.key, v)} disabled={disabled}>
                        <SelectTrigger id={fieldId} className="col-span-3">
                            <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="option-1">Option 1</SelectItem>
                           <SelectItem value="option-2">Option 2</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            );
        default:
            return null;
    }
}


export function LineItemFormDialog({ isOpen, setIsOpen, onSave, fields, initialData, isEditing }: LineItemFormDialogProps) {
  const [itemData, setItemData] = useState(initialData || {});

  useEffect(() => {
    setItemData(initialData || {});
  }, [initialData, isOpen]);

  const handleFieldChange = (key: string, value: any) => {
    setItemData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(itemData);
  };
  
  const dialogTitle = initialData ? "Edit Item" : "Add New Item";
  const dialogDescription = initialData ? "Update the details for this item." : "Fill in the details for the new item.";


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {fields.map(field => (
            <DynamicLineItemField
              key={field.id}
              field={field}
              value={itemData[field.key]}
              onChange={handleFieldChange}
              disabled={!isEditing}
            />
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave} disabled={!isEditing}>
            {initialData ? "Save Changes" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
