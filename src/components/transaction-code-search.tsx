'use client';

import * as React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Search } from 'lucide-react';
import { Button } from './ui/button';
import { useDebounce } from 'use-debounce';
import { getTransactionCodeSuggestion } from '@/ai/flows/transaction-code-assistance';
import { useToast } from '@/hooks/use-toast';


type Suggestion = {
    code: string;
    reason: string;
}

export function TransactionCodeSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [debouncedQuery] = useDebounce(query, 500);
  const [loading, setLoading] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState<Suggestion | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (debouncedQuery.length > 3) {
      const fetchSuggestion = async () => {
        setLoading(true);
        try {
          const result = await getTransactionCodeSuggestion({ taskDescription: debouncedQuery });
          setSuggestion({
            code: result.suggestedCode,
            reason: result.reason,
          });
        } catch (error) {
          console.error("Failed to get suggestion:", error);
          setSuggestion(null);
        } finally {
          setLoading(false);
        }
      };
      fetchSuggestion();
    } else {
      setSuggestion(null);
    }
  }, [debouncedQuery]);

  const handleSelect = (code: string) => {
    setOpen(false);
    toast({
        title: "Transaction Code Selected",
        description: `You have selected ${code}. Action would be triggered here.`,
    })
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="hidden lg:inline-flex">Search actions...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
            placeholder="Describe what you want to do..." 
            value={query}
            onValueChange={setQuery}
        />
        <CommandList>
          {loading && <CommandEmpty>Thinking...</CommandEmpty>}
          {!loading && !suggestion && <CommandEmpty>No results found.</CommandEmpty>}
          {suggestion && !loading && (
            <CommandGroup heading="AI Suggestion">
              <CommandItem onSelect={() => handleSelect(suggestion.code)}>
                <span className="font-bold mr-2">{suggestion.code}</span>
                <span>{suggestion.reason}</span>
              </CommandItem>
            </CommandGroup>
          )}
          <CommandSeparator />
            <CommandGroup heading="Common Actions">
                <CommandItem onSelect={() => handleSelect("SO-01")}>Create Sales Order</CommandItem>
                <CommandItem onSelect={() => handleSelect("INV-05")}>Check Inventory</CommandItem>
                <CommandItem onSelect={() => handleSelect("CUST-10")}>View Customer Details</CommandItem>
            </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
