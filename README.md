# HomeAI — AI-Powered Smart House Plan Generator

HomeAI is a full-stack architectural design application that generates intelligent, Vastu-compliant 2D architectural blueprints, interactive 3D WebGL visualizations, and cost estimations based on plot dimensions, facing direction, budget, and family preferences.

---

## 🌟 Key Features

1. **AI Smart House Plan Generator**:
   - Multi-step configurator for plot length & breadth, orientation (East, North, West, South, etc.), budget range, floors (1, 2, 3), bedroom configurations (1-5 BHK), bathrooms, kitchen styles, and lifestyle amenities.
   - Live generation status panel with progress tracking, space optimization algorithms, and Vastu compliance scoring.

2. **Interactive 2D Architectural Floor Plan (SVG Blueprint)**:
   - Floor switcher (Ground Floor, First Floor, Terrace).
   - Architectural dimension callouts (`16'0" x 14'0"`), wall thicknesses, and room square footage.
   - Swing-arc doors, triple-glazed windows, and furniture layout overlays (living sectional, king bed, dining, modular kitchen stove & sink, sanitaryware, car porch).
   - Compass rose orientation indicator and architectural scale bar (1:100 / feet).
   - Interactive room inspector with Vastu zone tags.

3. **Interactive 3D Three.js Visualization**:
   - 360° orbit rotation, pan, zoom, and live camera controls.
   - Slicing modes: **Cutaway Interior 3D** (open ceiling view with hardwood/marble flooring, wall partitions, and 3D furniture), **Exterior Modern Villa** (roof, cantilever pergola, glass balcony railings), and **First-Person Walkthrough Tour**.
   - Triple lighting system: **Daylight**, **Golden Hour Sunset**, and **Cozy Twilight Evening** with interior LED spots.
   - Viewport snapshot capture.

4. **AI Architectural Recommendations & Cost Estimation**:
   - Cross-ventilation airflow analysis and score.
   - Natural lighting & morning sun exposure optimization.
   - Usable carpet area ratio (e.g. 84% efficiency with zero corridor wastage).
   - Itemized turnkey construction cost breakdown (Civil/Structure, Flooring, Electrical/Plumbing, Finishing/Paint, Modular Kitchen/Interiors).

5. **Plan Comparison**:
   - Side-by-side evaluation of **Plan A** (Value & Compact), **Plan B** (Balanced Luxury — Recommended), and **Plan C** (Grand Estate).
   - Comparison highlight badges (Best Ventilation, More Natural Light, Higher Space Utility, Better Value).

6. **Firebase Authentication & Firestore Persistence**:
   - Google Sign-In with Firebase Auth.
   - Real-time cloud persistence of custom house plans and version history with Firestore security rules adhering to the 8 pillars of hardened ABAC security.

7. **Veo Walkthrough Generation (`veo-3.1-fast-generate-preview`)**:
   - Upload site/elevation photos or capture a 3D snapshot.
   - Aspect ratio selection: `16:9` (landscape) or `9:16` (portrait / mobile).
   - Camera motion prompting with presets.

8. **High-Thinking Architect Mode (`gemini-4-argon` / `ThinkingLevel.HIGH`)**:
   - In-depth structural engineering consultation for column-beam load bearing, foundation sizing, future vertical expansion, and advanced Vastu Shastra alignments.

9. **PDF Blueprint Export**:
   - Complete vector architectural drawing specification export including room schedule, project metrics, cost breakdown, and environmental guidelines using `jspdf`.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **3D Graphics**: Three.js (WebGL rendering, lighting, materials, and camera systems).
- **Backend**: Node.js, Express, tsx.
- **Database & Auth**: Firebase Firestore and Firebase Authentication.
- **AI Models**: Google GenAI SDK (`gemini-4-argon`, `gemini-3.8-flash`, `veo-3.1-fast-generate-preview`).
- **Exporting**: jsPDF.

---

## 🚀 Environment Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Ensure `GEMINI_API_KEY` is present in your environment secrets.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
   Server will boot on `http://localhost:3000`.
