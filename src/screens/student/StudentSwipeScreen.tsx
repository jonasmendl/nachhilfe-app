import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

type Teacher = {
  id: string;
  name: string;
  subject: string;
  city: string;
  pricePerHour?: number;
};

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = 0.25 * width;
const SWIPE_OUT_DURATION = 200;

export default function StudentSwipeScreen() {
  const { user } = useAuth();
  const { createRequest, requests } = useAppData();

  const teachers: Teacher[] = useMemo(
    () => [
      { id: "t1", name: "Ann A", subject: "Mathe", city: "Berlin", pricePerHour: 20 },
      { id: "t2", name: "Lea K", subject: "Deutsch", city: "Hamburg", pricePerHour: 18 },
      { id: "t3", name: "Murat S", subject: "Englisch", city: "München", pricePerHour: 22 },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  const studentId = (user?.id ?? user?.uid ?? "s1") as string;
  const studentName = (user?.name ?? user?.displayName ?? "Schüler") as string;

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
        r.studentId === studentId &&
        r.teacherId === teacherId &&
        (r.status === "pending" || r.status === "accepted")
    );
  };

  const likeTeacher = (t: Teacher) => {
    if (alreadyRequested(t.id)) {
      Alert.alert("Schon angefragt", `Du hast ${t.name} bereits angefragt.`);
      return;
    }

    createRequest({
      studentId,
      studentName,
      teacherId: t.id,
      teacherName: t.name,
      subject: t.subject,
      city: t.city,
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

  if (!currentTeacher) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Keine Lehrer mehr 😅</Text>
        <Text style={styles.sub}>Komm später wieder oder ändere deine Filter.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Swipen</Text>

      <View style={styles.cardArea}>
        <Animated.View style={[styles.card, cardStyle]} {...panResponder.panHandlers}>
          <Text style={styles.name}>{currentTeacher.name}</Text>
          <Text style={styles.meta}>
            {currentTeacher.subject} • {currentTeacher.city}
          </Text>
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
