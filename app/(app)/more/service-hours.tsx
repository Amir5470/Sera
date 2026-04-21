import CircularProgress from "@/components/ui/CircularProgress";
import Header from "@/components/ui/Header";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { db } from "@/lib/firebase";
import safeOnSnapshot from "@/lib/firestoreHelpers";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVICE_HOUR_GOAL = 25; // configurable goal

type LogItem = {
  id: string;
  organization: string;
  date: string; // ISO
  hours: number;
  description?: string;
  createdAt?: any;
};

export default function ServiceHoursScreen() {
  const { theme } = useTheme();
  const { profile } = useProfile();
  const { user } = useAuth();

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  // form
  const [organization, setOrganization] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState<string>("");
  const [description, setDescription] = useState("");

  // Firestore listeners
  useEffect(() => {
    if (!profile?.uid) return;
    const col = collection(db, "userIndex", profile.uid, "serviceLogs");
    const q = query(col, orderBy("date", "desc"));
    const unsub = safeOnSnapshot(q, (snap) => {
      const items: LogItem[] = [];
      let sum = 0;
      snap.forEach((d: any) => {
        const data = d.data();
        const h = Number(data.hours) || 0;
        items.push({
          id: d.id,
          organization: data.organization || "",
          date: data.date || "",
          hours: h,
          description: data.description || "",
          createdAt: data.createdAt,
        });
        sum += h;
      });
      setLogs(items);
      setTotal(sum);
    });
    return unsub;
  }, [profile?.uid]);

  const percent = Math.min(1, total / SERVICE_HOUR_GOAL);

  const submit = async () => {
    if (!profile?.uid || !user?.uid) {
      Alert.alert("Error", "Missing profile or user");
      return;
    }
    const h = parseFloat(hours || "0");
    if (!organization.trim() || !h || Number.isNaN(h)) {
      Alert.alert("Invalid", "Organization and hours are required");
      return;
    }

    try {
      const col = collection(db, "userIndex", profile.uid, "serviceLogs");
      await addDoc(col, {
        organization: organization.trim(),
        date,
        hours: h,
        description: description.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setOrganization("");
      setHours("");
      setDescription("");
      setDate(new Date().toISOString().slice(0, 10));
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save log");
    }
  };

  const handleDelete = async (id: string) => {
    if (!profile?.uid) return;
    try {
      await deleteDoc(doc(db, "userIndex", profile.uid, "serviceLogs", id));
    } catch (e) {
      Alert.alert("Delete failed", "Could not remove the log");
    }
  };

  const renderItem = ({ item }: { item: LogItem }) => {
    const right = () => (
      <TouchableOpacity
        style={[styles.deleteButton]}
        onPress={() =>
          Alert.alert("Delete", "Delete this log?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => handleDelete(item.id),
            },
          ])
        }
      >
        <Text style={{ color: "#fff" }}>Delete</Text>
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={right}>
        <View style={styles.card}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={styles.org}>{item.organization}</Text>
            <Text style={styles.hours}>{item.hours}h</Text>
          </View>
          <Text style={styles.date}>{item.date}</Text>
          {item.description ? (
            <Text style={styles.desc}>{item.description}</Text>
          ) : null}
        </View>
      </Swipeable>
    );
  };

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: theme === "light" ? "#fff" : Colors.background },
      ]}
    >
      <Header title="Service Hours" />
      <View style={{ padding: 18, alignItems: "center" }}>
        <CircularProgress progress={percent} color={Colors.primary}>
          <View style={{ alignItems: "center" }}>
            <Text
              style={{ color: Colors.text, fontSize: 18, fontWeight: "700" }}
            >
              {total.toFixed(1)}h
            </Text>
            <Text style={{ color: Colors.muted, marginTop: 6 }}>
              of {SERVICE_HOUR_GOAL} required
            </Text>
          </View>
        </CircularProgress>
        <View style={{ marginTop: 16, width: "100%" }}>
          <Button title="Log Hours" onPress={() => setModalVisible(true)} />
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <FlatList
          data={logs}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <Text
              style={{
                color: Colors.muted,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              No logs yet
            </Text>
          )}
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView
          edges={["top"]}
          style={[
            styles.modalSafe,
            { backgroundColor: theme === "light" ? "#fff" : Colors.background },
          ]}
        >
          <Header
            title="Log Service Hours"
            onPress={() => setModalVisible(false)}
          />
          <View style={{ padding: 18 }}>
            <Text style={{ color: Colors.muted }}>Organization</Text>
            <TextInput
              value={organization}
              onChangeText={setOrganization}
              style={styles.input}
              placeholder="Organization name"
            />

            <Text style={{ color: Colors.muted, marginTop: 8 }}>
              Date (YYYY-MM-DD)
            </Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              style={styles.input}
              placeholder="2024-09-01"
            />

            <Text style={{ color: Colors.muted, marginTop: 8 }}>Hours</Text>
            <TextInput
              value={hours}
              onChangeText={setHours}
              style={styles.input}
              placeholder="1.5"
              keyboardType="numeric"
            />

            <Text style={{ color: Colors.muted, marginTop: 8 }}>
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { minHeight: 80 }]}
              placeholder="Brief description"
              multiline
            />

            <View style={{ marginTop: 16 }}>
              <Button title="Save" onPress={submit} />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, marginTop: -30 },
  modalSafe: { flex: 1 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 10,
    color: Colors.text,
    marginTop: 6,
  },
  card: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  org: { color: Colors.text, fontWeight: "700" },
  hours: { color: Colors.primary, fontWeight: "700" },
  date: { color: Colors.muted, marginTop: 6 },
  desc: { color: Colors.text, marginTop: 8 },
  deleteButton: {
    backgroundColor: "#FF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginVertical: 8,
    borderRadius: 12,
  },
});
