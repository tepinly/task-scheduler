class EventEmitter {
	private listeners: Map<string, Function[]> = new Map()

	subscribe(event: string, callback: Function) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, [])
		}
		this.listeners.get(event)?.push(callback)
	}

	emit(event: string, data: any) {
		this.listeners.get(event)?.forEach((callback) => callback(data))
	}
}

export default EventEmitter
