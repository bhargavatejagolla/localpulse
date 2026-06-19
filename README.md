# 🏙️ LocalPulse

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

### 🏆 Hackathon Core Features (Fully Implemented)

1. 📍 **Location-Based Onboarding & Configurable Radius:** The app detects your location and lets you set a dynamic viewing radius (1 km, 3 km, 5 km, 10 km). Everything in the app scales to this radius instantly.
2. 📸 **Smart Issue Reporting:** Users can submit civic problems with a photo and geo-tag.
3. 🤖 **AI-Powered Classification & Duplicate Detection:** Powered by the Groq LLaMA 3.2 Vision API, the app automatically analyzes report photos to categorize the issue (roads, water, electricity, safety, sanitation) and assess its severity (low, medium, high, critical). It also detects if the same issue was recently reported nearby.
4. 🗺️ **Real-Time Community Feed & Map:** A live, auto-updating feed and interactive Map view (using Google Maps / React Native Maps) showing all reports within the chosen radius.
5. 👍 **Upvote & Comment System:** Residents can upvote issues to signal urgency to authorities and add context.
6. 👤 **Anonymous Posting:** For sensitive issues (like safety complaints), users can hide their identity.
7. 📅 **Local Events Board:** NGOs, colleges, and RWAs can broadcast upcoming events in the area.
8. 🔧 **Service Provider Directory:** A built-in directory for finding nearby plumbers, electricians, and tutors.
9. 🛡️ **Authority Dashboard & Status Flow:** Admin accounts can manage issue statuses (Open → Under Review → In Progress → Resolved).
10. 🔔 **Push Notifications:** Users are notified via Expo Push Notifications (powered by a Supabase Edge Function trigger) whenever an issue they follow updates its status.
11. 📊 **Civic Analytics:** An automatically updating dashboard showing the resolution rate and category breakdown of local issues.

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** React Native (Expo SDK 54), React Navigation, React Native Paper, React Native Maps
- **Backend (BaaS):** Supabase
- **Database:** PostgreSQL with **PostGIS** for spatial/radius queries (`st_dwithin`)
- **Real-time Engine:** Supabase Postgres Changes
- **AI Processing:** Groq SDK (LLaMA 3.2)
- **Cloud Functions:** Supabase Deno Edge Functions
- **Deployment:** EAS Build (APK)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/localpulse.git
cd localpulse/mobile

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

*(Note: To test the interactive Maps functionality, you must run an EAS development build or build the final APK, as `react-native-maps` native code is not bundled in the standard Expo Go sandbox).*

### Building the APK
```bash
eas build --platform android --profile preview
```

---

## 👥 Team
**Bhargava Teja** - Full Stack Developer  
*Built for DevFusion 3.O | The Developers Hackathon | IIT Bombay*
