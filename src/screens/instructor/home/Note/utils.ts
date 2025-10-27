export const parseNoteContent = (noteContent: string) => {
  try {
    const parsed = JSON.parse(noteContent);
    if (parsed.text && parsed.evaluation) {
      return {
        text: parsed.text,
        evaluation: parsed.evaluation,
        evaluationCriteria: parsed.evaluationCriteria || [],
        isEvaluated: true,
      };
    }
  } catch {
    // If not parsable, use directly
  }
  return {
    text: noteContent,
    evaluation: null,
    evaluationCriteria: [],
    isEvaluated: false,
  };
};

export const isBooleanTrue = (value: any): boolean => {
  return value === 1 || value === "1" || value === true || value === "true";
};

export const getSlotLabel = (slot: any) => {
  if (!slot) return "";
  if (typeof slot === "string") return slot;
  const pad = (n: number) => String(n ?? 0).padStart(2, "0");
  const start = `${pad(slot.start_time)}:${pad(slot.start_minute)}`;
  const end = `${pad(slot.end_time)}:${pad(slot.end_minute)}`;
  return slot.title ? `${slot.title} (${start} - ${end})` : `${start} - ${end}`;
};

export const formatDate = (dateString: string) => {
  try {
    if (!dateString) return "Chưa xác định";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Chưa xác định";

    const isUTC = /Z$/i.test(dateString);
    const pad = (n: number) => String(n).padStart(2, "0");

    const dd = pad(isUTC ? date.getUTCDate() : date.getDate());
    const mm = pad((isUTC ? date.getUTCMonth() : date.getMonth()) + 1);
    const yyyy = (
      isUTC ? date.getUTCFullYear() : date.getFullYear()
    ).toString();
    const hh = pad(isUTC ? date.getUTCHours() : date.getHours());
    const min = pad(isUTC ? date.getUTCMinutes() : date.getMinutes());

    return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Chưa xác định";
  }
};
