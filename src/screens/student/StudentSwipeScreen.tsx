// src/screens/student/StudentSwipeScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Animated, PanResponder,
  Dimensions, TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { getTeachers, likeTeacher as apiLikeTeacher } from "../api/api";

type Teacher = {
  id?: string;
  teacherId?: string;
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
  const { requests } = useAppData();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const studentId = String(user?.id ?? "s1");
  const studentName = String(user?.name ?? "Schüler");

  const getId = (t: Teacher) => String(t.teacherId ?? t.id ?? "");

  const alreadyRequested = (tid: string) =>
    requests.some(
      r => String(r.studentId) === studentId &&
           String(r.teacherId) === tid &&
           (r.status === "pending" || r.status === "accepted")
    );

  const visibleTeachers = useMemo(() =>
    teachers.filter(t => {
      const tid = getId(t);
      return !dismissedIds.has(tid) && !alreadyRequested(tid);
    }),
    [teachers, requests, dismissedIds]
  );

  const currentTeacher = visibleTeachers[index] ?? null;

  useEffect(() => {
    if (index >= visibleTeachers.length) {
      setIndex(0);
      position.setValue({ x: 0, y: 0 });
    }
  }, [index, visibleTeachers.length]);

  const rotate = position.x.interpolate({
    inputRange: [-width * 1.2, 0, width * 1.2],
    outputRange: ["-14deg", "0deg", "14deg"],
  });

  const resetPosition = () => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
  };

  const nextCard = () => setIndex(prev => prev + 1);

  const swipeOut = (direction: "left" | "right") => {
    if (!currentTeacher) return;
    const x = direction === "right" ? width + 120 : -width - 120;

    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(async () => {
      const tid = getId(currentTeacher);
      if (direction === "right") {
        try {
          await apiLikeTeacher(studentId, tid);
          Alert.alert("✅ Anfrage gesendet!");
        } catch (e: any) {
          Alert.alert("Fehler", String(e?.message ?? e));
        }
      } else {
        setDismissedIds(prev => new Set([...prev, tid]));
      }
      position.setValue({ x: 0, y: 0 });
      nextCard();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_e, g) => {
        if (g.dx > SWIPE_THRESHOLD) swipeOut("right");
        else if (g.dx < -SWIPE_THRESHOLD) swipeOut("left");
        else resetPosition();
      },
    })
  ).current;

  useEffect(() => {
    getTeachers()
      .then(data => setTeachers(Array.isArray(data) ? data : []))
      .catch(e => Alert.alert("Fehler", String(e?.message || e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator />
      <Text>Lade Lehrer…</Text>
    </View>
  );

  if (!currentTeacher) return (
    <View style={styles.center}>
      <Text style={styles.title}>Keine neuen Lehrer 🎉</Text>
      <Text style={{ opacity: 0.5, marginTop: 8 }}>Schau später nochmal vorbei!</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lehrer finden</Text>

      <View style={styles.cardArea}>
        <Animated.View
          style={[styles.card, { transform: [...position.getTranslateTransform(), { rotate }] }]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.name}>{currentTeacher.name}</Text>
          <Text style={styles.sub}>{currentTeacher.subject} • {currentTeacher.city}</Text>
          {!!currentTeacher.bio && <Text style={styles.bio}>{currentTeacher.bio}</Text>}
          {!!currentTeacher.pricePerHour && (
            <Text style={styles.price}>{currentTeacher.pricePerHour}€/h</Text>
          )}
        </Animated.View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.nope} onPress={() => swipeOut("left")}>
          <Text style={styles.nopeText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.like} onPress={() => swipeOut("right")}>
          <Text style={styles.likeText}>♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 22, fontWeight: "900", marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "800" },
  cardArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: "90%", padding: 24, borderWidth: 1,
    borderColor: "#eee", borderRadius: 20,
    backgroundColor: "#fff", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.08,
    shadowRadius: 12, elevation: 4,
  },
  name: { fontSize: 24, fontWeight: "900" },
  sub: { opacity: 0.6, marginTop: 6, fontSize: 16 },
  bio: { marginTop: 12, textAlign: "center", opacity: 0.7 },
  price: { marginTop: 10, fontWeight: "700", fontSize: 16, color: "#4CAF50" },
  buttons: { flexDirection: "row", justifyContent: "center", gap: 30, paddingBottom: 20 },
  nope: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#eee", justifyContent: "center", alignItems: "center" },
  like: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#c8f7c5", justifyContent: "center", alignItems: "center" },
  nopeText: { fontSize: 24 },
  likeText: { fontSize: 24 },
});