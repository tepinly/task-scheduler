# Documentation WIP

- Run `docker compose up` in the `backend` folder to start mysql & dragonfly
- Run `npm run dev` in the `frontend` folder to start the frontend
- Import `TaskQueue` & `TaskWorker` classes from `backend/src/TaskQueue` and `backend/src/TaskWorker`
- Initialize `TaskWorker` with a name and an array of tasks desired to be executed
- Use `TaskQueue.addTask` to add dynamic tasks to the queue
- To optionally track the queues visually, run the UI dashboard with `npm run dev` in the `frontend` folder
