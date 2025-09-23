# Development Notes - HubAI Trader

## Project Setup Commands

### Initial Setup
```bash
# Initialize project
npm init -y

# Install dependencies
npm install express cors helmet morgan dotenv
npm install -D typescript @types/node @types/express @types/cors nodemon ts-node

# Setup TypeScript
npx tsc --init

# Create folder structure
mkdir src src/controllers src/middleware src/models src/routes src/services
mkdir src/types src/utils
```

### Database Setup
```bash
# Install PostgreSQL dependencies
npm install pg @types/pg

# Install migration tool
npm install -D db-migrate db-migrate-pg
```

### Frontend Setup
```bash
# Create React app
npx create-react-app frontend --template typescript

# Install additional dependencies
cd frontend
npm install axios react-router-dom @types/react-router-dom
npm install -D tailwindcss postcss autoprefixer
```

## Development Commands

### Backend
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Frontend
```bash
# Start development server
npm start

# Build for production
npm run build
```

## Environment Variables
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/hubaitrader

# JWT
JWT_SECRET=your-secret-key

# API Keys
BITGET_API_URL=https://api.bitget.com
```

## Testing Commands
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- --grep "authentication"
```
