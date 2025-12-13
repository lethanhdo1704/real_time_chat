import "../styles/NotFound.css";

export default function NotFound() {
  return (
    <div className="notfound-container">
      <div className="notfound-content">

        {/* 404 */}
        <div className="notfound-number">
          <h1>404</h1>
        </div>

        {/* Message */}
        <h2>Page Not Found</h2>

        <p>
          Oops! The page you're looking for seems to have wandered off into the digital void.
        </p>

        {/* Home Button */}
        <a href="/" className="home-btn">
          <svg
            className="home-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Go Back Home
        </a>

        {/* Decorative dots */}
        <div className="dots">
          <span></span>
          <span></span>
          <span></span>
        </div>

      </div>
    </div>
  );
}
