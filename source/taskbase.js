class TaskbaseElement extends HTMLElement {
  constructor() {
    super()
    const taskbase = window.indexedDB.open(TASKBASE_NAME, TASKBASE_VERSION)

    taskbase.onerror = (event) => {
      console.log(event.target.error)
    }

    taskbase.onsuccess = (event) => {
      console.log('Taskbase initialized.')
      // save taskbase reference
      this.taskbase = event.target.result
      this.load()
    }

    taskbase.onupgradeneeded = (event) => {
      console.log('Taskbase upgrade needed.')

      const tb = event.target.result

      tb.onerror = (event) => {
        console.error(event.target.error)
      }

      // create an objectStore for tasks
      const taskStore = tb.createObjectStore(TASKBASE_STORE, {
        autoIncrement: true,
      })

      const addRequest = taskStore.add(SEED_TASK)

      addRequest.onsuccess = (event) => {
        console.log(`Added task ${event.target.result}`)
      }

      addRequest.onerror = (event) => {
        console.error(event.target.error)
      }
    }

    const saveEvents = [EVENT_BRANCH, EVENT_UPDATE, EVENT_DELETE, EVENT_EXPAND]
    saveEvents.forEach((eventName) => {
      this.addEventListener(eventName, this.save.bind(this))
    })
  }

  save(event) {
    const task = event.detail.task
    // grab root

    const taskStore = this.taskbase
      .transaction(TASKBASE_STORE, 'readwrite')
      .objectStore(TASKBASE_STORE)

    // root task delete
    if (event.type === EVENT_DELETE && event.detail?.is_root) {
      const deleteRequest = taskStore.delete(task.task_id)

      deleteRequest.onsuccess = (event) => {
        console.log(`Deleted task ${event.target.result}`)
      }

      deleteRequest.onerror = (event) => {
        console.error(event.target.error)
      }

      return
    }

    let rootTask = task
    while (rootTask.task_parent) {
      rootTask = task.task_parent
    }

    const rootElement = this.querySelector(`task-render > task-element[id="${rootTask.task_id}"`)

    // for (let i = 0; i < task.task_path.length - 1; i++) {
    //   rootElement = rootElement.parentElement
    // }

    const putRequest = taskStore.put(rootElement.task, task.task_id)

    putRequest.onsuccess = (event) => {
      console.log(`Updated task ${event.target.result}`)
    }

    putRequest.onerror = (event) => {
      console.error(event.target.error)
    }
  }

  load() {
    console.log('Loading tasks...')

    const taskStore = this.taskbase.transaction(TASKBASE_STORE).objectStore(TASKBASE_STORE)
    const tasKRenderElement = this.querySelector(TASK_RENDER)

    taskStore.openCursor().onsuccess = (event) => {
      const cursor = event.target.result

      if (!cursor) {
        console.log('Tasks loading complete.')
        return
      }

      const taskElement = tasKRenderElement.renderTaskTree(cursor.value)
      tasKRenderElement.appendChild(taskElement)

      cursor.continue()
    }
  }

  addRoot(renderTaskTree) {
    const task = structuredClone(NEW_TASK)
    const taskStore = this.taskbase
      .transaction(TASKBASE_STORE, 'readwrite')
      .objectStore(TASKBASE_STORE)

    //TODO: use IndexedDB keypath for task_id instead of correlating task-element length with database ID
    task.task_id = this.querySelectorAll('task-render > task-element').length + 1
    const addRequest = taskStore.add(task)

    addRequest.onsuccess = (event) => {
      console.log(`Added task ${event.target.result}`)
      const taskElement = renderTaskTree(task)
      this.querySelector('task-render').appendChild(taskElement)
    }

    addRequest.onerror = (event) => {
      console.error(event.target.error)
    }
  }
}
