# **Chat Room Application**

## **Description**
This is a **real-time chat room application** that allows multiple users to join and interact in real-time. Users can register, log in, update their profile information, create chatrooms, add other users to chatrooms, and send messages with text and images. Messages are persisted in a PostgreSQL database, and users can see when others are typing or active in the chatroom.

The application is built using the following technologies and libraries:

### **Tech Stack**
- **Backend**: NestJS, Prisma, PostgreSQL, GraphQL, GraphQL Redis Subscriptions
- **Frontend**: React, Redux, Apollo Client, Mantine Core, Zustand
- **Testing**: Jest for Unit Testing
- **Real-Time Communication**: WebSockets (GraphQL Redis Subscriptions)
- **Bonus**: Custom React Hooks

---

## **User Requirements**
1. **User Authentication**:
   - Users can register with a username, email, and password.
   - Users can log in using their email and password.
   - JWT-based authentication ensures secure access.

2. **User Profile Management**:
   - Users can update their username.
   - Users can upload a profile picture.

3. **Chatroom Functionality**:
   - Users can create chatrooms with a name.
   - Users can add other users from the database to chatrooms.
   - Users can send messages with text and images.
   - Real-time message updates using **GraphQL Redis Subscriptions**.
   - Users can see when other users are typing.
   - Users can see which users are active in the chatroom.

4. **Data Persistence**:
   - Messages and chatroom data are stored in a PostgreSQL database.
   - Prisma ORM is used for database interactions.

5. **Real-Time Communication**:
   - **GraphQL Redis Subscriptions** enable real-time updates for messages and user activity.

6. **UI/UX**:
   - User-friendly interface built with **Mantine Core**.
   - State management using **Zustand** for a lightweight and efficient solution.

---

## **Technologies Used**
### **Backend**
- **NestJS**: A progressive Node.js framework for building efficient and scalable server-side applications.
- **Prisma**: A modern ORM for TypeScript and Node.js.
- **PostgreSQL**: A powerful, open-source relational database.
- **GraphQL**: A query language for APIs and a runtime for executing those queries.
- **GraphQL Redis Subscriptions**: Real-time communication using Redis for pub/sub.

### **Frontend**
- **React**: A JavaScript library for building user interfaces.
- **Apollo Client**: A comprehensive state management library for JavaScript that enables you to manage both local and remote data with GraphQL.
- **Mantine Core**: A modern React component library for building user interfaces.
- **Zustand**: A lightweight state management library for React.

### **Testing**
- **Jest**: A JavaScript testing framework for unit testing.

---

## **How to Run the Application**

### **Prerequisites**
1. **Docker**: Ensure Docker is installed and running on your machine.
2. **Node.js**: Install Node.js (v16 or higher).
3. **PostgreSQL**: A PostgreSQL database is required (can be run via Docker).
---

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
````
### **Step 2: Set Up the Backend**
Navigate to the backend directory:

```bash
cd backend
Install dependencies:
````
````bash
npm install
Set up environment variables:
````
Create a .env file in the backend directory.

Add the following variables:

````
DATABASE_URL="postgresql://user:password@localhost:5432/chatroom_db"
JWT_SECRET="your-jwt-secret"
REDIS_URL="redis://localhost:6379"
````
Start Docker and run the PostgreSQL and Redis containers:

````bash
docker-compose up -d
````
Run Prisma migrations:

bash
Copy
npx prisma migrate dev --name init
Start the backend server:

bash
Copy
npm run start:dev
### **Step 3: Set Up the Frontend**
Navigate to the frontend directory:

bash
Copy
cd ../frontend
Install dependencies:

bash
Copy
npm install
Set up environment variables:

Create a .env file in the frontend directory.

Add the following variables:

env
Copy
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000
Start the frontend development server:

bash
Copy
npm start
Step 4: Access the Application
Open your browser and navigate to http://localhost:3000.

Register a new user or log in with an existing account.

Create chatrooms, add users, and start chatting!

Testing
Backend Unit Tests
Navigate to the backend directory:

bash
Copy
cd backend
Run the tests:

bash
Copy
npm run test


## **Demo Video**
Watch the application in action:

[![Demo Video](https://youtu.be/hWJT24P5Xss)


Assumptions
Real-Time Updates:

GraphQL Redis Subscriptions are used for real-time message updates and user activity notifications.

Image Uploads:

Users can upload images as part of their profile or messages.

Multiple Chatrooms:

Users can create and join multiple chatrooms.

Active Users:

Users are considered active if they are connected to the chatroom via WebSocket.


Author
Jhonatan Bellaiza
jhonatan_bellaiza@hotmail.com
