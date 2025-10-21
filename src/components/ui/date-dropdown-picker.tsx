
"use client";

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getYear } from 'date-fns';

type DateDropdownPickerProps = {
  value: Date | null;
  onChange: (date: Date) => void;
  className?: string;
};

const months = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

export function DateDropdownPicker({ value, onChange, className }: DateDropdownPickerProps) {
  const selectedDate = value || new Date();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDayChange = (day: string) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(parseInt(day, 10));
    onChange(newDate);
  };

  const handleMonthChange = (month: string) => {
    const newDate = new Date(selectedDate);
    // Adjust day if it's out of bounds for the new month
    const newMonth = parseInt(month, 10);
    const currentDay = newDate.getDate();
    const daysInNewMonth = new Date(newDate.getFullYear(), newMonth + 1, 0).getDate();
    if (currentDay > daysInNewMonth) {
        newDate.setDate(daysInNewMonth);
    }
    newDate.setMonth(newMonth);
    onChange(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(year, 10));
    onChange(newDate);
  };

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      <Select
        value={selectedDate.getDate().toString()}
        onValueChange={handleDayChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {days.map((day) => (
            <SelectItem key={day} value={day.toString()}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedDate.getMonth().toString()}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value.toString()}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedDate.getFullYear().toString()}
        onValueChange={handleYearChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
