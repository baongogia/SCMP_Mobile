import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { format } from "@/src/utils/format";
import { getClassScheduleDetail } from "@/src/services/learning_process/schedules/scheduleServices";

type Props = {
  visible: boolean;
  onClose: () => void;
  classItem: any | null;
  initialMonth?: Date;
};

export default function ClassDetailModal({
  visible,
  onClose,
  classItem,
  initialMonth,
}: Props) {
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(
    initialMonth || new Date()
  );
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);
  const [internalClass, setInternalClass] = React.useState<any | null>(
    classItem
  );
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (initialMonth) setCalendarMonth(initialMonth);
  }, [initialMonth]);

  // enable LayoutAnimation on Android
  React.useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      // @ts-ignore
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  React.useEffect(() => {
    // pick first scheduled day when classItem changes
    // when classItem changes, clear any previously selected day so user must tap to view sessions
    if (!classItem) return;
    setSelectedDay(null);
  }, [classItem]);

  React.useEffect(() => {
    // sync internal class when prop changes
    setInternalClass(classItem);
  }, [classItem]);

  React.useEffect(() => {
    // debug logging to help trace issues in production/dev
    if (!classItem) return;
    try {
      const countPlan = Array.isArray(classItem.originalData?.schedule_plan)
        ? classItem.originalData.schedule_plan.length
        : 0;
      const countSchedule = Array.isArray(classItem.schedule)
        ? classItem.schedule.length
        : 0;
      console.log("[ClassDetailModal] classItem loaded", {
        id: classItem.id || classItem._id,
        countPlan,
        countSchedule,
        selectedDay,
      });
    } catch {
      console.warn("[ClassDetailModal] debug log failed");
    }
  }, [classItem, selectedDay]);

  const getMonthMatrix = (d: Date) => {
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const matrix: Date[][] = [];
    let week: Date[] = [];
    const leading = firstDay.getDay();
    for (let i = 0; i < leading; i++) {
      week.push(
        new Date(firstDay.getFullYear(), firstDay.getMonth(), i - leading + 1)
      );
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      week.push(new Date(d.getFullYear(), d.getMonth(), day));
      if (week.length === 7) {
        matrix.push(week);
        week = [];
      }
    }
    while (week.length < 7) {
      const nextIndex = week.length + 1;
      week.push(
        new Date(d.getFullYear(), d.getMonth(), lastDay.getDate() + nextIndex)
      );
    }
    matrix.push(week);
    return matrix;
  };

  const pad2 = React.useCallback((n: number) => String(n).padStart(2, "0"), []);

  const isoLocal = React.useCallback(
    (d: Date) =>
      `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    [pad2]
  );

  const todayKey = isoLocal(new Date());

  const timeRangeFrom = React.useCallback(
    (it: any) => {
      // try slot-level minutes
      const slot = it?.slot || it;
      const sMin = slot?.start_minute ?? it?.start_minute ?? null;
      const eMin = slot?.end_minute ?? it?.end_minute ?? null;
      if (typeof sMin === "number" && typeof eMin === "number") {
        const sh = Math.floor(sMin / 60);
        const sm = sMin % 60;
        const eh = Math.floor(eMin / 60);
        const em = eMin % 60;
        return `${pad2(sh)}:${pad2(sm)} - ${pad2(eh)}:${pad2(em)}`;
      }

      // try ISO timestamps
      const sTime = slot?.start_time || it?.start_time || it?.time || null;
      const eTime = slot?.end_time || it?.end_time || null;
      try {
        if (sTime) {
          const sd = new Date(sTime);
          const ed = eTime ? new Date(eTime) : null;
          if (!isNaN(sd.getTime())) {
            const sh = pad2(sd.getHours());
            const sm = pad2(sd.getMinutes());
            if (ed && !isNaN(ed.getTime())) {
              const eh = pad2(ed.getHours());
              const em = pad2(ed.getMinutes());
              return `${sh}:${sm} - ${eh}:${em}`;
            }
            return `${sh}:${sm}`;
          }
        }
      } catch {
        // ignore parse errors
      }

      return "";
    },
    [pad2]
  );

  const getMarkedDates = React.useCallback(
    (cls: any) => {
      const marks: Record<string, any[]> = {};
      if (!cls) return marks;

      const planArr = Array.isArray(cls.originalData?.schedule_plan)
        ? cls.originalData.schedule_plan
        : [];
      const scheduleArr = Array.isArray(cls.schedule) ? cls.schedule : [];
      const altSchedule = Array.isArray(cls.originalData?.schedule)
        ? cls.originalData.schedule
        : [];

      const items = [...planArr, ...scheduleArr, ...altSchedule];

      const seenByDate: Record<string, Set<string>> = {};
      for (const it of items) {
        const raw =
          it?.date ||
          it?.session_date ||
          it?.start_date ||
          it?.start_time ||
          it?.start_minute ||
          null;
        if (!raw) continue;
        const d = new Date(raw);
        if (isNaN(d.getTime())) continue;
        const dateStr = isoLocal(d);
        marks[dateStr] = marks[dateStr] || [];
        seenByDate[dateStr] = seenByDate[dateStr] || new Set();

        const keyParts: string[] = [];
        if (it.id) keyParts.push(String(it.id));
        if (it._id) keyParts.push(String(it._id));
        if (it.slot?.id) keyParts.push(String(it.slot.id));
        if (it.slot?.title) keyParts.push(String(it.slot.title));
        if (it.title) keyParts.push(String(it.title));
        if (it.start_minute) keyParts.push(String(it.start_minute));
        if (it.start_time) keyParts.push(String(it.start_time));
        const itemKey = keyParts.join("::") || JSON.stringify(it);
        if (seenByDate[dateStr].has(itemKey)) continue;
        seenByDate[dateStr].add(itemKey);
        marks[dateStr].push(it);
      }

      // debug: log when modal is visible and this function runs so we can inspect marks
      try {
        console.log(
          "[ClassDetailModal] getMarkedDates -> computed marks keys:",
          Object.keys(marks).slice(0, 10)
        );
      } catch {
        // ignore
      }

      return marks;
    },
    [isoLocal]
  );

  // ensure we use internalClass (may have been fetched/merged)
  // prepare sessions for selected day safely
  const marks = React.useMemo(
    () => (internalClass ? getMarkedDates(internalClass) : {}),
    [internalClass, getMarkedDates]
  );
  const sessionsForDay: any[] = React.useMemo(() => {
    return selectedDay && marks[selectedDay] ? marks[selectedDay] : [];
  }, [selectedDay, marks]);

  // memoize and dedupe sessions so UI doesn't show duplicates
  const uniqueSessions = React.useMemo(() => {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const s of sessionsForDay) {
      const title = s.slot?.title || s.title || "";
      const tr = timeRangeFrom(s) || timeRangeFrom(s.slot) || "";
      const dateKey = s.date || s.session_date || s.start_date || "";
      const key = `${dateKey}::${title}::${tr}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(s);
      }
    }
    return out;
  }, [sessionsForDay, timeRangeFrom]);

  React.useEffect(() => {
    if (!selectedDay) return;
    try {
      console.log(
        "[ClassDetailModal] selectedDay",
        selectedDay,
        "sessionsForDay",
        sessionsForDay.length,
        "uniqueSessions",
        uniqueSessions.length,
        uniqueSessions.map(
          (s) =>
            `${s.date || s.session_date || ""}::${s.slot?.title || ""}::${
              timeRangeFrom(s) || ""
            }`
        )
      );
    } catch {
      // ignore
    }
  }, [selectedDay, sessionsForDay, uniqueSessions, timeRangeFrom]);

  // animate layout changes when sessions or selection change
  React.useEffect(() => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch {
      // ignore if unavailable
    }
  }, [selectedDay, uniqueSessions.length, loading]);

  // If parent didn't include schedule details, fetch them here for more reliability
  // Run fetch when modal becomes visible or when the class id changes
  const internalClassId =
    internalClass?.originalData?.id ||
    internalClass?.originalData?._id ||
    internalClass?.id;
  React.useEffect(() => {
    let cancelled = false;
    const tryFetch = async () => {
      if (!internalClass) return;
      const hasPlan =
        Array.isArray(internalClass?.originalData?.schedule_plan) &&
        internalClass.originalData.schedule_plan.length > 0;
      const hasSchedule =
        Array.isArray(internalClass?.schedule) &&
        internalClass.schedule.length > 0;
      if (hasPlan || hasSchedule) return;

      const classroomId =
        internalClass.originalData?.id ||
        internalClass.originalData?._id ||
        internalClass.id;
      if (!classroomId) return;

      setLoading(true);
      try {
        const res: any = await getClassScheduleDetail(String(classroomId));
        let schedules: any = res?.data;
        if (schedules && schedules.data) schedules = schedules.data;
        if (!Array.isArray(schedules))
          schedules = Array.isArray(schedules?.data) ? schedules.data : [];
        if (cancelled) return;
        const merged = {
          ...internalClass,
          schedule: schedules || [],
          originalData: {
            ...(internalClass.originalData || {}),
            schedule_plan:
              schedules || internalClass.originalData?.schedule_plan,
            schedule: schedules || internalClass.originalData?.schedule,
          },
        };
        setInternalClass(merged);
        // if we didn't have selectedDay, set to first
        // do not auto-select any day here; user must tap a date to view sessions
      } catch (err) {
        console.warn("[ClassDetailModal] failed to fetch schedule", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    tryFetch();
    return () => {
      cancelled = true;
    };
    // depend on visible and class id (stable scalar) so we fetch once when modal opens
  }, [visible, internalClassId, internalClass]);

  // when modal opens, default calendar to current month and select today
  React.useEffect(() => {
    if (visible) {
      // always show the current month when opening the modal
      setCalendarMonth(new Date());
      // do not auto-select a day — user must tap a day to reveal sessions
    }
  }, [visible, initialMonth]);

  // When internalClass gets populated with schedules, pick the first day if none selected
  React.useEffect(() => {
    // Keep selection controlled by user taps only. Do not auto-select any day here.
    // This effect intentionally does not change `selectedDay`.
    return;
  }, [internalClass]);

  // todayKey is defined above via isoLocal(new Date())

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={localStyles.backdrop}>
        <View style={localStyles.card}>
          <View style={localStyles.header}>
            <Text style={localStyles.title}>{classItem?.name || ""}</Text>
            <TouchableOpacity onPress={onClose} style={localStyles.iconButton}>
              <Ionicons name="close" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={localStyles.body}>
            {/* Calendar header (month nav) */}
            <View style={localStyles.calendarHeader}>
              <TouchableOpacity
                onPress={() =>
                  setCalendarMonth(
                    new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth() - 1,
                      1
                    )
                  )
                }
                style={localStyles.iconButton}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <Text style={localStyles.calendarTitle}>
                {calendarMonth.toLocaleString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setCalendarMonth(
                    new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth() + 1,
                      1
                    )
                  )
                }
                style={localStyles.iconButton}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={localStyles.calendarGrid}>
              <View style={localStyles.weekdaysRow}>
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((h) => (
                  <Text
                    key={h}
                    style={[localStyles.weekday, { color: colors.primary }]}
                  >
                    {h}
                  </Text>
                ))}
              </View>

              {loading ? (
                <View style={localStyles.loadingWrapper}>
                  <ActivityIndicator size={32} color={colors.primary} />
                </View>
              ) : (
                getMonthMatrix(calendarMonth).map((week, wi) => (
                  <View key={wi} style={localStyles.weekRow}>
                    {week.map((day) => {
                      const key = isoLocal(day);
                      const has = marks[key] && marks[key].length > 0;
                      const isCurrentMonth =
                        day.getMonth() === calendarMonth.getMonth();
                      const isSelected = selectedDay === key;
                      const isToday = key === todayKey;
                      return (
                        <TouchableOpacity
                          key={key}
                          style={[
                            localStyles.day,
                            !isCurrentMonth && localStyles.dayFaded,
                            isToday && localStyles.dayToday,
                            isSelected && localStyles.daySelected,
                          ]}
                          onPress={() => setSelectedDay(key)}
                        >
                          <Text
                            style={[
                              localStyles.dayText,
                              isSelected && { color: colors.white },
                            ]}
                          >
                            {day.getDate()}
                          </Text>
                          {has && (
                            <View
                              style={
                                isSelected
                                  ? localStyles.dotSelected
                                  : localStyles.dot
                              }
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))
              )}
            </View>

            <View style={localStyles.sessions}>
              <Text style={localStyles.sessionsTitle}>Buổi học</Text>
              {uniqueSessions.length === 0 ? (
                <Text style={localStyles.noSessions}>Không có buổi học</Text>
              ) : (
                uniqueSessions.map((s: any, i: number) => {
                  const dateText = format.date(
                    s.date || s.session_date || new Date(),
                    "short"
                  );
                  const title = s.slot?.title
                    ? s.slot.title
                    : `Slot ${s.slot?.id || ""}`;
                  const time = timeRangeFrom(s) || timeRangeFrom(s.slot) || "";
                  return (
                    <TouchableOpacity
                      key={i}
                      style={localStyles.sessionCompact}
                      activeOpacity={0.8}
                    >
                      <View style={localStyles.sessionCompactLeft}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={colors.white}
                        />
                      </View>
                      <View style={localStyles.sessionCompactBody}>
                        <Text
                          style={localStyles.sessionCompactMain}
                          numberOfLines={1}
                        >
                          {dateText} · {title}
                        </Text>
                        <View style={localStyles.sessionRight}>
                          <Text
                            style={localStyles.sessionCompactTime}
                            numberOfLines={1}
                          >
                            {time}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.gray[400]}
                            style={{ marginLeft: 8 }}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
    paddingBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  iconButton: { padding: 8, borderRadius: 8 },
  title: { fontSize: 16, fontWeight: "800", color: colors.text },
  close: { color: colors.primary, fontWeight: "700" },
  body: { padding: 16 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metaLabel: { color: colors.textSecondary, fontWeight: "700" },
  metaValue: { color: colors.text, fontWeight: "700" },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 8,
  },
  nav: { fontSize: 18, color: colors.primary },
  calendarTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
  calendarGrid: { padding: 8 },
  weekdaysRow: { flexDirection: "row", justifyContent: "space-between" },
  loadingWrapper: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  weekday: {
    width: 44,
    textAlign: "center",
    color: colors.textSecondary,
    fontWeight: "700",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  day: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    position: "relative",
  },
  dayFaded: { opacity: 0.3 },
  dayToday: { borderWidth: 1, borderColor: colors.primary },
  daySelected: { backgroundColor: colors.primary },
  dayText: { fontSize: 13, fontWeight: "700", color: colors.text },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    position: "absolute",
    bottom: 2,
  },
  dotSelected: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    position: "absolute",
    bottom: 2,
  },
  sessions: { marginTop: 12 },
  sessionsTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  noSessions: { color: colors.textSecondary },
  sessionRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  sessionText: { color: colors.text, fontWeight: "700" },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionCardLeft: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    marginRight: 12,
  },
  sessionCardBody: { flex: 1 },
  sessionCardTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
  sessionCardTime: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  sessionCardDate: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  sessionCompact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 6,
  },
  sessionCompactLeft: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionCompactBody: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionRight: { flexDirection: "row", alignItems: "center" },
  sessionCompactMain: { fontSize: 14, fontWeight: "700", color: colors.text },
  sessionCompactTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 12,
  },
});
