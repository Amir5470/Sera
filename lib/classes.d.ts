export type ClassData = {
  name: string;
  teacher: string;
  period: string;
  type?: "class" | "club";
  emoji?: string;
  startTime?: string;
  endTime?: string;
};

export function joinOrCreateClass(
  userId: string,
  schoolId: string,
  classData: ClassData,
): Promise<string>;

export function leaveClass(
  userId: string,
  schoolId: string,
  classId: string,
  isClub?: boolean,
): Promise<void>;
