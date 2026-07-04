import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";

const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

interface LeaderboardUser {
  _id: string;
  username: string;
  avatarUrl: string;
  xp: number;
  level: number;
  rankName: string;
  rankColor: string;
  position: number;
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/users/leaderboard`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const renderItem = ({ item }: { item: LeaderboardUser }) => (
    <View className="mb-3 flex-row items-center rounded-2xl border border-gp-border bg-gp-surface p-4">
      <View className="mr-4 h-8 w-8 items-center justify-center rounded-full bg-gp-canvas border border-gp-border">
        <Text className="font-bold text-gp-white">{item.position}</Text>
      </View>

      <Image
        source={item.avatarUrl}
        className="h-12 w-12 rounded-full border border-gp-border"
      />

      <View className="ml-3 flex-1">
        <Text className="text-lg font-bold text-gp-white">{item.username}</Text>
        <View className="flex-row items-center">
            <Text className="text-[10px] font-black uppercase" style={{ color: item.rankColor }}>
                {item.rankName}
            </Text>
            <Text className="mx-1.5 text-xs text-gp-border">|</Text>
            <Text className="text-xs text-gp-muted">LVL {item.level}</Text>
        </View>
      </View>

      <View className="items-end">
        <Text className="text-lg font-black text-gp-neon">{item.xp}</Text>
        <Text className="text-[10px] font-bold text-gp-muted uppercase">XP</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gp-canvas">
        <ActivityIndicator size="large" color="#00E884" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gp-canvas px-6 pt-14">
      <View className="mb-6 flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-gp-card">
            <Feather name="trending-up" size={24} color="#00E884" />
          </View>
          <Text className="text-3xl font-black text-gp-white">Global Pulse</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchLeaderboard();
            }}
            tintColor="#00E884"
          />
        }
        ListEmptyComponent={
            <Text className="mt-10 text-center text-gp-muted">No users found yet.</Text>
        }
      />
    </View>
  );
}
