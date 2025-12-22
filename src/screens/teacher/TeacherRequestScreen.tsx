import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

export default function TeacherRequestScreen({ navigation }: any) {
  const { user } = useAuth();
  const { requests, acceptRequest, rejectRequest, addDemoRequestForTeacher, resetAll } = useAppData();

  const myTeacherId = (user?.id ?? user?.uid ?? "t1") as string;
  const myTeacherName = (user?.name ?? user?.displayName ?? "Ann A") as string;

  // ✅ nur pending Requests für diesen Lehrer
  const pending = useMemo(() => {
    return requests.filter(
      (r: any) => r.status === "pending" && r.teacherId === myTeacherId
    );
  }, [requests, myTeacherId]);

  const addDemo = () => {
    // ✅ erzeugt garantiert eine Anfrage an diesen Lehrer
    addDemoRequestForTeacher(myTeacherId, myTeacherName);
  };

  const accept = (req: any) => {
    const chat = acceptRequest(req.id);
    if (chat) {
      // ✅ DIREKT in den Chat
      navigation.navigate("ChatDetail", { chat });
    }
  };

  const reject = (req: any) => {
    rejectRequest(req.id);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
        Anfragen
      </Text>

      {/* Debug */}
      <Text style={{ marginBottom: 10, opacity: 0.7 }}>
        TeacherId: {myTeacherId} | Requests: {requests.length} | Pending: {pending.length}
      </Text>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={addDemo}
          style={{ flex: 1, padding: 12, backgroundColor: "#111", borderRadius: 12 }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", textAlign: "center" }}>
            Demo-Request erstellen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={resetAll}
          style={{ padding: 12, backgroundColor: "#eee", borderRadius: 12 }}
        >
          <Text style={{ fontWeight: "800" }}>Reset</Text>
        </TouchableOpacity>
      </View>

      {pending.length === 0 ? (
        <Text style={{ opacity: 0.6 }}>Keine offenen Anfragen</Text>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(i: any) => i.id}
          renderItem={({ item }: any) => (
            <View style={{ padding: 14, borderWidth: 1, borderRadius: 12, marginBottom: 10 }}>
              <Text style={{ fontWeight: "800" }}>{item.studentName}</Text>
              <Text>
                {item.subject} • {item.city} • {item.when}
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => accept(item)}
                  style={{ padding: 10, backgroundColor: "#c8f7c5", borderRadius: 10 }}
                >
                  <Text>Annehmen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => reject(item)}
                  style={{ padding: 10, backgroundColor: "#eee", borderRadius: 10 }}
                >
                  <Text>Ablehnen</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
