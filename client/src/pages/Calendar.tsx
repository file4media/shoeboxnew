import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Calendar() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: scheduledEditions, isLoading } = trpc.editions.getScheduledEditions.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Group editions by date
  const editionsByDate = new Map<string, typeof scheduledEditions>();
  scheduledEditions?.forEach(edition => {
    if (edition.scheduledFor) {
      const date = new Date(edition.scheduledFor);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!editionsByDate.has(dateKey)) {
        editionsByDate.set(dateKey, []);
      }
      editionsByDate.get(dateKey)?.push(edition);
    }
  });

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="min-h-24 p-2 bg-gray-50"></div>);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${month}-${day}`;
    const dayEditions = editionsByDate.get(dateKey) || [];
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

    calendarDays.push(
      <div
        key={day}
        className={`min-h-24 p-2 border border-gray-200 ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
      >
        <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayEditions.map(edition => (
            <button
              key={edition.id}
              onClick={() => setLocation(`/newsletters/${edition.newsletterId}/editions/${edition.id}`)}
              className="w-full text-left text-xs p-1 rounded truncate hover:opacity-80 transition-opacity"
              style={{ backgroundColor: edition.newsletterColor, color: 'white' }}
              title={`${edition.newsletterName}: ${edition.subject}`}
            >
              <div className="font-medium truncate">{edition.subject}</div>
              <div className="text-[10px] opacity-90 truncate">{edition.newsletterName}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Content Calendar</h1>
              <p className="text-muted-foreground">View all scheduled newsletter editions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold min-w-40 text-center">
              {monthNames[month]} {year}
            </div>
            <Button variant="outline" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {scheduledEditions && scheduledEditions.length === 0 && (
        <Card className="p-12 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No scheduled editions</h3>
          <p className="text-muted-foreground">
            Schedule your newsletter editions to see them on the calendar
          </p>
        </Card>
      )}

      {scheduledEditions && scheduledEditions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Calendar header */}
          <div className="grid grid-cols-7 border-b">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} className="p-3 text-center font-semibold text-sm text-gray-700 border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays}
          </div>
        </div>
      )}
    </div>
  );
}
