# TTTEnglishCenter Frontend

Production-grade Next.js 14 frontend for EduCore - Vietnamese English tutoring center management system.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Components:** Custom UI components (shadcn-style)
- **State Management:** React hooks
- **API Client:** Axios
- **Fonts:** IBM Plex Sans + Space Mono (Google Fonts)

## Design Philosophy

**Vietnamese Educational Heritage meets Modern Data**

- **Colors:** Warm amber accents inspired by Vietnamese pottery, deep slate for authority, cream backgrounds
- **Typography:** IBM Plex Sans (professional, Vietnamese character support) + Space Mono (monospace for data)
- **Layout:** Asymmetric cards, bold data displays, clean tables with hover depth
- **Animations:** Fade-in effects with staggered delays for smooth page loads

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout with sidebar & header
│   ├── page.tsx             # Dashboard with statistics
│   ├── teachers/
│   │   └── page.tsx         # Teachers list
│   ├── students/
│   │   └── page.tsx         # Students list
│   ├── classes/
│   │   └── page.tsx         # Classes overview
│   ├── enrollments/
│   │   └── page.tsx         # Enrollments tracking
│   └── globals.css          # Global styles & custom theme
├── components/
│   ├── ui/
│   │   ├── card.tsx         # Card component
│   │   ├── badge.tsx        # Badge for status indicators
│   │   └── button.tsx       # Button component
│   └── layout/
│       ├── Sidebar.tsx      # Navigation sidebar
│       └── Header.tsx       # Top header with search
├── lib/
│   ├── api.ts               # API client for backend
│   └── utils.ts             # Utility functions
├── types/
│   └── index.ts             # TypeScript interfaces
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

## Features Implemented

### ✅ Dashboard (/)
- Real-time statistics cards
- Payment cluster distribution
- Enrollment status breakdown
- Teacher workload overview

### ✅ Teachers (/teachers)
- List all teachers with pagination
- Role-based badges (Admin, Teacher, Assistant)
- Contact information (Phone, Zalo, WhatsApp)
- Specializations display
- Status indicators

### ✅ Students (/students)
- Student roster with pagination
- Vietnamese grade levels
- Parent contact details
- District-based location
- Payment cluster indicators

### ✅ Classes (/classes)
- Grid view of active classes
- 3-category education system support
- Schedule information (day, time)
- Enrollment capacity visualization
- Tuition information in VND

### ✅ Enrollments (/enrollments)
- Student-class relationships
- Attendance tracking
- Performance metrics
- Progress trends
- Discount information

## API Integration

All pages fetch data from the backend API:

```typescript
// Example: Fetching teachers
import { teachersAPI } from '@/lib/api';

const teachers = await teachersAPI.getAll({
  page: 1,
  per_page: 10,
  is_active: true,
});
```

Available API clients:
- `teachersAPI`
- `studentsAPI`
- `classesAPI`
- `enrollmentsAPI`
- `statsAPI`

## Styling Guide

### Colors (CSS Variables)

```css
--primary: 28 80% 52%        /* Amber */
--secondary: 220 13% 91%     /* Light slate */
--background: 36 39% 97%     /* Cream */
--foreground: 222 47% 11%    /* Dark slate */
```

### Typography

- **Headings:** IBM Plex Sans (font-sans)
- **Data/Codes:** Space Mono (font-mono)

### Animations

All page elements use fade-in animations with staggered delays:

```tsx
<div 
  className="animate-fade-in"
  style={{ animationDelay: `${index * 50}ms` }}
>
  {/* Content */}
</div>
```

## Vietnamese Context Features

- **Parent Contact Management:** Parent name, phone displayed prominently
- **District-Based Addressing:** Ho Chi Minh City districts
- **Vietnamese Grade Levels:** Primary 1-5, Secondary 6-9, High 10-12
- **VND Currency:** Proper Vietnamese Dong formatting
- **Communication Channels:** Zalo, WhatsApp support

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- Server Components by default
- Image optimization with Next.js Image
- CSS-only animations
- Pagination for large datasets
- Optimistic UI updates

## Future Enhancements (Days 5-10)

- [ ] React Query for caching & optimistic updates
- [ ] Student/Teacher/Class detail pages
- [ ] Create/Edit forms
- [ ] Search & advanced filtering
- [ ] ML predictions display
- [ ] Payment history tracking
- [ ] Attendance calendar
- [ ] Export to Excel/PDF
- [ ] Real-time notifications
- [ ] Mobile responsive improvements

## Notes

- Backend must be running on **http://localhost:8000**
- Port 3000 is default for frontend
- All data fetching happens client-side (can move to server components later)
- UUID primary keys from backend
- Soft deletes honored (is_active field)

## Troubleshooting

### Port 3000 already in use
```bash
npx kill-port 3000
# or
lsof -ti:3000 | xargs kill -9
```

### API connection errors
1. Verify backend is running: http://localhost:8000/docs
2. Check CORS settings in backend `.env`
3. Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### Build errors
```bash
# Clear cache
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```

## Contributing

This is a capstone project. For feedback or suggestions, please open an issue in the repository.

## License

MIT License - Educational purposes
