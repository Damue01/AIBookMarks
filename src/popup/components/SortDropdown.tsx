import React from 'react';
import { useTranslation } from 'react-i18next';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ArrowDownAZ, ArrowUpZA, CalendarArrowDown, CalendarArrowUp, Globe, Check, ArrowUpDown } from 'lucide-react';
import type { SortField } from '@/shared/types';

interface SortDropdownProps {
  value: SortField;
  onChange: (val: SortField) => void;
  onApplyPermanent: () => void;
}

export default function SortDropdown({ value, onChange, onApplyPermanent }: SortDropdownProps) {
  const { t } = useTranslation();

  const options: { value: SortField; label: string; icon: React.ReactNode }[] = [
    { value: 'default', label: t('browse.sortDefault'), icon: <ArrowUpDown className="w-4 h-4" /> },
    { value: 'name-asc', label: t('browse.sortNameAsc'), icon: <ArrowDownAZ className="w-4 h-4" /> },
    { value: 'name-desc', label: t('browse.sortNameDesc'), icon: <ArrowUpZA className="w-4 h-4" /> },
    { value: 'date-newest', label: t('browse.sortDateNewest'), icon: <CalendarArrowDown className="w-4 h-4" /> },
    { value: 'date-oldest', label: t('browse.sortDateOldest'), icon: <CalendarArrowUp className="w-4 h-4" /> },
    { value: 'domain', label: t('browse.sortDomain'), icon: <Globe className="w-4 h-4" /> },
  ];

  const currentOption = options.find((o) => o.value === value) || options[0];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border/50 bg-muted/30 hover:bg-accent text-xs font-medium text-muted-foreground transition-colors"
          title={t('browse.sort')}
        >
          {currentOption.icon}
          <span className="hidden sm:inline">{currentOption.label}</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[180px] bg-popover text-popover-foreground shadow-lg rounded-lg border border-border/60 py-1 text-sm animate-in fade-in-0 zoom-in-95"
          sideOffset={4}
          align="end"
        >
          {options.map((opt) => (
            <DropdownMenu.Item
              key={opt.value}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer outline-none rounded-sm mx-1"
              onSelect={() => onChange(opt.value)}
            >
              <div className="w-4 flex justify-center">
                {value === opt.value && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
              {opt.icon}
              <span className={value === opt.value ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                {opt.label}
              </span>
            </DropdownMenu.Item>
          ))}

          {value !== 'default' && (
            <>
              <DropdownMenu.Separator className="h-px bg-border my-1" />
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-primary/10 text-primary cursor-pointer outline-none rounded-sm mx-1 font-medium"
                onSelect={onApplyPermanent}
              >
                <Check className="w-4 h-4" />
                {t('browse.applySort')}
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
