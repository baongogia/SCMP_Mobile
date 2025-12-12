import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  getCourseDetail,
  getAllCourses,
} from "@/src/services/learning_process/course/courseService";

// Module-level caches to avoid repeated network calls when many CourseTag instances mount
let coursesCache: any[] | null = null;
const courseDetailCache: Map<string, any> = new Map();

const fetchAllCoursesCached = async () => {
  if (coursesCache) return coursesCache;
  try {
    const res = await getAllCourses();
    const list = res?.data?.data || res?.data || [];
    coursesCache = Array.isArray(list) ? list : [];
    return coursesCache;
  } catch (e) {
    return [];
  }
};

type Props = {
  courseId?: string | null;
  title?: string;
  description?: string | null;
  course?: any | null; // optional full course object
  style?: any;
};

export default function CourseTag({
  courseId,
  title,
  description,
  course,
  style,
}: Props) {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [courseObj, setCourseObj] = useState<any | null>(course || null);
  // When true the component determined there's no valid course to show and will render nothing
  const [hidden, setHidden] = useState(false);

  const normalize = (s?: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const isLikelyId = (v?: string | null) => {
    if (!v) return false;
    const t = String(v).trim();
    // match hex/objectId-like (6-24 hex chars) or numeric IDs (4+ digits)
    return /^[0-9a-f]{6,24}$/i.test(t) || /^\d{4,}$/.test(t);
  };

  const jaccardSimilarity = (a?: string, b?: string) => {
    const tokenize = (s?: string) =>
      (normalize(s) || "").split(" ").filter((x) => x.length > 0);
    const A = new Set(tokenize(a));
    const B = new Set(tokenize(b));
    if (A.size === 0 || B.size === 0) return 0;
    let inter = 0;
    for (const t of A) if (B.has(t)) inter++;
    return inter / (A.size + B.size - inter);
  };

  const handlePress = async () => {
    try {
      // If we already resolved a full course object, navigate immediately
      if (courseObj && (courseObj._id || courseObj.id)) {
        (navigation as any).navigate("CourseDetail", { course: courseObj });
        return;
      }

      // If a likely id provided, fetch detail (use cache if available)
      if (courseId && isLikelyId(String(courseId))) {
        setLoading(true);
        const cached = courseDetailCache.get(String(courseId));
        if (cached) {
          setCourseObj(cached);
          (navigation as any).navigate("CourseDetail", { course: cached });
          return;
        }

        const res = await getCourseDetail(String(courseId));
        const data = res?.data?.data || res?.data || res;
        const found = data && (data._id || data.id) ? data : null;
        if (found) {
          courseDetailCache.set(String(courseId), found);
          setCourseObj(found);
          (navigation as any).navigate("CourseDetail", { course: found });
        }
        return;
      }

      // Otherwise try to find by title using public courses list
      const searchTerm = title || String(courseId || "");
      if (searchTerm && searchTerm.trim().length > 0) {
        setLoading(true);
        const list = await fetchAllCoursesCached();
        const needle = normalize(searchTerm);
        // Try exact / startsWith / includes
        let found = list.find((c: any) => normalize(c.title) === needle);
        if (!found)
          found = list.find((c: any) => normalize(c.title).startsWith(needle));
        if (!found)
          found = list.find((c: any) => normalize(c.title).includes(needle));

        // Fuzzy fallback using Jaccard similarity
        if (!found && list.length > 0) {
          let best: { item: any; sim: number } | null = null;
          for (const c of list) {
            const sim = jaccardSimilarity(c.title, searchTerm);
            if (!best || sim > best.sim) best = { item: c, sim };
          }
          if (best && best.sim >= 0.35) {
            found = best.item;
          }
        }

        if (found) {
          // cache detail for quick navigation later
          if (found._id || found.id) {
            courseDetailCache.set(String(found._id || found.id), found);
          }
          setCourseObj(found);
          (navigation as any).navigate("CourseDetail", { course: found });
        }
        return;
      }
    } catch (error) {
      // silent fail
      console.error("❌ CourseTag navigation error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Try to preload course when mounted if a courseId exists and course prop wasn't provided
  useEffect(() => {
    let mounted = true;
    const preload = async () => {
      // If caller passed a full course object with id, keep showing immediately
      if (course && (course._id || course.id)) return;
      // If there's no hint (no id and no title) there's nothing to resolve -> hide
      if (!courseId && !(title && title.trim().length > 0)) {
        if (mounted) setHidden(true);
        return;
      }
      try {
        if (isLikelyId(String(courseId))) {
          const cached = courseDetailCache.get(String(courseId));
          if (cached && mounted) {
            setCourseObj(cached);
          } else {
            const res = await getCourseDetail(String(courseId));
            const data = res?.data?.data || res?.data || res;
            if (mounted) {
              if (data && (data._id || data.id)) {
                courseDetailCache.set(String(courseId), data);
                setCourseObj(data);
              } else {
                // couldn't resolve id to a real course -> hide
                setHidden(true);
              }
            }
          }
        } else if (title && title.trim().length > 0) {
          const list = await fetchAllCoursesCached();
          const needle = normalize(title);
          let found = list.find((c: any) => normalize(c.title) === needle);
          if (!found)
            found = list.find((c: any) =>
              normalize(c.title).startsWith(needle)
            );
          if (!found)
            found = list.find((c: any) => normalize(c.title).includes(needle));
          if (!found && list.length > 0) {
            let best: { item: any; sim: number } | null = null;
            for (const c of list) {
              const sim = jaccardSimilarity(c.title, title);
              if (!best || sim > best.sim) best = { item: c, sim };
            }
            if (best && best.sim >= 0.35) found = best.item;
          }
          if (mounted) {
            if (found) setCourseObj(found);
            else setHidden(true);
          }
        }
      } catch (e) {
        // ignore but mark hidden so we don't show invalid placeholders
        if (mounted) setHidden(true);
      }
    };
    preload();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, title]);

  // If the resolved display text is not meaningful (only punctuation or empty), hide the chip.
  useEffect(() => {
    const raw = courseObj?.title || title || description || "";
    const norm = normalize(raw);
    // If normalization removes everything (no letters/numbers), it's not a valid course title
    if (!norm || norm.length === 0) {
      setHidden(true);
    } else {
      // if we already found a real course object, ensure it's visible
      setHidden(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseObj, title, description]);

  return (
    // If we determined there's no valid course to show, render nothing
    hidden ? null : (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.container, style]}
      >
        <View style={styles.inner}>
          {courseObj &&
          courseObj.media &&
          courseObj.media[0] &&
          courseObj.media[0].path ? (
            <Image
              source={{ uri: courseObj.media[0].path }}
              style={styles.thumb}
            />
          ) : (
            <View style={styles.placeholder} />
          )}
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#fff"
              style={styles.loader}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    )
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 50,
    maxWidth: 50,
  },
  inner: { flexDirection: "row", alignItems: "center" },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 0,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  placeholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  title: { color: "#fff", fontWeight: "600", fontSize: 14, maxWidth: 200 },
  loader: { marginLeft: 6 },
});
