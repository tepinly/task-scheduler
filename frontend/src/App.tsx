import { ThemeProvider } from './components/theme-provider'
import { ModeToggle } from './components/mode-toggle'
import { QueueList } from './components/queue-list'

function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<div className="flex flex-col min-h-screen m-8">
				<ModeToggle />
				<QueueList />
			</div>
		</ThemeProvider>
	)
}

export default App
