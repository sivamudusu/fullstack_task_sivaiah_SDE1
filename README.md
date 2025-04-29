# Fullstack Todo Sivaiah Mudusu

## getting started
### Prerequisites

Before running the application, make sure you have the following installed:

- Node.js
- Docker(optional)
### Installation

1. Clone the repository

```bash
git clone 
```
2. Go to the project directory and install dependencies for both the client and backend

```bash
cd client
npm install
```

```bash
cd backend
npm install
```

3. Create a `.env` file in both the `client` and `server` directories and add the environment variables as shown in the `.env.example` files.

- mongodb+srv url is not seems to be working so i have tested with the mongodb docker instance

To start the mongodb docker instance go to root folder and run
```bash
    docker-compose up -d
```

then use below url in  `.env` file
```url
    mongodb://admin:adminpassword@localhost:27017/?authSource=admin
```

4. Start the backend

```bash
cd backend
npm run build
npm start
```

5. Start the client

```bash
cd client
npm run build
npm run preview
```