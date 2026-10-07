# Management Armada

## 📋 Project Overview

Management Armada adalah sistem manajemen armada kendaraan berbasis web yang dirancang untuk memudahkan pengelolaan operasional kendaraan, driver, perjalanan, dan pelaporan. Sistem ini mengintegrasikan teknologi AI untuk analisis laporan foto dan menyediakan dashboard komprehensif untuk monitoring real-time.

**Tujuan Project:**
- Menyederhanakan proses manajemen armada kendaraan
- Meningkatkan transparansi operasional melalui tracking real-time
- Mengotomasi pelaporan dan dokumentasi perjalanan
- Menyediakan analisis data untuk pengambilan keputusan

## 🎯 Problem / Background

Perusahaan dengan armada kendaraan sering menghadapi tantangan dalam:
- Tracking lokasi dan status kendaraan secara real-time
- Dokumentasi dan verifikasi laporan perjalanan
- Manajemen jadwal maintenance dan perbaikan
- Analisis performa operasional dan keuangan
- Koordinasi antara dispatcher dan driver

Management Armada hadir untuk mengatasi masalah tersebut dengan menyediakan platform terpadu yang mendigitalisasi seluruh proses operasional armada.

## ✨ Features

### Core Features
- **Dashboard Real-time** - Monitoring status armada dan perjalanan secara real-time
- **Order Management** - Pembuatan dan tracking order perjalanan
- **Driver Management** - Manajemen data dan jadwal driver
- **Fleet Management** - Pengelolaan data kendaraan dan status operasional
- **Trip Tracking** - Detail tracking perjalanan dengan log aktivitas

### Advanced Features
- **AI Photo Analysis** - Analisis otomatis foto laporan menggunakan Google Gemini AI
- **Photo Report System** - Upload dan kompresi foto laporan dengan metadata
- **Auto-cleanup System** - Penghapusan otomatis foto expired (14 hari)
- **Status Badge System** - Visual indicator untuk status perjalanan
- **Maintenance Tracking** - Jadwal dan riwayat perbaikan kendaraan

### Reporting Features
- **Laporan Keuangan** - Analisis finansial operasional
- **Laporan Kinerja** - Evaluasi performa driver dan armada
- **Laporan AJK** - Laporan Anggaran, Jadwal, dan Keuangan
- **Invoice Management** - Pengelolaan invoice dan billing

## 🛠️ Tech Stack

### Frontend
- **Next.js** 16.2.12 - React framework dengan App Router
- **React** 19.2.8 - UI library
- **TypeScript** 5.8.2 - Type-safe JavaScript
- **Tailwind CSS** 4.1.14 - Utility-first CSS framework
- **Motion** 12.23.24 - Animation library
- **Lucide React** - Icon system
- **Recharts** 3.9.0 - Data visualization

### Backend & API
- **Next.js API Routes** - Serverless API endpoints
- **Sharp** 0.35.4 - Image processing dan kompresi
- **Google Gemini AI** (@google/genai) - AI analysis untuk foto laporan

### Development Tools
- **ESLint** - Code linting
- **Autoprefixer** - CSS vendor prefixing
- **tsx** - TypeScript execution
- **esbuild** - Fast bundler

## 🏗️ Architecture

```
┌─────────────────┐
│   Client Side   │
│  (React/Next)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│      Next.js App Router         │
│  ┌──────────┐  ┌──────────┐    │
│  │  Pages   │  │   API    │    │
│  └──────────┘  └────┬─────┘    │
└─────────────────────┼───────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌────────┐  ┌─────────┐  ┌─────────┐
    │ Sharp  │  │ Gemini  │  │  File   │
    │ Image  │  │   AI    │  │ Storage │
    └────────┘  └─────────┘  └─────────┘
```

### API Endpoints
- `POST /api/laporan-foto/upload` - Upload foto laporan dengan kompresi
- `GET /api/laporan-foto` - Retrieve foto laporan berdasarkan tripId

### Data Flow
1. User interaksi melalui React components
2. Request dikirim ke Next.js API routes
3. API melakukan processing (kompresi gambar, AI analysis)
4. Data disimpan ke file system dengan metadata
5. Response dikembalikan ke client untuk display

## 🎨 User Flow / How It Works

### 1. Dashboard View
```
Login → Dashboard → View Real-time Status
                  ↓
            Select Armada/Order
                  ↓
            View Details/Reports
```

### 2. Order Management Flow
```
Create Order → Assign Driver → Assign Vehicle
              ↓
         Start Trip → Track Progress → Upload Reports
              ↓
         Complete/Cancel Trip → Generate Invoice
```

### 3. Photo Report Flow
```
Driver Upload Photo → Auto Compress (Sharp)
         ↓
    Save to Storage → Generate Metadata
         ↓
    AI Analysis (Gemini) → Display Results
         ↓
    Auto-delete after 14 days
```

## 💻 Installation

### Prerequisites
- Node.js 18.x atau lebih tinggi
- npm atau yarn
- Git

### Steps

1. **Clone repository**
```bash
git clone <repository-url>
cd ManagementArmada
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

4. **Configure environment variables** (lihat section Configuration)

5. **Run development server**
```bash
npm run dev
```

6. **Open browser**
```
http://localhost:3000
```

### Build untuk Production
```bash
npm run build
npm start
```

## ⚙️ Configuration

### Environment Variables

Buat file `.env` di root project dengan konfigurasi berikut:

```env
# GEMINI_API_KEY: Required for AI photo analysis
# Dapatkan dari: https://makersuite.google.com/app/apikey
GEMINI_API_KEY="your_gemini_api_key_here"

