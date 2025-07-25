class TaskbaseElement extends HTMLElement {
  constructor() {
    super()
    const taskbase = window.indexedDB.open(TASKBASE_NAME, TASKBASE_VERSION)

    taskbase.onerror = (event) => {
      console.log(event.target.error)
    }

    taskbase.onsuccess = (event) => {
      console.log('Taskbase initialized.')

      // persist DB
      this.taskbase = event.target.result

      const transaction = this.taskbase.transaction([TASKBASE_STORE], 'readwrite')
      // Do something when all the data is added to the database.
      transaction.oncomplete = (event) => {
        console.log('Taskbase loading complete.')
        this.load()
      }

      transaction.onerror = (event) => {
        console.error(event.target.error)
      }
    }

    taskbase.onupgradeneeded = (event) => {
      console.log('Taskbase upgrade needed.')

      const taskbase = event.target.result

      taskbase.onerror = (event) => {
        console.error(event.target.error)
      }

      // Create an objectStore for this database
      const store = taskbase.createObjectStore(TASKBASE_STORE, {
        autoIncrement: true,
      })

      const addRequest = store.add(SEED_TASK)

      addRequest.onsuccess = (event) => {
        console.log(`Added task ${event.target.result}`)
      }

      addRequest.onerror = (event) => {
        console.error(event.target.error)
      }
    }

    this.addEventListener(EVENT_BRANCH, this.save.bind(this))
    this.addEventListener(EVENT_UPDATE, this.save.bind(this))
    this.addEventListener(EVENT_DELETE, this.save.bind(this))
    this.addEventListener(EVENT_EXPAND, this.save.bind(this))
  }

  save(event) {
    let taskElement = event.target

    for (let i = 0; i < event.target.task.task_path.length - 1; i++) {
      taskElement = taskElement.parentElement
    }

    const rootTask = taskElement.task

    const store = this.taskbase.transaction(TASKBASE_STORE, 'readwrite').objectStore(TASKBASE_STORE)
    const request = store.put(rootTask, rootTask.task_id)

    request.onsuccess = (event) => {
      console.log(`Updated task ${event.target.result}`)
    }

    request.onerror = (event) => {
      console.error(event.target.error)
    }
  }

  load() {
    console.log('Loading tasks...')

    const store = this.taskbase.transaction(TASKBASE_STORE).objectStore(TASKBASE_STORE)

    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result

      if (!cursor) {
        // No more items to iterate through
        console.log('Tasks loading complete.')
        return
      }

      const taskElement = renderTaskTree(cursor.value)
      this.appendChild(taskElement)

      cursor.continue()
    }
  }

  addRoot() {
    const store = this.taskbase.transaction(TASKBASE_STORE, 'readwrite').objectStore(TASKBASE_STORE)
    const task = structuredClone(NEW_TASK)

    //TODO: use IndexedDB keypath for task_id instead of correlating task-element length with database ID
    task.task_id = this.querySelectorAll('task-base > task-element').length + 1
    const request = store.add(task)

    request.onsuccess = (event) => {
      console.log(`Added task ${event.target.result}`)
      const taskElement = renderTaskTree(task)
      this.appendChild(taskElement)
    }

    request.onerror = (event) => {
      console.error(event.target.error)
    }
  }
}
