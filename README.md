# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Screenshots

### Signup 
![screenshot](<img width="853" height="761" alt="image" src="https://github.com/user-attachments/assets/cb1f25c8-27b3-4207-9aff-900f9c8f0706" />
)

### Login
![screenshot](<img width="1385" height="842" alt="image" src="https://github.com/user-attachments/assets/2455f47c-3f97-4d31-81d9-64ebb8d79e1c" />
)

### Dashboard
![screenshot](<img width="1906" height="927" alt="image" src="https://github.com/user-attachments/assets/59d7311a-856a-42f3-aa66-15b4e9fff851" /> <img width="1904" height="912" alt="image" src="https://github.com/user-attachments/assets/79c057a8-6c05-4d24-946a-25292d093795" />
)

### Kanban Board
![screenshot](<img width="1584" height="888" alt="image" src="https://github.com/user-attachments/assets/a842342c-2083-4267-8cc6-fd70cb4e01ea" />
)

### Tasks
![screenshot](<img width="1721" height="915" alt="image" src="https://github.com/user-attachments/assets/cb065680-b1f5-42b3-8096-c72067ea7b20" />
)

## Live Demo 
https://task-workflow-manager-frontend.onrender.com

## 📌 How to Use the Application

1. **Sign Up First**
   - Create a new account using your name, email, and password.

2. **Log In**
   - After signing up, go to the **Login Page**.
   - Enter your registered email and password.
   - On successful login, you will be redirected to the **Dashboard**.

3. **Create Workflow Stages (Important Step)**
   - Before adding any tasks, first create the following four stages:
     - **Backlog**
     - **Todo**
     - **In Progress**
     - **Completed**

4. **Add a Task**
   - Go to the "Create Task" section.
   - Fill details → choose workflow stage → assign user → save.
   - After creating tasks, check the **Dashboard**.
   - You will now see tasks categorized under the correct stages.

5. **Explore Core Features**
   - **Add Comments** to tasks  
   - **Create Subtasks** (if enabled)  
   - **Edit or Delete Tasks**  
   - **Edit Workflow Stages**  
   - **Drag and Drop Tasks** between stages  
   - **Track Activity Logs** on the dashboard  
   - **Update Profile**  
   - **Logout**

This ensures you understand the complete flow of the application from signup to full task management.


