# medai-backend
MedAI - Backend API
🚀 Project Overview
This repository contains the backend API for the MedAI mobile application. Built with Node.js and Express, this API serves as the central hub for user management, health record storage, and communication with the deployed ML model for Cardiovascular Disease (CVD) risk prediction.

✨ Features
User Authentication: Secure user registration and login using JWT (JSON Web Tokens).

Patient Profile Management: CRUD (Create, Read, Update, Delete) operations for patient profiles.

Health Record Management: Routes to store and retrieve various types of patient health data (e.g., blood pressure, glucose).

ML Integration: A dedicated endpoint to send patient data to a separate, deployed ML model and return the risk prediction to the frontend.

Data Validation: Robust input validation using express-validator to ensure data integrity and security.

Secure & Scalable: Uses bcrypt for password hashing and is structured to handle API requests efficiently.

Environment-based Configuration: Utilizes a .env file for managing sensitive information and service URLs.

🛠️ Technologies Used
Node.js: JavaScript runtime environment.

Express.js: Web framework for building the API.

MongoDB: NoSQL database for data storage.

Mongoose: ODM (Object Data Modeling) library for MongoDB.

bcrypt: For hashing passwords.

jsonwebtoken (JWT): For user authentication.

express-validator: For input data validation.

axios: For making API calls to the deployed ML model.

dotenv: For loading environment variables from a .env file.

⚙️ Setup and Installation
Follow these steps to get the backend running on your local machine.

Prerequisites
Node.js (v18 or higher recommended)

npm (or yarn)

MongoDB (A local instance or a cloud service like MongoDB Atlas)

1. Clone the repository
Bash

git clone https://github.com/YourGitHubUsername/MedAI-Backend.git
cd MedAI-Backend
(Replace YourGitHubUsername with your actual GitHub username)

2. Install dependencies
Bash

npm install
3. Create the .env file
Create a file named .env in the root directory and add the following configuration variables. You'll need to fill in the values yourself.

NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/medai
JWT_SECRET=a_super_secret_jwt_key
FLASK_ML_SERVICE_URL=https://medai-ml.onrender.com
MONGO_URI: The connection string for your MongoDB database.

JWT_SECRET: A strong, random string for signing JWTs.

FLASK_ML_SERVICE_URL: The public URL of your deployed ML model.

4. Run the application
Bash

npm run dev
The server will start and run on the port specified in your .env file (e.g., http://localhost:5000).

💻 API Endpoints
The API is structured with clear and descriptive endpoints. All routes are prefixed with /api.

Endpoint	Method	Description
/api/users	POST	Register a new user.
/api/users/login	POST	Authenticate and log in a user.
/api/users/me	GET	Get the logged-in user's profile.
/api/patients/:patientId	GET/PUT/DELETE	Manage a specific patient profile.
/api/healthrecords/:patientId	POST/GET	Add or retrieve all health records for a patient.
/api/healthrecords/:patientId/predict-cvd-risk	POST	Predict CVD risk using the ML model.

Export to Sheets
☁️ Deployment
This Node.js backend can be deployed to various cloud providers such as Render, Heroku, or Google Cloud Platform. When deploying, ensure you configure the environment variables in the cloud service's settings.

🤝 Contribution
Contributions are welcome! Please fork this repository and submit a pull request with your changes.

📄 License
MIT License

📧 Contact
For questions or inquiries, please contact shourjyochakraborty2006@gmail.com.