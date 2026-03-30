# TalentLeague Mobile App

A modern mobile application with bottom navigation featuring Home, Jobs, Test, and Profile sections.

## 📱 Features

### 🏠 Home
- Welcome dashboard with user stats
- Profile completion percentage
- Recent activity feed
- Quick access to key metrics

### 💼 Jobs
- Browse available job opportunities
- Search and filter functionality
- Job details with company info
- Quick apply options

### 📝 Test
- View available assessment tests
- Track completed tests and scores
- Test difficulty indicators
- Start new assessments

### 👤 Profile
- Personal information management
- Professional details
- Skills showcase
- Resume upload
- Account settings

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the mobile app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## 📱 Mobile-First Design

The app is designed with a mobile-first approach:
- Bottom navigation for easy thumb access
- Responsive layouts optimized for mobile screens
- Touch-friendly interface elements
- Smooth transitions and micro-interactions

## 🎨 Design System

### Colors
- Primary: `#667eea` (TalentLeague Purple)
- Secondary: `#764ba2` (Deep Purple)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)
- Background: `#f8f9fa` (Light Gray)

### Typography
- Font: System fonts for optimal performance
- Weights: 400, 500, 600, 700
- Sizes: 12px, 14px, 16px, 18px, 20px, 24px, 28px

### Components
- Bottom Navigation
- Cards with shadows
- Buttons with hover states
- Form inputs
- Status badges

## 📂 Project Structure

```
mobile-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── BottomNav.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── JobsPage.tsx
│   │   ├── TestPage.tsx
│   │   └── ProfilePage.tsx
│   ├── App.tsx
│   ├── App.css
│   └── index.tsx
├── package.json
└── tsconfig.json
```

## 🔧 Development

### Adding New Pages
1. Create a new page component in `src/pages/`
2. Add the page to the navigation in `App.tsx`
3. Update the `BottomNav` component with the new tab

### Styling
- CSS modules are used for component-specific styles
- Global styles are in `App.css`
- Mobile-first responsive design principles

### Icons
- Lucide React icons are used throughout the app
- Import icons as needed in each component

## 📦 Build & Deploy

### Build for Production
```bash
npm run build
```

### Deploy
The build output will be in the `build/` directory and can be deployed to any static hosting service.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
