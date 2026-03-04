// src/screens/student/StudentSwipeScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Animated, PanResponder,
  Dimensions, TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { getTeachers, likeTeacher } from "../api/api";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = 0.25 * width;

export default function StudentSwipeScreen() {
  const { user } = useAuth();
  const { requests } = useAppData();

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  const studentId = String(user?.id ?? "");
  const studentName = String(user?.name ?? "Schüler");

  const visibleTeachers = useMemo(() =>
    teachers.filter(t => {
      const tid = String(t.teacherId || t.id);
      const alreadyLiked = requests.some(r => r.teacherId === tid && r.studentId === studentId);
      return !dismissedIds.has(tid) && !alreadyLiked;
    }),
    [teachers, requests, dismissedIds]
  );

  const currentTeacher = visibleTeachers[index] ?? null;

  useEffect(() => {
    getTeachers().then(setTeachers).finally(() => setLoading(false));
  }, []);

  const swipeOut = (direction: "left" | "right") => {
    if (!currentTeacher) return;
    const tid = String(currentTeacher.teacherId || currentTeacher.id);
    const x = direction === "right" ? width + 120 : -width - 120;

    // ✅ SOFORT lokal ausblenden
    setDismissedIds(prev => new Set(prev).add(tid));

    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      if (direction === "right") {
        try {
          await likeTeacher(studentId, studentName, tid);
        } catch (e) {
          Alert.alert("Fehler", "Anfrage konnte nicht gesendet werden.");
        }
      }
      position.setValue({ x: 0, y: 0 });
      setIndex(prev => prev + 1);
    });
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (e, g) => position.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (e, g) => {
      if (g.dx > SWIPE_THRESHOLD) swipeOut("right");
      else if (g.dx < -SWIPE_THRESHOLD) swipeOut("left");
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
    },
  });

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!currentTeacher) return <View style={styles.center}><Text>Keine neuen Lehrer 🎉</Text></View>;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { transform: [...position.getTranslateTransform()] }]} {...panResponder.panHandlers}>
        <Text style={styles.name}>{currentTeacher.name}</Text>
        <Text>{currentTeacher.subject} • {currentTeacher.city}</Text>
        <Text style={styles.price}>{currentTeacher.pricePerHour}€/h</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { width: "100%", height: 400, padding: 20, borderRadius: 20, backgroundColor: "#fff", elevation: 5, justifyContent: "center", alignItems: "center", borderSize: 1, borderColor: "#eee" },
  name: { fontSize: 24, fontWeight: "bold" },
  price: { fontSize: 20, color: "green", marginTop: 10 }
});