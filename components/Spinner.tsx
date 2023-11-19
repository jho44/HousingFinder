import styles from "./Spinner.module.css";

export default function Spinner({
  size = "25px",
  bgColor = "#18191a",
  color = "#7A7E81",
}) {
  const moreStyles = {
    "--bg-color": bgColor,
    "--color": color,
    "--size": size,
    "--thickness": "-15%",
  } as React.CSSProperties;

  return <div className={styles.spinner} style={moreStyles} />;
}
