# SoonerFlow - OU Class Manager 🌊

> I'm sick of using my uni's clunky UI for trying to make my schedule and manage classes/time constraints. I know other students agree, and hope this makes peoples lives at OU a little more convenient. Would love to work with any OU students who want to contribute :)

**Live Demo**: [https://soonerflow.vercel.app](https://soonerflow.vercel.app)

## 🚀 Tech Stack

- **Frontend**: NextJS 14, TypeScript, TailwindCSS, ShadcnUI/OrginUI
- **Backend**: FastAPI, Python, SQLAlchemy
- **Database**: PostgreSQL (Google Cloud SQL)
- **Authentication**: NextAuth.js (GitHub + Google OAuth)
- **Deployment**: 
  - Frontend: Vercel
  - Backend: Google Cloud Run
  - Database: Google Cloud SQL
- **Infrastructure**: Docker, Cloud Build

## ✨ Features

- 🔐 **Secure Authentication** - Login with GitHub or Google
- 📅 **Smart Scheduling** - Visual schedule builder with conflict detection
- 🎓 **Degree Planning** - Track progress toward your major requirements
- 📊 **Academic Dashboard** - GPA tracking, semester overview
- 👨‍🏫 **Professor Ratings** - Integrated RateMyProfessor data
- 📱 **Responsive Design** - Works on desktop and mobile
- ⚡ **Real-time Updates** - Live class availability and seat counts

## 🏗️ Project Structure

```
├── nextjs-app/           # Frontend (NextJS)
│   ├── app/             # App router pages
│   ├── components/      # React components
│   └── lib/             # Utilities and API client
├── backend/             # FastAPI backend
│   ├── routers/         # API route handlers
│   ├── services/        # Business logic
│   └── main.py          # FastAPI app entry point
├── database/            # Database models and migrations
├── scrapers/            # Data scraping utilities
├── Dockerfile           # Container configuration
└── env.yaml            # Deployment environment variables
```

## 🤝 Contributing

We'd love help from fellow OU students! Here's how to contribute:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test locally
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to your branch**: `git push origin feature/amazing-feature`
6. **Create a Pull Request**

### Ideas for Contributions

- 🎨 UI/UX improvements
- 📱 Mobile responsiveness enhancements
- 🔍 Advanced search and filtering
- 📧 Email notifications for schedule changes
- 🎯 Grade tracking and GPA calculator improvements
- 🗓️ Calendar integrations (Google Calendar, Outlook)

## 🐛 Issues & Feature Requests

Found a bug or have a feature request? Please [create an issue](https://github.com/your-username/ou-class-manager/issues) with:

- **Bug reports**: Steps to reproduce, expected vs actual behavior
- **Feature requests**: Use case, proposed solution, mockups (if applicable)

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- University of Oklahoma for being the inspiration (and frustration) behind this project
- All the OU students who provided feedback and feature ideas
- The open source community for the amazing tools that made this possible

---

**Built with ❤️ by OU students, for OU students**

*Boomer Sooner! 🏈*