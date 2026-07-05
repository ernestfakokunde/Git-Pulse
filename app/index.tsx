        import * as AuthSession from "expo-auth-session";
        import { Feather } from "@expo/vector-icons";
        import { Image } from "expo-image";
        import { router } from "expo-router";
        import * as WebBrowser from "expo-web-browser";
        import { useEffect, useState } from "react";
        import { ActivityIndicator, Pressable, Text, View } from "react-native";
        import AsyncStorage from "@react-native-async-storage/async-storage";

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
          const redirectUri = AuthSession.makeRedirectUri({
            scheme: "gitpulse2",
            preferExpoProxy: true,
          });

          useEffect(() => {
            console.log("Redirect URI:", redirectUri);
          }, [redirectUri]);
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
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    code,
                    redirectUri,
                    codeVerifier: request?.codeVerifier,
                  }),
                });

                const payload = await authResponse.json();

                if (!authResponse.ok) {
                  throw new Error(payload.message || "GitHub sign in failed.");
                }

                // Store JWT and User data
                await AsyncStorage.setItem("userToken", payload.token);
                await AsyncStorage.setItem("userData", JSON.stringify(payload.user));
                if (payload.github) {
                  await AsyncStorage.setItem("githubData", JSON.stringify(payload.github));
                }

                router.replace("/(tabs)/dashboard");
              } catch (error) {
                setAuthError(
                  error instanceof Error
                    ? error.message
                    : "Unable to complete GitHub sign in.",
                );
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
            <View className="flex-1 bg-gp-canvas px-8 pb-8 pt-14">
              <View className="flex-1 items-center">
                <View className="mt-10 flex-row items-center justify-center">
                  <Image
                    source={Logo}
                    className="mr-3 h-16 w-16"
                    contentFit="contain"
                  />

                  <Text className="text-5xl font-black text-gp-white">
                    Git<Text className="text-gp-neon">Pulse</Text>
                  </Text>
                </View>

                <Text className="mt-28 text-center text-3xl font-extrabold leading-10 text-gp-white">
                  Your code streak is your legacy.{"\n"}Protect it.
                </Text>

                <View className="mt-20 w-full rounded-3xl border border-gp-border bg-gp-surface px-6 py-5">
                  <View className="flex-row items-center">
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-gp-card">
                      <Feather name="github" size={26} color="#00E884" />
                    </View>

                    <View className="ml-4 flex-1">
                      <Text className="text-xl font-bold text-gp-white">
                        Continue with GitHub
                      </Text>
                      <Text className="mt-1 text-base text-gp-muted">
                        Connect your account to track public contribution streaks.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <Pressable
                disabled={!request || isSigningIn}
                onPress={handleGithubLogin}
                className={`h-16 flex-row items-center justify-center rounded-3xl ${
                  !request || isSigningIn ? "bg-gp-neonDim" : "bg-gp-neon"
                }`}
              >
                {isSigningIn ? (
                  <ActivityIndicator color="#050606" />
                ) : (
                  <Feather name="github" size={24} color="#050606" />
                )}
                <Text className="ml-3 text-xl font-black text-gp-canvas">
                  {isSigningIn ? "Connecting GitHub" : "Continue with GitHub"}
                </Text>
              </Pressable>

              {authError ? (
                <Text className="mt-4 text-center text-sm font-semibold text-gp-danger">
                  {authError}
                </Text>
              ) : null}

              <Text className="mt-5 text-center text-sm leading-5 text-gp-muted">
                We only need GitHub access to read your public activity and protect your
                streak.
              </Text>
            </View>
          );
        }
