# Deployment Instructions

This project is divided into two parts: a `server` (backend) and a `client` (frontend). To deploy this application, you will need to deploy both parts.

## Backend Deployment

1.  **Navigate to the `server` directory:**
    ```bash
    cd server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    npm start
    ```

    The server will start on port 5000 by default.

## Frontend Deployment

1.  **Navigate to the `client` directory:**
    ```bash
    cd client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Build the application for production:**
    ```bash
    npm run build
    ```

    This will create a `build` directory with the static files.

4.  **Serve the static files:**
    You can use a static file server like `serve` to serve the contents of the `build` directory.
    ```bash
    npx serve -s build
    ```

    The frontend will be available on port 3000 by default.

## Production Setup

In a production environment, you would typically run the backend server on a hosting provider (like Heroku, AWS, etc.) and serve the frontend's static files through a CDN or a web server like Nginx.
