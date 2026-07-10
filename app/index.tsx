import * as AuthSession from "expo-auth-session";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence
} from "react-native-reanimated";

import Logo from "../assets/images/Yellow Black Modern Art & Design Logo.png";

WebBrowser.maybeCompleteAuthSession();

const githubDiscovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
};

const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
const githubClientId = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || "";

export default function IndexPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");

  const logoScale = useSharedValue(1);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "gitpulse2",
    preferExpoProxy: true,
  });

  useEffect(() => {
    console.log("--- CONFIGURATION CHECK ---");
    console.log("API URL:", apiUrl);
    console.log("Redirect URI:", redirectUri);
    console.log("GitHub Client ID:", githubClientId);
    console.log("---------------------------");

    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: githubClientId,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ["read:user", "user:email"],
      usePKCE: true,
    },
    githubDiscovery,
  );

  useEffect(() => {
    async function exchangeGithubCode() {
      if (response?.type !== "success") {
        if (response?.type === "error") {
          setAuthError(response.params.error_description || "GitHub sign in failed.");
          setIsSigningIn(false);
        }
        return;
      }

      const code = response.params.code;
      if (!code) {
        setAuthError("GitHub did not return an authorization code.");
        setIsSigningIn(false);
        return;
      }

      try {
        const authResponse = await fetch(`${apiUrl}/api/auth/github`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirectUri,
            codeVerifier: request?.codeVerifier,
          }),
        });

        const payload = await authResponse.json();
        if (!authResponse.ok) throw new Error(payload.message || "GitHub sign in failed.");

        await AsyncStorage.setItem("userToken", payload.token);
        await AsyncStorage.setItem("userData", JSON.stringify(payload.user));
        if (payload.github) {
          await AsyncStorage.setItem("githubData", JSON.stringify(payload.github));
        }

        router.replace("/(tabs)/dashboard");
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Unable to complete GitHub sign in.");
      } finally {
        setIsSigningIn(false);
      }
    }

    exchangeGithubCode();
  }, [redirectUri, request?.codeVerifier, response]);

  async function handleGithubLogin() {
    setAuthError("");
    if (!githubClientId) {
      setAuthError("Add EXPO_PUBLIC_GITHUB_CLIENT_ID to your app environment.");
      return;
    }
    setIsSigningIn(true);
    await promptAsync();
  }

  return (
    <View className="flex-1 bg-gp-canvas px-8 pb-12 pt-20">
      <View className="flex-1 items-center justify-center">
        <Animated.View
          entering={FadeInUp.delay(200).duration(1000)}
          style={animatedLogoStyle}
          className="items-center"
        >
          <Image
            source={Logo}
            className="h-32 w-32"
            contentFit="contain"
          />
          <Text className="mt-4 text-5xl font-black text-gp-white tracking-tighter">
            Git<Text className="text-gp-neon">Pulse</Text>
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).duration(1000)}
          className="mt-12 items-center"
        >
          <Text className="text-center text-3xl font-extrabold leading-tight text-gp-white px-4">
            Your code streak is your legacy.{"\n"}
            <Text className="text-gp-neon">Protect it.</Text>
          </Text>

          <View className="mt-10 w-full max-w-xs rounded-3xl border border-gp-border bg-gp-surface/50 p-6 backdrop-blur-xl">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-gp-card">
                <Feather name="github" size={22} color="#00E884" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-gp-white">Open Source</Text>
                <Text className="text-xs text-gp-muted">Track your daily contributions</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(600).duration(1000)}>
        <Pressable
          disabled={!request || isSigningIn}
          onPress={handleGithubLogin}
          className={`h-16 flex-row items-center justify-center rounded-2xl shadow-lg shadow-gp-neon/20 ${
            !request || isSigningIn ? "bg-gp-neonDim opacity-80" : "bg-gp-neon"
          }`}
        >
          {isSigningIn ? (
            <ActivityIndicator color="#050606" />
          ) : (
            <Feather name="github" size={24} color="#050606" />
          )}
          <Text className="ml-3 text-xl font-black text-gp-canvas uppercase tracking-widest">
            {isSigningIn ? "Connecting..." : "Sync GitHub"}
          </Text>
        </Pressable>

        {authError ? (
          <Text className="mt-4 text-center text-sm font-semibold text-gp-danger">
            {authError}
          </Text>
        ) : null}

        <Text className="mt-6 text-center text-[10px] leading-4 text-gp-muted uppercase font-bold tracking-widest opacity-60">
          Secure Authorization via GitHub OAuth
        </Text>
      </Animated.View>
    </View>
  );
}
