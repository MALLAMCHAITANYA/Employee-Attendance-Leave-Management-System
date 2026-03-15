import React, { useEffect, useState } from 'react';

const getGreeting = date => {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const Clock = ({ onGreetingChange }) => {
  const [now, setNow] = useState(new Date());
  const greeting = getGreeting(now);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (onGreetingChange) {
      onGreetingChange(greeting);
    }
  }, [greeting, onGreetingChange]);

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{greeting}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          “A man who dares to waste one hour of time has not discovered the value
          of life.” – Charles Darwin
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-mono text-primary-600 dark:text-primary-400">
          {now.toLocaleTimeString()}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {now.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
};

export default Clock;

