# Zimmery Booking Management System

This is a digital system for managing bookings for guesthouses (Zimmers), allowing for remote confirmation of reservations and signing of hosting agreements.

## Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)

## Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `src/environments/environment.ts` and add your Supabase credentials. For local development, you can use a structure like this:
    ```typescript
    // src/environments/environment.ts
    export const environment = {
      production: false,
      supabaseUrl: 'your_supabase_project_url',
      supabaseKey: 'your_supabase_anon_key'
    };
    ```

4.  **Run the development server:**
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:4200/`.

## Deployment to Vercel

This project is configured for easy deployment to Vercel.

1.  **Push your code to a GitHub repository.**

2.  **Import the repository into Vercel.**
    - Go to your Vercel dashboard and click "Add New... -> Project".
    - Select your GitHub repository.
    - Vercel should automatically detect it as an Angular project based on the `vercel.json` and `angular.json` files.

3.  **Configure Environment Variables in Vercel:**
    - In the project settings in Vercel, navigate to "Environment Variables".
    - Add the following variables. These are crucial for the production build.
      - `SUPABASE_URL`: Your Supabase project URL.
      - `SUPABASE_KEY`: Your Supabase public anonymous key.

4.  **Deploy.**
    Vercel will use the `npm run build` command and deploy the static files from the `dist/zimmery/browser` directory.

## Build Process

The `npm run build` command performs two steps:
1.  `node ./set-env.js`: This script reads `SUPABASE_URL` and `SUPABASE_KEY` from the Vercel environment and creates the `src/environments/environment.prod.ts` file needed by the Angular production build.
2.  `ng build --configuration production`: This command compiles the Angular application for production.
