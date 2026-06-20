# 🏙️ LocalPulse
### AI-Powered Hyperlocal Civic Intelligence Platform

📍 Location-Based Reporting  |  🤖 AI Classification  |  🔔 Real-Time Notifications  |  🛠️ Local Service Discovery

**Built for DevFusion 3.0 | The Developers Hackathon — Problem Statement #26ENLP4**

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq_AI-000000?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" />
</p>

---

## 🎯 The Problem

In Tier-2 and Tier-3 Indian cities (e.g., Kanpur, Meerut, Jodhpur, Nagpur), civic issues go unreported for months. Local events are buried in random WhatsApp groups, and finding reliable service providers depends entirely on word of mouth. 

There is **no structured, geo-aware platform** to report, discover, and connect within a specific neighborhood.

## ✨ The Solution: LocalPulse

**LocalPulse** is a hyperlocal community platform where *everything* is filtered by a dynamic radius. You only see what is happening right in your neighborhood.

We didn't just build a prototype; we built a **production-ready, premium mobile application** with real-time push notifications, buttery-smooth animations, and robust Android compatibility.

---

## 📱 App Screens

| Login & Auth | Community Feed | Issue Report |
|-------------|----------------|--------------|
| <img src="https://via.placeholder.com/250x500?text=Login+Screen" width="200" /> | <img src="https://via.placeholder.com/250x500?text=Dynamic+Feed" width="200" /> | <img src="https://via.placeholder.com/250x500?text=Smart+Reporting" width="200" /> |

| Events Board | Service Directory | Profile & Analytics |
|--------------|-------------------|---------------------|
| <img src="https://via.placeholder.com/250x500?text=Events" width="200" /> | <img src="https://via.placeholder.com/250x500?text=Directory" width="200" /> | <img src="https://via.placeholder.com/250x500?text=Analytics" width="200" /> |

*(Replace placeholders with actual app screenshots)*

---

## 🎥 Demo Video

Watch the 3-minute full feature walkthrough:
**[▶️ Click here to watch the Demo Video]** *(Insert YouTube/Drive Link)*

---

## 🏗️ System Architecture

```text
┌─────────────────────┐
│   React Native App  │  (Frontend UI, Layout Animations, MapView)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Supabase Auth     │  (Google OAuth Provider)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PostgreSQL + GIS   │  (st_dwithin queries, Profiles, Issues)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Groq AI Engine   │  (LLaMA 3.2 Vision for Image Classification)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Push Notifications │  (Expo Server Integration)
└─────────────────────┘
```

---

## 📊 Technical Highlights

- **11 Database Tables:** Fully relational PostgreSQL schema.
- **PostGIS Spatial Queries:** Instant radius filtering up to 10 km.
- **Real-Time Push Notifications:** Instant updates using Expo API.
- **AI-Powered Classification:** Groq LLaMA models automatically tag severity and category from photos.
- **Secure Authentication:** Robust Session Management.
- **Smooth Physics:** React Native `Animated` used for 60fps micro-animations.
- **Dynamic Insets:** Full `react-native-safe-area-context` integration for modern Android navigation bars.

---

## 🌍 Impact

- **Faster Issue Resolution:** Direct pipeline to local authorities.
- **Increased Civic Participation:** Gamified upvoting and anonymous safety reporting.
- **Better Local Governance:** Data-driven analytics for ward leaders.
- **Stronger Communities:** Hyperlocal event discovery.
- **Trusted Local Ecosystems:** Verified local service providers.

---

## 🚀 Future Roadmap

- **Government API Integration:** Auto-forwarding critical complaints to municipal portals.
- **Community Heatmaps:** 🔴 High complaint areas, 🟠 Medium, 🟢 Safe zones.
- **AI Analytics Dashboard:** Identifying seasonal civic patterns (e.g., "Water complaints increase 18% in June").
- **Community Leader Badges:** Rewarding active citizens.

---

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/bhargavatejagolla/localpulse.git
cd localpulse/mobile

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

### Building the Final APK
```bash
eas build --platform android --profile preview
```

---

## 👨‍💻 Team

### Golla Bhargava Teja
**Lead Developer & System Architect**

- React Native Development
- Supabase Backend & Database Design
- PostGIS Implementation
- AI Vision Integration
- UI/UX Motion Design
- Deployment & DevOps

*Built for DevFusion 3.O | The Developers Hackathon | IIT Bombay*
