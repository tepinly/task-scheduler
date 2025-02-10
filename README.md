# Documentation WIP

- Run `docker compose up` in the `backend` folder to start mysql & dragonfly
- Run `npm run dev` in the `frontend` folder to start the frontend
- Import `TaskQueue` & `TaskWorker` classes from `backend/src/TaskQueue` and `backend/src/TaskWorker`
- Initialize `TaskWorker` with a name and an array of tasks desired to be executed
- Use `TaskQueue.addTask` to add tasks to the queue
