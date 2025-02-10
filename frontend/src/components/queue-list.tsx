import { useCallback, useEffect, useState } from 'react'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { PaginationNav } from './pagination-nav'
import { io } from 'socket.io-client'
import { DateTime } from 'luxon'
import { ChevronDown, Trash2 } from 'lucide-react'
import { Button } from './ui/button'

const socket = io('http://localhost:4000')

enum TaskStatus {
	WAITING = 'WAITING',
	ACTIVE = 'ACTIVE',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
}

interface Task {
	id: string
	name: string
	status: TaskStatus
	queue: { name: string }
	jobId: string
	createdAt: string
	updatedAt: string
}

const getStatusColor = (status: TaskStatus) => {
	switch (status) {
		case TaskStatus.WAITING:
			return 'bg-yellow-500 hover:bg-yellow-600'
		case TaskStatus.ACTIVE:
			return 'bg-green-500 hover:bg-green-600'
		case TaskStatus.COMPLETED:
			return 'bg-blue-500 hover:bg-blue-600'
		case TaskStatus.FAILED:
			return 'bg-red-500 hover:bg-red-600'
	}
}

export function QueueList() {
	const [tasks, setTasks] = useState<Task[]>([])
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(0)
	const itemsPerPage = 20
	const [taskAdded, setTaskAdded] = useState(false)
	const [filterStatus, setFilterStatus] = useState<TaskStatus | null>(null)

	const deleteTask = useCallback(
		async (taskId: string) => {
			socket.emit('deleteTask', taskId, currentPage, itemsPerPage, filterStatus)
		},
		[currentPage, filterStatus]
	)

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}

	const handleFilterStatusUpdate = (status: TaskStatus | null) => {
		setFilterStatus(status)
		setCurrentPage(1)
	}

	useEffect(() => {
		socket.emit('getTasks', {
			page: currentPage,
			itemsPerPage,
			taskStatus: filterStatus,
		})

		const handleTaskData = (response: { data: Task[]; count: number }) => {
			setTasks(response.data)
			setTotalPages(Math.ceil(response.count / itemsPerPage))
			console.log(response.count, response.data)
		}

		const handleTaskUpdated = (updatedTask: Task) => {
			setTasks((prevTasks) =>
				prevTasks.map((q) => (q.id === updatedTask.id ? updatedTask : q))
			)
		}

		const handleTaskAdded = () => {
			setTaskAdded((prev) => !prev)
		}

		socket.on('taskData', handleTaskData)
		socket.on('taskAdded', handleTaskAdded)
		socket.on('taskUpdated', handleTaskUpdated)

		return () => {
			socket.off('taskData', handleTaskData)
			socket.off('taskAdded', handleTaskAdded)
			socket.off('taskUpdated', handleTaskUpdated)
		}
	}, [currentPage, taskAdded, filterStatus])

	return (
		<div>
			<div className="my-2 flex items-center">
				Filter by
				<span className="mx-2" />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="w-[200px] justify-between">
							{filterStatus || 'All'}
							<ChevronDown className="ml-2 h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-[200px]">
						<DropdownMenuItem onSelect={() => handleFilterStatusUpdate(null)}>
							All
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => handleFilterStatusUpdate(TaskStatus.WAITING)}
						>
							Waiting
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => handleFilterStatusUpdate(TaskStatus.ACTIVE)}
						>
							Active
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => handleFilterStatusUpdate(TaskStatus.COMPLETED)}
						>
							Completed
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => handleFilterStatusUpdate(TaskStatus.FAILED)}
						>
							Failed
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<Table>
				<TableCaption>List of tasks and their statuses.</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Queue</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Runtime</TableHead>
						<TableHead>Created At</TableHead>
						<TableHead></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{tasks.map((task) => (
						<TableRow key={task.id}>
							<TableCell className="font-medium">{task.jobId}</TableCell>
							<TableCell>{task.name}</TableCell>
							<TableCell>{task.queue?.name.replace(/[{}]/g, '')}</TableCell>
							<TableCell>
								<Badge className={getStatusColor(task.status)}>
									{task.status}
								</Badge>
							</TableCell>
							<TableCell>
								{task.status === TaskStatus.COMPLETED ||
								task.status === TaskStatus.FAILED
									? DateTime.fromISO(task.updatedAt)
											.diff(DateTime.fromISO(task.createdAt), [
												'hours',
												'minutes',
												'seconds',
											])
											.toFormat('hh:mm:ss')
									: 'Running'}
							</TableCell>
							<TableCell>{new Date(task.createdAt).toLocaleString()}</TableCell>
							<TableCell>
								<button onClick={() => deleteTask(task.jobId)}>
									<Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
								</button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<PaginationNav
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={handlePageChange}
			/>
		</div>
	)
}
