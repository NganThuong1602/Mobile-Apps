import { useEvent } from "expo";
import { Stack, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { isHttpUrl } from "../utils/validation";

// Tách thành component để hook video chỉ được gọi khi có URL hợp lệ.
function Player({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const { status, error } = useEvent(player, "statusChange", {
    status: player.status,
  });

  return (
    <View style={styles.playerArea}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        fullscreenOptions={{ enable: true }}
      />
      {status === "error" && (
        <Text style={styles.error}>
          Không thể phát video:{" "}
          {error?.message ?? "Hãy kiểm tra đường dẫn MP4."}
        </Text>
      )}
      <Pressable
        style={styles.button}
        onPress={() => (isPlaying ? player.pause() : player.play())}
      >
        <Text style={styles.buttonText}>
          {isPlaying ? "Tạm dừng" : "▶ Phát video"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function TrailerScreen() {
  const params = useLocalSearchParams<{ url?: string; title?: string }>();
  const url = Array.isArray(params.url) ? params.url[0] : params.url;
  const title = Array.isArray(params.title) ? params.title[0] : params.title;

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: "Xem trailer" }} />
      <Text style={styles.heading}>{title || "Trailer khóa học"}</Text>
      {url && isHttpUrl(url) ? (
        <Player url={url} />
      ) : (
        <Text style={styles.error}>
          URL trailer không hợp lệ hoặc đang trống.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f5f7fb", padding: 16, gap: 20 },
  heading: { fontSize: 20, fontWeight: "800", color: "#192841" },
  playerArea: { gap: 16 },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#121212",
    borderRadius: 10,
  },
  button: {
    backgroundColor: "#2456bf",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#be3145", lineHeight: 23 },
  back: { color: "#2456bf", fontWeight: "700" },
});
