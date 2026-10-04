const paths = {
  "arrow-up-right": "M7 17 17 7M7 7h10v10",
  "arrow-left": "M19 12H5m0 0 6-6m-6 6 6 6",
  "arrow-right": "M5 12h14m0 0-6-6m6 6-6 6",
  plus: "M12 5v14M5 12h14",
  star: "M12 2v20M2 12h20M5 5l14 14M5 19 19 5",
};

export default function Icon({ name, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