# APP_URL: URL aplikasi untuk callbacks dan links
# Development: http://localhost:3000
# Production: https://your-domain.com
APP_URL="http://localhost:3000"
```

### Image Processing Configuration

Konfigurasi kompresi gambar di `app/api/laporan-foto/upload/route.ts`:

```typescript
const EXPIRES_DAYS = 14;      // Auto-delete setelah 14 hari
const MAX_DIMENSION = 1280;   // Max width/height
const JPEG_QUALITY = 80;      // Kualitas kompresi (1-100)
```

## 📁 Project Structure

```
ManagementArmada/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── laporan-foto/         # Photo report endpoints
│   │       ├── upload/           # Upload & compression
│   │       └── route.ts          # Get photos
│   ├── driver/                   # Driver-specific pages
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── src/                          # Source code
│   ├── components/               # React components
│   │   ├── AjkInvoiceTab.tsx     # Invoice management
│   │   ├── AjkScheduleTab.tsx    # Schedule management
│   │   ├── ArmadaTab.tsx         # Fleet management
│   │   ├── DetailPerjalanan.tsx  # Trip details & reports
│   │   ├── DriverTab.tsx         # Driver management
│   │   ├── LaporanAJK.tsx        # AJK reports
│   │   ├── LaporanKeuangan.tsx   # Financial reports
│   │   ├── LaporanKinerja.tsx    # Performance reports
│   │   ├── OrderTab.tsx          # Order management
│   │   ├── PerbaikanTab.tsx      # Maintenance tracking
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── StatusBadge.tsx       # Status indicators
│   │   ├── StatusTab.tsx         # Status overview
│   │   └── Toast.tsx             # Notifications
│   │
│   ├── hooks/                    # Custom React hooks
│   ├── assets/                   # Static assets
│   ├── App.tsx                   # Main app component
│   ├── types.ts                  # TypeScript definitions
│   └── index.css                 # Global styles
│
├── laporan-uploads/              # Photo storage directory
│   └── metadata.json             # Photo metadata
│
├── public/                       # Public static files
├── .env.example                  # Environment template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind config
└── next.config.ts                # Next.js config
```

## 🚀 Development Process

### Tech Stack Selection
- **Next.js** dipilih untuk kemudahan deployment dan SSR capabilities
- **TypeScript** untuk type safety dan better developer experience
- **Tailwind CSS** untuk rapid UI development
- **Sharp** untuk kompresi gambar yang efisien
- **Gemini AI** untuk analisis foto laporan yang akurat

### Key Implementation Decisions

1. **File-based Storage**
   - Menggunakan file system untuk penyimpanan foto
   - Metadata terpisah dalam JSON untuk query cepat
   - Auto-cleanup untuk manajemen storage

2. **Image Compression**
   - Resize max 1280px untuk balance kualitas/size
   - JPEG quality 80 menghasilkan ~300-400KB per foto
   - WebP support untuk browser modern

3. **Component Architecture**
   - Tab-based navigation untuk manajemen berbagai entities
   - Reusable components (StatusBadge, Toast)
   - Modal-based detail views

## 🎨 Features Highlight

### Photo Report System
- **Upload**: Multi-file upload support
- **Compression**: Auto-resize dan compress menggunakan Sharp
- **Storage**: File-based dengan metadata terstruktur
- **Expiration**: Auto-delete setelah 14 hari
- **AI Analysis**: Gemini AI untuk analisis konten foto

### Status Tracking
Status badge dengan color coding:
- 🟢 **Active** - Perjalanan sedang berlangsung
- 🟡 **Pending** - Menunggu konfirmasi
- 🔵 **Completed** - Perjalanan selesai
- 🔴 **Cancelled** - Perjalanan dibatalkan

## 🧪 Testing / Evaluation

### Development Testing
- Local testing pada port 3000
- Manual testing untuk setiap fitur utama
- Cross-browser compatibility check

### Image Compression Testing
- Input: 2-5MB original photos
- Output: ~300-400KB compressed (JPEG quality 80)
- Visual quality: Minimal degradation
- Processing time: <500ms per image

## 🔮 Future Improvements

### Short-term
- [ ] Real-time GPS tracking integration
- [ ] Push notifications untuk update status
- [ ] Export laporan ke PDF
- [ ] Mobile app (React Native)

### Long-term
- [ ] Predictive maintenance menggunakan AI
- [ ] Route optimization
- [ ] Fuel consumption tracking
- [ ] Driver behavior analysis
- [ ] Integration dengan sistem ERP

### Technical Improvements
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Redis caching untuk performance
- [ ] WebSocket untuk real-time updates
- [ ] Automated testing (Jest, Cypress)
- [ ] CI/CD pipeline

## 📚 Lessons Learned

### Technical Insights
1. **Image Optimization is Critical** - Raw photos bisa 2-5MB, kompresi dengan Sharp mengurangi 80-90% tanpa loss kualitas signifikan
2. **File-based Storage Tradeoffs** - Cocok untuk MVP, tapi perlu database untuk scale
3. **Type Safety Matters** - TypeScript mencegah banyak bugs di production
4. **Component Reusability** - Tab pattern mempercepat development fitur baru

### Best Practices Applied
- Separation of concerns (components, hooks, types)
- Error handling untuk setiap API call
- Loading states untuk better UX
- Responsive design untuk berbagai devices

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ using Next.js and TypeScript**
