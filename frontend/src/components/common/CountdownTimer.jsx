// frontend/src/components/common/CountdownTimer.jsx
export default function CountdownTimer({
  seconds,
  format = (s) => `${s}s`, // ✅ Default format function
  idleLabel,
  loading,
}) {
  if (seconds > 0) {
    return <span>{format(seconds)}</span>;
  }

  return <span>{idleLabel}</span>;
}