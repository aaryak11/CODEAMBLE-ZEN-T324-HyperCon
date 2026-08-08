export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#F5F1E8",        // warm off-white background
        surface: "#FFFFFF",     // card background
        ink: "#1A1A1A",         // near-black text/borders
        subcopy: "#1F3D2B",     // dark forest green / dark-green-gray for intentional secondary text
        accent: "#16A34A",      // single bold accent — fresh produce green
        accentSoft: "#DCFCE7",  // accent tint for badges/backgrounds
        sage: "#A8B89A",        // secondary earthy tone (freshness, not competing with accent)
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        lg: "12px",   // cap it here — no rounded-2xl/3xl anywhere
      },
      boxShadow: {
        brutal: "4px 4px 0 0 #1A1A1A",
        "brutal-sm": "2px 2px 0 0 #1A1A1A",
        "brutal-lg": "6px 6px 0 0 #1A1A1A",
      },
      borderWidth: { 3: "3px" },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"], // chunky headings
        sans: ["'Inter'", "sans-serif"],             // body text
      },
    },
  },
  plugins: [],
};
