"use client";

export function FeedEmpty() {
  const cardStyle: React.CSSProperties = {
    height: "calc(100svh - var(--navbar-height))",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "1rem",
    paddingBottom: "1rem",
  };

  return (
    <div className="gap-4 p-6 text-center" style={cardStyle}>
      <h2 className="text-2xl font-semibold font-heading">
        Você completou a Bíblia!
      </h2>
      <p className="text-muted-foreground max-w-xs font-sans">
        Parabéns por concluir a leitura de toda a Bíblia.
      </p>
    </div>
  );
}
