import React from 'react';
import { useScheduleReminders } from '@/hooks/useScheduleReminders';

interface PostLoginGateProps {
  children: React.ReactNode;
}

const PostLoginGate: React.FC<PostLoginGateProps> = ({ children }) => {
  // Mount global study-schedule reminders for authenticated users
  useScheduleReminders();
  return <>{children}</>;
};

export default PostLoginGate;
