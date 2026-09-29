# AI Tool Disclosure

In accordance with the Tech-Triathlon 2026 rules, this document discloses the AI technologies used in the **Waypoint Lodestar** project by Team Adagard.

## 1. On-Device Voice Read-Aloud
**Where it is used:** Lodestar Run (Driver App) and Lodestar Dock (Loader App).
**Description:** We use `expo-speech` to provide offline text-to-speech (TTS) capabilities. This allows drivers and loaders to hear stop instructions, ETAs, and manifest lines aloud without needing to look at their screens. 
**Offline functionality:** Because this utilizes the OS-level native speech synthesis engine via Expo, it runs entirely on-device and works with zero network connectivity. English is supported natively; Sinhala and Tamil fall back to English-transliterated phonetic reading if native TTS packs are missing on the host device.

## 2. Computer-Vision Auto-Fill
**Where it is used:** Lodestar Run (Driver POD screen) and Lodestar Dock (Scan & Release screens).
**Description:** We use the device camera (`expo-camera`) to capture images of barcodes, reefer temperature displays, seal numbers, and damaged goods.
**Offline functionality:** In a production environment, an on-device TensorFlow Lite model would parse these images offline. For the hackathon build, the camera capture triggers an auto-fill simulation to demonstrate the UX pattern (user captures photo → UI populates fields → user confirms). This strictly follows the rule: "the person always confirms, and manual entry is the fallback."

## 3. General Development Assistance
- **LLMs:** Google Gemini was used during the Hackathon phase for rapid code scaffolding, React/Next.js component generation, and debugging the Docker compose orchestration.
- **Design Tools:** Figma's AI features were NOT used to generate the UI designs; all UI in the `Designing` folder was hand-crafted by Team Adagard.

*This disclosure covers all required aspects of the Tech-Triathlon AI usage policy.*
