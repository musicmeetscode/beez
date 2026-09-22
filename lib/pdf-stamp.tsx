import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  stamp: {
    position: "absolute",
    top: 330,
    left: 177,
    width: 242,
    height: 94,
    border: "4 solid #5d7830",
    borderRadius: 47,
    padding: 7,
    opacity: 0.12,
    transform: "rotate(-16deg)",
    zIndex: 0,
  },
  inner: {
    height: "100%",
    border: "2 solid #5d7830",
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#35471e", fontSize: 21, fontWeight: 700, letterSpacing: 3 },
  detail: {
    color: "#35471e",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 2,
    marginTop: 4,
  },
});

export function PdfStamp({
  label,
  title = "OFFICIAL",
}: {
  label: string;
  title?: string;
}) {
  return (
    <View fixed style={styles.stamp}>
      <View style={styles.inner}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{label.toUpperCase()}</Text>
      </View>
    </View>
  );
}
