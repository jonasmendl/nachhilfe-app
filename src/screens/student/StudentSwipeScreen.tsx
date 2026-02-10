// src/screens/StudentSwipeScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { getTeachers } from "../api/api";

type Teacher = {
  id: string;
  name: string;
  subject?: string | null;
  bio?: string | null;
  city?: string | null;
  pricePerHour?: number | null;
};

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = 0.25 * width;
const SWIPE_OUT_DURATION = 220;

export default function StudentSwipeScreen() {
  const { user } = useAuth();
  const { createRequest, requests, chats } = useAppData();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Neu: lokal "weggewischt" (Nein) – muss sofort verschwinden in der Demo
  const [dismissedTeacherIds, setDismissedTeacherIds] = useState<Set<string>>(() => new Set());

  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const studentId = String(user?.id ?? "s1");
  const studentName = String(user?.name ?? "Schüler");

  const alreadyRequested = (teacherId: string) => {
    return requests.some(
      (r) =>
        String(r.studentId) === String(studentId) &&
        String(r.teacherId) === String(teacherId) &&
        (r.status === "pending" || r.status === "accepted")
    );
  };

  const alreadyChatted = (teacherId: string) => {
    return chats.some(
      (c) => String(c.studentId) === String(studentId) && String(c.teacherId) === String(teacherId)
    );
  };

  // ✅ nur "neue" Lehrer anzeigen:
  // - nicht angefragt
  // - nicht im Chat
  // - nicht weggewischt ("Nein") in dieser Session
  const visibleTeachers = useMemo(() => {
    const dismissed = dismissedTeacherIds;
    return (teachers ?? []).filter((t) => {
      const tid = String(t.id);
      return !dismissed.has(tid) && !alreadyRequested(tid) && !alreadyChatted(tid);
    });
  }, [teachers, requests, chats, studentId, dismissedTeacherIds]);

  const currentTeacher = visibleTeachers[index] ?? null;

  useEffect(() => {
    // defensive: wenn Liste schrumpft, Index wieder gültig machen
    if (index >= visibleTeachers.length) {
      setIndex(0);
      position.setValue({ x: 0, y: 0 });
    }
  }, [index, visibleTeachers.length, position]);

  const rotate = position.x.interpolate({
    inputRange: [-width * 1.2, 0, width * 1.2],
    outputRange: ["-14deg", "0deg", "14deg"],
  });

  const cardStyle = useMemo(
    () => ({
      transform: [...position.getTranslateTransform(), { rotate }],
    }),
    [position, rotate]
  );

  const metaLine = useMemo(() => {
    const subject = currentTeacher?.subject ?? "—";
    const city = currentTeacher?.city ?? "—";
    return `${subject} • ${city}`;
  }, [currentTeacher]);

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      friction: 7,
      tension: 70,
    }).start();
  };

  const nextCard = () => setIndex((prev) => prev + 1);

  const likeTeacher = async (t: Teacher) => {
    try {
      await createRequest({
        studentId,
        studentName,
        teacherId: String(t.id),
        teacherName: String(t.name),
        subject: String(t.subject ?? "—"),
        city: String(t.city ?? "Berlin"),
        when: "so bald wie möglich",
      });

      Alert.alert("Anfrage gesendet", `Deine Anfrage an ${t.name} wurde gesendet.`);
    } catch (e: any) {
      Alert.alert("Fehler", String(e?.message ?? e));
    }
  };

  const dismissTeacher = (t: Teacher) => {
    const tid = String(t.id);
    setDismissedTeacherIds((prev) => {
      const next = new Set(prev);
      next.add(tid);
      return next;
    });
  };

  const swipeOut = (direction: "left" | "right") => {
    if (!currentTeacher) return;

    const x = direction === "right" ? width + 120 : -width - 120;

    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      if (direction === "right") {
        void likeTeacher(currentTeacher);
      } else {
        // ✅ "Nein" muss sofort weg sein
        dismissTeacher(currentTeacher);
      }

      position.setValue({ x: 0, y: 0 });
      nextCard();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,

      onPanResponderGrant: () => {
        position.setOffset({
          // @ts-ignore
          x: position.x.__getValue(),
          // @ts-ignore
          y: position.y.__getValue(),
        });
        position.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_evt, gesture) => {
        position.flattenOffset();

        if (gesture.dx > SWIPE_THRESHOLD) swipeOut("right");
        else if (gesture.dx < -SWIPE_THRESHOLD) swipeOut("left");
        else resetPosition();
      },

      onPanResponderTerminate: () => {
        position.flattenOffset();
        resetPosition();
      },
    })
  ).current;

  useEffect(() => {
    let cancelled = false;

    async function loadTeachers() {
      try {
        setLoading(true);
        setError(null);

        const data = await getTeachers();
        if (cancelled) return;

        setTeachers(Array.isArray(data) ? (data as Teacher[]) : []);
        setIndex(0);
        position.setValue({ x: 0, y: 0 });
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTeachers();
    return () => {
      cancelled = true;
    };
  }, [position]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Lehrer</Text>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Lade Lehrer…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Lehrer</Text>
        <View style={styles.center}>
          <Text style={styles.title}>Konnte Lehrer nicht laden</Text>
          <Text style={styles.muted}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!currentTeacher) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Lehrer</Text>
        <View style={styles.center}>
          <Text style={styles.title}>Keine neuen Lehrer</Text>
          <Text style={styles.muted}>Du hast alle passenden Lehrer schon gesehen.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lehrer</Text>

      <View style={styles.cardArea}>
        <Animated.View style={[styles.card, cardStyle]} {...panResponder.panHandlers}>
          <Text style={styles.name}>{String(currentTeacher.name)}</Text>
          <Text style={styles.meta}>{metaLine}</Text>

          {!!currentTeacher.bio && <Text style={styles.bio}>{String(currentTeacher.bio)}</Text>}

          {currentTeacher.pricePerHour != null && (
            <Text style={styles.meta}>{Number(currentTeacher.pricePerHour)}€/h</Text>
          )}

          <Text style={styles.hint}>Wische links/rechts</Text>
        </Animated.View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.nope]} onPress={() => swipeOut("left")}>
          <Text style={styles.btnText}>Nein</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.like]} onPress={() => swipeOut("right")}>
          <Text style={styles.btnText}>Ja</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "800", marginBottom: 12 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { marginTop: 12, opacity: 0.6, textAlign: "center" },
  title: { fontSize: 18, fontWeight: "900", textAlign: "center" },

  cardArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    width: "95%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 18,
    padding: 18,
    minHeight: 240,
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  name: { fontSize: 24, fontWeight: "900", marginBottom: 6 },
  meta: { fontSize: 16, marginTop: 4 },
  bio: { fontSize: 15, marginTop: 10, opacity: 0.8 },
  hint: { marginTop: 18, opacity: 0.5 },

  buttons: { flexDirection: "row", gap: 12, paddingVertical: 10 },
  btn: { flex: 1, padding: 14, borderRadius: 14, alignItems: "center" },
  nope: { backgroundColor: "#eee" },
  like: { backgroundColor: "#c8f7c5" },
  btnText: { fontSize: 18, fontWeight: "700" },
});
