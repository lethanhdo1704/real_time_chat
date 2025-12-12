export default function NotFound() {
  return (
    <div style={{ 
      color: "white",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column"
    }}>
      <h1 className="H1_Notfound">404 - Page Not Found</h1>
      <p className="p_Notfound">The page you are looking for does not exist.</p>
      <a href="/" >Go Home</a>
    </div>
  );
}
