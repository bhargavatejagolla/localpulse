# 🏙️ LocalPulse — DevFusion 3.O Hackathon Winner 🏆

**DevFusion 3.O | The Developers Hackathon — Problem Statement #26ENLP4 (Civic Tech / Hyperlocal Community)**

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq_AI-000000?style=for-the-badge&logo=openai&logoColor=white" />
</p>

---

## 🎯 The Problem

In Tier-2 and Tier-3 Indian cities (e.g., Kanpur, Meerut, Jodhpur, Nagpur), civic issues go unreported for months. Local events are buried in random WhatsApp groups, and finding reliable service providers depends entirely on word of mouth. 

There is **no structured, geo-aware platform** to report, discover, and connect within a specific neighborhood.

## ✨ The Solution: LocalPulse

**LocalPulse** is a hyperlocal community platform where *everything* is filtered by a dynamic radius. You only see what is happening right in your neighborhood.

We didn't just build a prototype; we built a **production-ready, premium mobile application** with real-time push notifications, buttery-smooth animations, and robust Android compatibility.

### 🏆 Core Hackathon Features (100% Implemented)

1. 📍 **Location-Based Onboarding:** The app detects your precise GPS location and lets you set a dynamic viewing radius (1 km, 3 km, 5 km, 10 km).
2. 📸 **Smart Issue Reporting:** Users can submit civic problems with a photo, description, and geo-tag. We engineered a custom binary image uploader (`expo-file-system`) guaranteeing zero "Network Request Failed" crashes.
3. 🤖 **AI-Powered Classification:** Powered by the Groq LLaMA API, the app automatically analyzes report photos to categorize the issue (roads, water, electricity, safety, sanitation) and assess its severity.
4. 🗺️ **Community Feed & Sorting:** A beautifully animated feed displaying all reports within your radius. Includes a premium toggle to sort by **Recent** or **Top Voted**.
5. 👍 **Upvote & Comment System:** Residents can upvote issues to signal urgency to authorities.
6. 👤 **Anonymous Posting:** For sensitive safety issues, users can hide their identity.
7. 📅 **Local Events Board:** NGOs, colleges, and RWAs can broadcast upcoming events.
8. 🔧 **Service Provider Directory:** A built-in directory for finding nearby plumbers, electricians, and tutors.
9. 🛡️ **Authority Dashboard:** Admin accounts can manage issue statuses (Open → Under Review → In Progress → Resolved).
10. 🔔 **Live Push Notifications:** Using Expo's Push API, users are instantly notified via a live phone notification whenever an authority updates the status of an issue they reported!

### 💎 Premium UX Upgrades (Beyond the Prompt)
- **Micro-Animations:** Implemented React Native `Animated` API for buttery-smooth `FadeInUp` physics when scrolling the community feed.
- **Flawless Android Compatibility:** Utilized `react-native-safe-area-context` to dynamically detect hardware/software navigation buttons on any Android device, guaranteeing the bottom tab bar never overlaps system buttons.
- **Premium Aesthetics:** Custom-designed emerald green AI logo, modern shadows, rounded components, and dynamic "Safe Zone" empty states.

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** React Native (Expo SDK 54), React Navigation, React Native Paper
- **Backend (BaaS):** Supabase
- **Database:** PostgreSQL with **PostGIS** for highly-efficient spatial/radius queries (`st_dwithin`)
- **Real-time Engine:** Supabase Postgres Changes
- **AI Processing:** Groq API
- **Deployment:** EAS Build (APK)

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

### Building the APK
```bash
eas build --platform android --profile preview
```

---

## 👥 Team
**Bhargava Teja** - Lead Developer  
*Built for DevFusion 3.O | The Developers Hackathon | IIT Bombay*
