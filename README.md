# TailorAI - AI-Powered Resume Optimizer

TailorAI is an AI-powered job application assistant that helps users track applications, auto-format job descriptions into markdown, and intelligently tailor resumes to match each job using OpenAI.

## Features

- 🤖 **AI-Powered Resume Optimization** - Automatically tailor your resume to match any job description
- 💾 **Save & Organize** - Keep track of all your tailored resumes and job applications
- ⚡ **Instant Results** - Get your optimized resume in seconds
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Beautiful UI** - Modern, sleek design with smooth animations
- 🔒 **Secure** - Your data is private and secure

## Screenshots

### Landing Page
The landing page features a modern gradient design, showcasing the key features of TailorAI.

### Registration Page
A clean, responsive registration form with validation and social login options.

## Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

Make sure you have the following installed:
- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)

To check if you have Node.js and npm installed, run:
```bash
node --version
npm --version
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mcuellar/tailorai.git
   cd tailorai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Running Locally

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   
   The application will be running at `http://localhost:5173/`
   
   You should see the TailorAI landing page!

### Available Scripts

- `npm run dev` - Starts the development server with hot reload
- `npm run build` - Builds the app for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
tailorai/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx      # Main landing page component
│   │   ├── LandingPage.css      # Landing page styles
│   │   ├── Register.jsx         # Registration page component
│   │   └── Register.css         # Registration page styles
│   ├── App.jsx                  # Main app component with routing
│   ├── App.css                  # App-level styles
│   ├── index.css                # Global styles
│   └── main.jsx                 # Application entry point
├── public/                      # Static assets
├── index.html                   # HTML template
├── package.json                 # Project dependencies
├── vite.config.js              # Vite configuration
└── README.md                    # This file
```

## Technology Stack

- **React 19** - Modern JavaScript library for building user interfaces
- **Vite** - Next-generation frontend build tool (blazing fast!)
- **React Router** - Client-side routing
- **CSS3** - Modern styling with gradients, animations, and flexbox/grid

## Features in Detail

### Landing Page
- Hero section with compelling value proposition
- Features grid showcasing key benefits
- How it works section with step-by-step guide
- Call-to-action sections
- Responsive navigation
- Smooth scrolling and animations

### Registration Page
- Form validation
- Responsive two-column layout
- Social login buttons (UI only - not functional in demo)
- Beautiful gradient background
- Mobile-responsive design

## Browser Support

TailorAI works on all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- [ ] Actual AI integration with OpenAI
- [ ] User authentication and backend
- [ ] Resume upload and parsing
- [ ] Job description analysis
- [ ] Resume templates
- [ ] Application tracking dashboard
- [ ] Export to PDF

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

For questions or feedback, please open an issue on GitHub.

---

Built with ❤️ using React and Vite
