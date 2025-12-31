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

type Teacher = {
  id: string;
  name: string;
  subject?: string | null;
  bio?: string | null;
  city?: string | null; // kann später kommen
  pricePerHour?: number | null; // optional
};

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = 0.25 * width;
const SWIPE_OUT_DURATION = 200;

// ✅ WICHTIG:
// - Simulator: "http://localhost:3000"
// - Handy (Expo Go): "http://DEINE_MAC_IP:3000"  -> ipconfig getifaddr en0
const API_BASE = "http://192.168.178.47:3000";

export default function StudentSwipeScreen() {
  const { user } = useAuth();
  const { createRequest, requests } = useAppData();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  const studentId = (user?.id ?? user?.uid ?? "s1") as string;
  const studentName = (user?.name ?? user?.displayName ?? "Schüler") as string;

  // -------- Load teachers from backend (Supabase) --------
  useEffect(() => {
    let cancelled = false;

    async function loadTeachers() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/api/teachers`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || data?.error || "Failed to load teachers");
        }

        if (!cancelled) {
          setTeachers(Array.isArray(data) ? data : []);
          setIndex(0);
        }
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
  }, []);

  const currentTeacher = teachers[index];

  const rotate = position.x.interpolate({
    inputRange: [-width * 1.5, 0, width * 1.5],
    outputRange: ["-18deg", "0deg", "18deg"],
  });

  const cardStyle = {
    transform: [...position.getTranslateTransform(), { rotate }],
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const nextCard = () => setIndex((prev) => prev + 1);

  const alreadyRequested = (teacherId: string) => {
    return requests.some(
      (r) =>
        String(r.studentId) === String(studentId) &&
        String(r.teacherId) === String(teacherId) &&
        (r.status === "pending" || r.status === "accepted")
    );
  };

  const likeTeacher = (t: Teacher) => {
    if (alreadyRequested(t.id)) {
      Alert.alert("Schon angefragt", `Du hast ${t.name} bereits angefragt.`);
      return;
    }

    // city kommt bei dir evtl. noch nicht aus Supabase -> fallback
    const city = t.city ?? "—";

    createRequest({
      studentId,
      studentName,
      teacherId: t.id,
      teacherName: t.name,
      subject: t.subject ?? "—",
      city,
      when: "so bald wie möglich",
    });

    Alert.alert("Anfrage gesendet", `Deine Anfrage an ${t.name} wurde gesendet.`);
  };

  const swipeOut = (direction: "left" | "right") => {
    if (!currentTeacher) return;

    const x = direction === "right" ? width + 100 : -width - 100;

    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      if (direction === "right") {
        likeTeacher(currentTeacher);
      }
      position.setValue({ x: 0, y: 0 });
      nextCard();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_evt, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) swipeOut("right");
        else if (gesture.dx < -SWIPE_THRESHOLD) swipeOut("left");
        else resetPosition();
      },
    })
  ).current;

  // -------- UI states --------
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Swipen</Text>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 12, opacity: 0.6 }}>Lade Teachers…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Swipen</Text>
        <Text style={styles.title}>Fehler beim Laden 😅</Text>
        <Text style={styles.sub}>{error}</Text>
        <Text style={[styles.sub, { marginTop: 12 }]}>
          Tipp: Wenn du auf dem Handy testest, setze API_BASE auf deine Mac-IP (ipconfig getifaddr en0).
        </Text>
      </View>
    );
  }

  if (!currentTeacher) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Swipen</Text>
        <Text style={styles.title}>Keine Lehrer mehr 😅</Text>
        <Text style={styles.sub}>Füge neue Teachers hinzu oder komm später wieder.</Text>
      </View>
    );
  }

  const metaLine = useMemo(() => {
    const subject = currentTeacher.subject ?? "—";
    const city = currentTeacher.city ?? "—";
    return `${subject} • ${city}`;
  }, [currentTeacher]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Swipen</Text>

      <View style={styles.cardArea}>
        <Animated.View style={[styles.card, cardStyle]} {...panResponder.panHandlers}>
          <Text style={styles.name}>{currentTeacher.name}</Text>

          <Text style={styles.meta}>{metaLine}</Text>

          {!!currentTeacher.bio && <Text style={styles.bio}>{currentTeacher.bio}</Text>}

          {currentTeacher.pricePerHour != null && (
            <Text style={styles.meta}>{currentTeacher.pricePerHour}€/h</Text>
          )}

          {alreadyRequested(currentTeacher.id) && (
            <Text style={styles.badge}>Anfrage läuft schon</Text>
          )}

          <Text style={styles.hint}>Zieh nach links/rechts</Text>
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

  cardArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    width: "95%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 18,
    padding: 18,
    minHeight: 240,
    justifyContent: "center",
  },

  name: { fontSize: 24, fontWeight: "900", marginBottom: 6 },
  meta: { fontSize: 16, marginTop: 4 },
  bio: { fontSize: 15, marginTop: 10, opacity: 0.8 },
  hint: { marginTop: 18, opacity: 0.5 },

  badge: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#eee",
    fontWeight: "700",
  },

  buttons: { flexDirection: "row", gap: 12, paddingVertical: 10 },
  btn: { flex: 1, padding: 14, borderRadius: 14, alignItems: "center" },
  nope: { backgroundColor: "#eee" },
  like: { backgroundColor: "#c8f7c5" },
  btnText: { fontSize: 18, fontWeight: "700" },

  title: { fontSize: 22, fontWeight: "900", marginBottom: 8 },
  sub: { opacity: 0.6, textAlign: "center" },
});
