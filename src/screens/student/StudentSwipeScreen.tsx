// src/screens/student/StudentSwipeScreen.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Button,
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
import { getTeachers, likeTeacher as apiLikeTeacher } from "../api/api";

type Teacher = {
  teacherId: string;
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

  const [dismissedTeacherIds, setDismissedTeacherIds] = useState<Set<string>>(
    () => new Set()
  );

  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const studentId = String(user?.id ?? "s1");
  const studentName = String(user?.name ?? "Schüler");

  const alreadyRequested = (teacherId: string) => {
    return requests.some(
      (r) =>
        String(r.studentId) === studentId &&
        String(r.teacherId) === teacherId &&
        (r.status === "pending" || r.status === "accepted")
    );
  };

  const alreadyChatted = (teacherId: string) => {
    return chats.some(
      (c) =>
        String(c.studentId) === studentId &&
        String(c.teacherId) === teacherId
    );
  };

  const visibleTeachers = useMemo(() => {
    return (teachers ?? []).filter((t) => {
      const tid = String(t.id);
      return (
        !dismissedTeacherIds.has(tid) &&
        !alreadyRequested(tid) &&
        !alreadyChatted(tid)
      );
    });
  }, [teachers, requests, chats, dismissedTeacherIds]);

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

  const cardStyle = {
    transform: [...position.getTranslateTransform(), { rotate }],
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  const nextCard = () => setIndex((prev) => prev + 1);

  const swipeOut = (direction: "left" | "right") => {
    if (!currentTeacher) return;

    const x = direction === "right" ? width + 120 : -width - 120;

    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(async () => {
      if (direction === "right") {
        try {
          await createRequest({
            studentId,
            studentName,
            teacherId: String(currentTeacher.id),
            teacherName: String(currentTeacher.name),
            subject: String(currentTeacher.subject ?? "—"),
            city: String(currentTeacher.city ?? "Berlin"),
            when: "so bald wie möglich",
          });

          Alert.alert("Anfrage gesendet");
        } catch (e: any) {
          Alert.alert("Fehler", String(e?.message ?? e));
        }
      } else {
        setDismissedTeacherIds((prev) => {
          const next = new Set(prev);
          next.add(String(currentTeacher.id));
          return next;
        });
      }

      position.setValue({ x: 0, y: 0 });
      nextCard();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 6,
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) swipeOut("right");
        else if (gesture.dx < -SWIPE_THRESHOLD) swipeOut("left");
        else resetPosition();
      },
    })
  ).current;

  useEffect(() => {
    async function loadTeachers() {
      try {
        setLoading(true);
        const data = await getTeachers();
        console.log("TEACHERS FROM API:", data);
        setTeachers(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    }

    loadTeachers();
  }, []);

  async function handleTestLike() {
    try {
      const result = await apiLikeTeacher("s1", "t1");
      console.log("SUCCESS:", result);
      Alert.alert("Like erfolgreich");
    } catch (e: any) {
      console.log("ERROR:", e);
      Alert.alert("Fehler", String(e?.message ?? e));
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Lade Lehrer…</Text>
      </View>
    );
  }

  if (!currentTeacher) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Keine neuen Lehrer</Text>

        {/* TEST BUTTON */}
        <Button title="Test Like API" onPress={handleTestLike} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lehrer</Text>

      <View style={styles.cardArea}>
        <Animated.View style={[styles.card, cardStyle]} {...panResponder.panHandlers}>
          <Text style={styles.name}>{currentTeacher.name}</Text>
          <Text>{currentTeacher.subject} • {currentTeacher.city}</Text>
        </Animated.View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.nope} onPress={() => swipeOut("left")}>
          <Text>Nein</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.like} onPress={() => swipeOut("right")}>
          <Text>Ja</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 22, fontWeight: "bold" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  cardArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: "90%",
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
  },
  name: { fontSize: 20, fontWeight: "bold" },
  buttons: { flexDirection: "row", justifyContent: "space-between" },
  nope: { padding: 15, backgroundColor: "#eee", borderRadius: 10 },
  like: { padding: 15, backgroundColor: "#c8f7c5", borderRadius: 10 },
});